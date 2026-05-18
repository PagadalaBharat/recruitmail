import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// ─── Date helper ──────────────────────────────────────────────────────────────
const todayFormatted = () =>
  new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// ─── PII strip (before sending to Groq) ──────────────────────────────────────
function stripPII(text) {
  return text
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
    .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[PHONE REDACTED]')
    .replace(/\b\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi, '[DOB REDACTED]')
    .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, '[DOB REDACTED]')
}

// ─── PII extract (local only, never sent to Groq) ────────────────────────────
function extractPII(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  const phoneMatch = text.match(/(\+[\d\s\-().]{7,}\d|\b0\d[\d\s\-]{7,}\d)/)
  const dobMatch = text.match(/\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/i)
  const namePatternMatch = text.match(/(?:Full\s*Name|Name)\s*[:\-]\s*([^\n\r,]+)/i)
  const firstLineMatch = text.trim().split('\n').find(l => l.trim().length > 2 && l.trim().length < 60)
  const locationMatch = text.match(/(?:Present\s*(?:Staying\s*)?Location|Location|Address|City)\s*[:\-]\s*([^\n\r,]+(?:,\s*[^\n\r]+)?)/i)
  const nationalityMatch = text.match(/Nationality\s*[:\-]\s*([^\n\r,]+)/i)
  const eligibilityMatch = text.match(/Eligibility[^\n\r:]*[:\-]\s*([^\n\r]+)/i)
  const cvSourceMatch = text.match(/CV\s*Source\s*[:\-]\s*([^\n\r]+)/i)
  return {
    email: emailMatch ? emailMatch[0].trim() : '',
    phone: phoneMatch ? phoneMatch[0].trim() : '',
    dob: dobMatch ? dobMatch[0].trim() : '',
    name: namePatternMatch ? namePatternMatch[1].trim() : firstLineMatch ? firstLineMatch.trim() : '',
    location: locationMatch ? locationMatch[1].trim() : '',
    nationality: nationalityMatch ? nationalityMatch[1].trim() : '',
    eligibility: eligibilityMatch ? eligibilityMatch[1].trim() : '',
    cvSource: cvSourceMatch ? cvSourceMatch[1].trim() : '',
  }
}

// ─── PDF parser (browser, pdf.js CDN) ────────────────────────────────────────
async function parsePDF(file) {
  const pdfjsLib = window['pdfjs-dist/build/pdf']
  if (!pdfjsLib) throw new Error('PDF.js not loaded')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fullText += content.items.map(item => item.str).join(' ') + '\n'
  }
  return fullText
}

// ─── DOCX parser (browser, mammoth CDN) ──────────────────────────────────────
async function parseDOCX(file) {
  const mammoth = window.mammoth
  if (!mammoth) throw new Error('Mammoth not loaded')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

// ─── Candidate info builder ───────────────────────────────────────────────────
const buildCandidateInfo = (name) =>
  `${name || '[Candidate Name]'} is actively looking for new opportunities, as his recent project ended in Feb 2026.
Has no interviews/offers in the pipeline.
No planned vacations & his communication skills are good.
Has own Limited company to manage payroll in Sweden.`

// ─── Default form ─────────────────────────────────────────────────────────────
const FIXED_INTERVIEW = 'Candidate is available for interviews anytime during the week days with prior notice.'
const FIXED_JOIN_PREFIX = 'He can take up this project'

const EMPTY_FORM = {
  hiName: 'Mahesh',
  candidateName: '',
  role: '',
  location: '',
  mspName: '',
  programName: '',
  requisitionId: '',
  requisitionName: '',
  billRate: 'Open',
  buyRate: '',
  submittedRate: 'Please Suggest',
  candidateSubmitted: todayFormatted(),
  submissionDeadline: '',
  projectDuration: '',
  requirements: '',
  cvText: '',
  sizzlingLine1: '',
  sizzlingSkills: '',
  sizzlingLine2: '',
  sizzlingLine3: '',
  sizzlingExtra: `Fluent in English and Swedish both written and oral.
Available immediately (Project ended).
Lives in Stockholm, Sweden and is flexible to be onsite 3 days a week.`,
  candidateInfo: buildCandidateInfo(''),
  fullName: '',
  presentLocation: '',
  emailId: '',
  contactNumber: '',
  nationality: '',
  eligibility: '',
  cvSource: '',
  dob: '',
  joinNoteSuffix: 'immediately.',   // just the suffix after "He can take up this project"
}

// ─── HTML email builder ───────────────────────────────────────────────────────
function buildHtmlEmail(f) {
  const li = (text) =>
    `<li style="margin-bottom:5px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${text.replace(/^[•\-*]\s*/, '')}</li>`

  const bulletBlock = (text) =>
    text.split('\n').filter(l => l.trim()).map(l => li(l)).join('')

  const rows = [
    ['MSP Name', f.mspName],
    ['Program Name', f.programName],
    ['Requisition ID', f.requisitionId],
    ['Requisition Name', f.requisitionName],
    ['Bill Rate by client', f.billRate],
    ['Candidate Buy Rate', f.buyRate],
    ['Submitted Rate by Avance (with Margin)', f.submittedRate],
    ['Candidate Submitted', f.candidateSubmitted],
    ['Submission Deadline', f.submissionDeadline],
    ['Project Duration', f.projectDuration],
  ]

  const tableRows = rows.map(([k, v]) => `
    <tr>
      <td style="border:1px solid #cbd5e1;padding:8px 13px;background:#f8fafc;font-weight:600;width:46%;font-family:Arial,sans-serif;font-size:14px;color:#334155">${k}</td>
      <td style="border:1px solid #cbd5e1;padding:8px 13px;font-family:Arial,sans-serif;font-size:14px;color:#1e293b">${v || ''}</td>
    </tr>`).join('')

  const sizzlingLis = []
  if (f.sizzlingLine1) sizzlingLis.push(li(f.sizzlingLine1))
  if (f.sizzlingSkills) sizzlingLis.push(`<li style="margin-bottom:5px;font-family:Arial,sans-serif;font-size:14px"><strong>Skills:</strong> ${f.sizzlingSkills}</li>`)
  if (f.sizzlingLine2) sizzlingLis.push(li(f.sizzlingLine2))
  if (f.sizzlingLine3) sizzlingLis.push(li(f.sizzlingLine3))
  const extraLis = bulletBlock(f.sizzlingExtra)

  const detailLis = [
    f.fullName && li(`Full Name: ${f.fullName}`),
    f.presentLocation && li(`Present Staying Location: ${f.presentLocation}`),
    f.emailId && li(`Email ID: ${f.emailId}`),
    f.contactNumber && li(`Contact Number: ${f.contactNumber}`),
    f.nationality && li(`Nationality: ${f.nationality}`),
    f.eligibility && li(`Eligibility to Work in job location: ${f.eligibility}`),
    f.cvSource && li(`CV Source: ${f.cvSource}`),
    f.dob && li(`DOB: ${f.dob}`),
  ].filter(Boolean).join('')

  const interviewLine = `Interview: ${FIXED_INTERVIEW} ${FIXED_JOIN_PREFIX} ${f.joinNoteSuffix || 'immediately.'}`.trim()

  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#1e293b;max-width:720px">
  <p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 8px">Hi <strong>${f.hiName}</strong>,</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 16px">Please find the attached resume of <strong>${f.candidateName}</strong> for <strong>${f.role}</strong> role at <strong>${f.location}</strong>.</p>
  <table style="border-collapse:collapse;width:100%;margin:0 0 20px;border:1px solid #cbd5e1"><tbody>${tableRows}</tbody></table>
  ${bulletBlock(f.requirements) ? `<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Requirements:</p><ul style="margin:0 0 16px 20px;padding:0">${bulletBlock(f.requirements)}</ul>` : ''}
  <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Sizzling:</p>
  <ul style="margin:0 0 16px 20px;padding:0">${sizzlingLis.join('')}${extraLis}</ul>
  <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Candidate Information:</p>
  <ul style="margin:0 0 16px 20px;padding:0">${bulletBlock(f.candidateInfo)}</ul>
  ${detailLis ? `<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Details:</p><ul style="margin:0 0 16px 20px;padding:0">${detailLis}</ul>` : ''}
  <p style="background:#fef9c3;border-left:4px solid #f59e0b;padding:10px 16px;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;margin:0">${interviewLine}</p>
</div>`
}

async function copyHtmlToClipboard(html) {
  try {
    const blob = new Blob([html], { type: 'text/html' })
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])
  } catch {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    await navigator.clipboard.writeText(tmp.innerText)
  }
}

// ─── UI primitives ────────────────────────────────────────────────────────────
function Label({ children, hint, lock }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
      {children}
      {hint && <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-dim)', fontSize: 10.5 }}>{hint}</span>}
      {lock && <span style={{ fontSize: 10, background: 'var(--accent)', color: '#fff', padding: '1px 6px', borderRadius: 999, fontWeight: 700, letterSpacing: 0 }}>FIXED</span>}
    </label>
  )
}

function Inp({ value, onChange, placeholder, disabled }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      style={{
        width: '100%', background: disabled ? 'var(--surface2)' : 'var(--bg)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '9px 13px', color: disabled ? 'var(--text-muted)' : 'var(--text)',
        fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none',
        transition: 'border-color .2s', cursor: disabled ? 'not-allowed' : 'text',
        boxSizing: 'border-box',
      }}
      onFocus={e => { if (!disabled) e.target.style.borderColor = 'var(--accent)' }}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  )
}

function TA({ value, onChange, placeholder, rows = 3, glow }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{
        width: '100%',
        background: glow ? 'rgba(59,130,246,0.04)' : 'var(--bg)',
        border: `1px solid ${glow ? '#3b82f6' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '9px 13px', color: 'var(--text)',
        fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none',
        resize: 'vertical', lineHeight: 1.7, transition: 'border-color .2s', boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e => e.target.style.borderColor = glow ? '#3b82f6' : 'var(--border)'}
    />
  )
}

function Field({ label, hint, lock, children }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <Label hint={hint} lock={lock}>{label}</Label>
      {children}
    </div>
  )
}

function Card({ title, icon, children, glow, tag }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${glow ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 16,
      boxShadow: glow ? '0 0 0 1px var(--accent-glow),var(--shadow)' : 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: glow ? 'var(--accent2)' : 'var(--text)', flex: 1 }}>{title}</span>
        {tag && <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 999 }}>{tag}</span>}
      </div>
      {children}
    </div>
  )
}

function G2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}

function Alert({ type, children }) {
  const map = {
    green: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
    red: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#f87171' },
    blue: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
  }
  const c = map[type]
  return (
    <div style={{ padding: '9px 13px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text, fontSize: 12.5, marginTop: 10 }}>
      {children}
    </div>
  )
}

// ─── Join Note component (shows fixed prefix, editable suffix) ────────────────
function JoinNoteField({ value, onChange }) {
  return (
    <div>
      <Label hint="suffix is editable">Joining Note</Label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg)' }}
        onFocus={() => {}} >
        {/* Fixed prefix — visually looks like part of the input */}
        <span style={{
          padding: '9px 10px 9px 13px', background: 'var(--surface2)',
          color: 'var(--text-muted)', fontSize: 13.5, fontFamily: 'var(--font-body)',
          whiteSpace: 'nowrap', borderRight: '1px solid var(--border)', flexShrink: 0,
        }}>
          {FIXED_JOIN_PREFIX}
        </span>
        {/* Editable suffix */}
        <input
          value={value}
          onChange={onChange}
          placeholder="immediately."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            padding: '9px 13px', color: 'var(--text)',
            fontFamily: 'var(--font-body)', fontSize: 13.5,
          }}
        />
      </div>
      <p style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4 }}>
        Preview: <em>Interview: {FIXED_INTERVIEW} {FIXED_JOIN_PREFIX} {value || 'immediately.'}</em>
      </p>
    </div>
  )
}

// ─── CV Uploader ──────────────────────────────────────────────────────────────
function CVUploader({ onExtracted, onTextReady }) {
  const [status, setStatus] = useState('idle')
  const [fileName, setFileName] = useState('')
  const [err, setErr] = useState('')
  const [pii, setPii] = useState(null)
  const ref = useRef()

  const process = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
      setStatus('error'); setErr('Only PDF, DOCX, DOC or TXT supported.'); return
    }
    setStatus('loading'); setFileName(file.name); setErr(''); setPii(null)
    try {
      let raw = ext === 'txt' ? await file.text()
        : ext === 'pdf' ? await parsePDF(file)
        : await parseDOCX(file)
      if (!raw.trim()) { setStatus('error'); setErr('No text extracted. Try another format.'); return }
      const found = extractPII(raw)
      setPii(found)
      onExtracted(found, raw)
      onTextReady(stripPII(raw))
      setStatus('done')
    } catch (e) { setStatus('error'); setErr(e.message || 'Parse failed.') }
  }

  return (
    <div>
      <div
        onDrop={e => { e.preventDefault(); process(e.dataTransfer.files[0]) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => ref.current.click()}
        style={{
          border: `2px dashed ${status === 'done' ? '#10b981' : status === 'error' ? '#ef4444' : 'var(--border)'}`,
          borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer',
          background: status === 'done' ? 'rgba(16,185,129,0.05)' : 'var(--bg)', transition: 'all .2s', marginBottom: 10,
        }}
      >
        <input ref={ref} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }}
          onChange={e => process(e.target.files[0])} />
        {status === 'idle' && <><div style={{ fontSize: 26, marginBottom: 6 }}>📄</div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Drop CV or click to browse</div><div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>PDF · DOCX · DOC · TXT</div></>}
        {status === 'loading' && <><SpinEl size={22} /><div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-muted)' }}>Parsing {fileName}…</div></>}
        {status === 'done' && <><div style={{ fontSize: 26, marginBottom: 4 }}>✅</div><div style={{ fontWeight: 700, fontSize: 13.5, color: '#10b981' }}>{fileName}</div><div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Parsed — PII filled locally, AI gets safe copy</div></>}
        {status === 'error' && <><div style={{ fontSize: 26, marginBottom: 4 }}>❌</div><div style={{ fontWeight: 700, fontSize: 12.5, color: '#ef4444' }}>{err}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Click to retry</div></>}
      </div>

      <Alert type="green">🔒 <strong>Privacy Safe:</strong> Email, Phone & DOB are extracted in your browser only and fill the form boxes. They are <strong>never sent to Groq AI</strong>.</Alert>

      {pii && status === 'done' && (
        <div style={{ marginTop: 8, padding: '9px 12px', background: 'var(--surface2)', borderRadius: 8, fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.9 }}>
          <strong style={{ color: 'var(--text)' }}>🔍 Auto-detected (local only):</strong><br />
          {pii.name && <span>👤 <strong style={{ color: 'var(--text)' }}>{pii.name}</strong>  </span>}
          {pii.email && <span>✉️ <strong style={{ color: 'var(--text)' }}>{pii.email}</strong>  </span>}
          {pii.phone && <span>📞 <strong style={{ color: 'var(--text)' }}>{pii.phone}</strong>  </span>}
          {pii.dob && <span>🎂 <strong style={{ color: 'var(--text)' }}>{pii.dob}</strong></span>}
        </div>
      )}
    </div>
  )
}

// ─── Email preview ────────────────────────────────────────────────────────────
function EmailPreview({ form }) {
  return (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '36px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
      dangerouslySetInnerHTML={{ __html: buildHtmlEmail(form) }} />
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [view, setView] = useState('form')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiSuccess, setAiSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setVal = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Role ↔ Requisition Name sync
  const setRole = e => { const v = e.target.value; setForm(f => ({ ...f, role: v, requisitionName: v })) }
  const setReqName = e => { const v = e.target.value; setForm(f => ({ ...f, requisitionName: v, role: v })) }

  // Candidate name → auto-update first line of candidateInfo + fullName
  const setCandName = e => {
    const name = e.target.value
    setForm(f => {
      const lines = f.candidateInfo.split('\n')
      // Always rebuild first line with new name
      lines[0] = `${name || '[Candidate Name]'} is actively looking for new opportunities, as his recent project ended in Feb 2026.`
      return { ...f, candidateName: name, fullName: name, candidateInfo: lines.join('\n') }
    })
  }

  // When candidateInfo is manually edited but candidateName changes later,
  // we only replace first line, preserving manual edits on other lines
  const setCandInfo = e => setForm(f => ({ ...f, candidateInfo: e.target.value }))

  // CV upload callbacks
  const handleExtracted = (pii, _raw) => {
    setForm(f => {
      const name = pii.name || f.candidateName
      const lines = f.candidateInfo.split('\n')
      lines[0] = `${name || '[Candidate Name]'} is actively looking for new opportunities, as his recent project ended in Feb 2026.`
      return {
        ...f,
        candidateName: name,
        fullName: name,
        emailId: pii.email || f.emailId,
        contactNumber: pii.phone || f.contactNumber,
        dob: pii.dob || f.dob,
        presentLocation: pii.location || f.presentLocation,
        nationality: pii.nationality || f.nationality,
        eligibility: pii.eligibility || f.eligibility,
        cvSource: pii.cvSource || f.cvSource,
        candidateInfo: lines.join('\n'),
      }
    })
  }

  const handleTextReady = safeText => setForm(f => ({ ...f, cvText: safeText }))

  // AI Generate
  const generateAI = async () => {
    if (!form.cvText.trim() || !form.requirements.trim()) {
      setAiError('Please upload a CV (or paste CV text) and fill Job Requirements first.'); return
    }
    setAiLoading(true); setAiError(''); setAiSuccess(false)
    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const { data } = await axios.post(`${apiBase}/api/generate-sizzling`, {
        cv_text: form.cvText,
        jd_text: form.requirements,
      })
      const [s1, s2, s3] = data.top_sentences
      setForm(f => ({
        ...f,
        candidateName: f.candidateName || data.candidate_name || '',
        fullName: f.fullName || data.candidate_name || '',
        sizzlingLine1: s1 || '',
        sizzlingLine2: s2 || '',
        sizzlingLine3: s3 || '',
        sizzlingSkills: data.skills.join(', '),
      }))
      setAiSuccess(true)
    } catch (err) {
      setAiError(err?.response?.data?.detail || 'AI generation failed. Check backend & GROQ_API_KEY.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleCopy = async () => {
    await copyHtmlToClipboard(buildHtmlEmail(form))
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  const reset = () => { if (window.confirm('Reset all fields?')) setForm(EMPTY_FORM) }

  // ── Render ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 28px', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1460, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✉️</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>RecruitMail</div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>AI-Powered · Privacy Safe</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {['form', 'preview'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5,
                background: view === v ? 'var(--accent)' : 'transparent',
                color: view === v ? '#fff' : 'var(--text-muted)', transition: 'all .2s',
              }}>{v === 'form' ? '📝 Form' : '👁 Preview'}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={ghostBtn}>Reset</button>
            <button onClick={handleCopy} style={copied ? successBtn : primaryBtn}>
              {copied ? '✓ Copied!' : '📋 Copy Email'}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1460, margin: '0 auto', padding: '22px 28px' }}>
        {view === 'form' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* ══ LEFT COLUMN ══ */}
            <div>
              {/* CV Upload */}
              <Card title="Upload Candidate CV" icon="📁" tag="AUTO-FILL">
                <CVUploader onExtracted={handleExtracted} onTextReady={handleTextReady} />
              </Card>

              {/* Greeting & Role */}
              <Card title="Greeting & Role" icon="👋">
                <G2>
                  <Field label="Hi (Recipient Name)" hint="default: Mahesh">
                    <Inp value={form.hiName} onChange={set('hiName')} placeholder="Mahesh" />
                  </Field>
                  <Field label="Candidate Name" hint="auto-fills on upload + info bullets">
                    <Inp value={form.candidateName} onChange={setCandName} placeholder="Ravi" />
                  </Field>
                  <Field label="Role / Position" hint="→ syncs Requisition Name">
                    <Inp value={form.role} onChange={setRole} placeholder="Operational QA Coordinator / Tester" />
                  </Field>
                  <Field label="Location">
                    <Inp value={form.location} onChange={set('location')} placeholder="Stockholm, Sweden" />
                  </Field>
                </G2>
              </Card>

              {/* Submission Details */}
              <Card title="Submission Details" icon="📋">
                <G2>
                  <Field label="MSP Name">
                    <Inp value={form.mspName} onChange={set('mspName')} placeholder="KeyMan AB" />
                  </Field>
                  <Field label="Program Name">
                    <Inp value={form.programName} onChange={set('programName')} placeholder="(optional)" />
                  </Field>
                  <Field label="Requisition ID">
                    <Inp value={form.requisitionId} onChange={set('requisitionId')} placeholder="HO287890" />
                  </Field>
                  <Field label="Requisition Name" hint="synced with Role">
                    <Inp value={form.requisitionName} onChange={setReqName} placeholder="auto-filled from Role" />
                  </Field>
                  <Field label="Bill Rate by Client" lock>
                    <Inp value={form.billRate} disabled />
                  </Field>
                  <Field label="Candidate Buy Rate">
                    <Inp value={form.buyRate} onChange={set('buyRate')} placeholder="Gross - 600 SEK/Hour" />
                  </Field>
                  <Field label="Submitted Rate (with Margin)" lock>
                    <Inp value={form.submittedRate} disabled />
                  </Field>
                  <Field label="Candidate Submitted">
                    <Inp value={form.candidateSubmitted} onChange={set('candidateSubmitted')} placeholder="14th Jun 2026" />
                  </Field>
                  <Field label="Submission Deadline">
                    <Inp value={form.submissionDeadline} onChange={set('submissionDeadline')} placeholder="13th Jun 2026" />
                  </Field>
                  <Field label="Project Duration">
                    <Inp value={form.projectDuration} onChange={set('projectDuration')} placeholder="2026-06-01 to 2027-03-31" />
                  </Field>
                </G2>
              </Card>

              {/* Candidate Details */}
              <Card title="Candidate Details" icon="🪪" tag="AUTO-FILL">
                <G2>
                  <Field label="Full Name" hint="auto-filled">
                    <Inp value={form.fullName} onChange={set('fullName')} placeholder="Ravi Kumar" />
                  </Field>
                  <Field label="Present Location" hint="auto-filled">
                    <Inp value={form.presentLocation} onChange={set('presentLocation')} placeholder="Stockholm, Sweden" />
                  </Field>
                  <Field label="Email ID" hint="🔒 local only">
                    <Inp value={form.emailId} onChange={set('emailId')} placeholder="ravi@gmail.com" />
                  </Field>
                  <Field label="Contact Number" hint="🔒 local only">
                    <Inp value={form.contactNumber} onChange={set('contactNumber')} placeholder="+46(0)760057444" />
                  </Field>
                  <Field label="Nationality" hint="auto-filled">
                    <Inp value={form.nationality} onChange={set('nationality')} placeholder="Swedish" />
                  </Field>
                  <Field label="Eligibility to Work" hint="auto-filled">
                    <Inp value={form.eligibility} onChange={set('eligibility')} placeholder="Yes, EU National" />
                  </Field>
                  <Field label="CV Source" hint="auto-filled">
                    <Inp value={form.cvSource} onChange={set('cvSource')} placeholder="LinkedIn" />
                  </Field>
                  <Field label="Date of Birth" hint="🔒 local only">
                    <Inp value={form.dob} onChange={set('dob')} placeholder="15th Mar 1975" />
                  </Field>
                </G2>

                {/* Interview note row */}
                <div style={{ marginTop: 6 }}>
                  <Field label="Interview Note" lock>
                    <Inp value={FIXED_INTERVIEW} disabled />
                  </Field>
                  {/* Join note with fixed prefix */}
                  <JoinNoteField
                    value={form.joinNoteSuffix}
                    onChange={set('joinNoteSuffix')}
                  />
                </div>
              </Card>
            </div>

            {/* ══ RIGHT COLUMN ══ */}
            <div>
              {/* JD */}
              <Card title="Job Requirements (from JD)" icon="📄">
                <Field label="Paste requirements — one per line">
                  <TA value={form.requirements} onChange={set('requirements')} rows={7}
                    placeholder={"Good experience in coordinating and following up on testing activities between teams\nExperience in performing End to End tests and other tests\nExperience in planning and coordination\nExperience in developing and analyzing KPIs\nExperience working in Jira or similar tools\nHave a good command of the Swedish language"} />
                </Field>
              </Card>

              {/* AI Sizzling */}
              <Card title="AI Sizzling Generator" icon="🤖" glow>
                <Alert type="blue">🛡️ <strong>Privacy safe:</strong> Email, phone & DOB are replaced with [REDACTED] before being sent to Groq AI.</Alert>

                <div style={{ marginTop: 12 }}>
                  <Field label="CV Text" hint="auto-filled on upload (PII stripped) — or paste manually">
                    <TA value={form.cvText} onChange={set('cvText')} rows={7}
                      placeholder="Upload a CV above, or paste CV text here. Email/phone will be auto-stripped before AI." />
                  </Field>
                </div>

                <button onClick={generateAI} disabled={aiLoading} style={{
                  width: '100%', padding: '11px', fontSize: 13.5, border: 'none', borderRadius: 9,
                  background: aiLoading ? '#374151' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
                  color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700,
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                  {aiLoading ? <><SpinEl />Generating — please wait…</> : '✨ Generate Sizzling with AI'}
                </button>

                {aiError && <Alert type="red">⚠️ {aiError}</Alert>}
                {aiSuccess && <Alert type="green">✅ AI complete! Review & edit the fields below.</Alert>}

                {/* ── Sizzling fields — multi-line textareas ── */}
                <div style={{ marginTop: 16 }}>
                  <Field label="Sizzling Line 1" hint="AI generated — fully editable">
                    <TA
                      value={form.sizzlingLine1}
                      onChange={set('sizzlingLine1')}
                      rows={3}
                      glow={!!form.sizzlingLine1}
                      placeholder={`Experienced Test Manager with more than 20 years of experience coordinating and following up on testing activities between teams, deliveries and projects, including test planning, coordination and communication with stakeholders in agile environments using Scrum, Kanban and SAFE.`}
                    />
                  </Field>

                  <Field label="Skills" hint="comma separated — AI generated — editable">
                    <TA
                      value={form.sizzlingSkills}
                      onChange={set('sizzlingSkills')}
                      rows={2}
                      glow={!!form.sizzlingSkills}
                      placeholder="Test Management, End to End Testing, System Testing, Integration Testing, Acceptance Testing, Regression Testing, Test Planning, Jira, Zephyr, HP ALM, SAFE, Scrum, Kanban, SQL, REST-services"
                    />
                  </Field>

                  <Field label="Sizzling Line 2" hint="AI generated — fully editable">
                    <TA
                      value={form.sizzlingLine2}
                      onChange={set('sizzlingLine2')}
                      rows={3}
                      glow={!!form.sizzlingLine2}
                      placeholder={`Proficient in developing and analyzing KPIs and test coverage in projects, administering test cases in Jira, Zephyr, HP ALM and ReQTest, and maintaining collaboration with vendors, CFO alignment and Risk Management across large scale enterprise programs.`}
                    />
                  </Field>

                  <Field label="Sizzling Line 3" hint="AI generated — fully editable">
                    <TA
                      value={form.sizzlingLine3}
                      onChange={set('sizzlingLine3')}
                      rows={3}
                      glow={!!form.sizzlingLine3}
                      placeholder={`Demonstrated hands-on testing of SQL databases, ETL flows, REST-services and complex integration-heavy systems within Banking, Retail and Healthcare sectors.`}
                    />
                  </Field>

                  <Field label="Additional Sizzling Bullets" hint="one per line — editable">
                    <TA value={form.sizzlingExtra} onChange={set('sizzlingExtra')} rows={4}
                      placeholder={"Fluent in English and Swedish both written and oral.\nAvailable immediately (Project ended).\nLives in Stockholm, Sweden and is flexible to be onsite 3 days a week."} />
                  </Field>
                </div>
              </Card>

              {/* Candidate Info — pre-filled & editable */}
              <Card title="Candidate Information Bullets" icon="ℹ️">
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                  💡 First line updates automatically when you type the <strong style={{ color: 'var(--text)' }}>Candidate Name</strong>. All lines are editable.
                </p>
                {/* Show current candidate name for clarity */}
                {form.candidateName && (
                  <div style={{ marginBottom: 8, padding: '6px 11px', background: 'rgba(59,130,246,0.08)', borderRadius: 7, fontSize: 12, color: 'var(--accent2)' }}>
                    👤 Candidate: <strong>{form.candidateName}</strong> — first bullet auto-reflects this name
                  </div>
                )}
                <TA
                  value={form.candidateInfo}
                  onChange={setCandInfo}
                  rows={6}
                  placeholder={buildCandidateInfo('Candidate Name')}
                />
              </Card>
            </div>
          </div>

        ) : (
          /* ── PREVIEW TAB ── */
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                📌 Click <strong style={{ color: 'var(--text)' }}>Copy Email</strong> then paste into Outlook or Gmail — the table renders correctly.
              </p>
              <button onClick={handleCopy} style={copied ? successBtn : primaryBtn}>
                {copied ? '✓ Copied!' : '📋 Copy Email (Outlook/Gmail ready)'}
              </button>
            </div>
            <EmailPreview form={form} />
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function SpinEl({ size = 15 }) {
  return <span style={{ width: size, height: size, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
}

const _base = { border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, padding: '8px 18px', transition: 'all .2s' }
const primaryBtn = { ..._base, background: 'var(--accent)', color: '#fff' }
const successBtn = { ..._base, background: 'var(--success)', color: '#fff' }
const ghostBtn = { ..._base, background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }