import { useState, useRef } from "react";

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Label({ children, hint }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 5, fontSize: 11,
      fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
      letterSpacing: "0.08em", marginBottom: 5,
    }}>
      {children}
      {hint && (
        <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-dim)", fontSize: 10.5 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function Alert({ type, children }) {
  const map = {
    green: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", text: "#34d399" },
    red:   { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)",  text: "#f87171" },
    blue:  { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", text: "#60a5fa" },
    amber: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", text: "#fbbf24" },
  };
  const c = map[type] || map.blue;
  return (
    <div style={{
      padding: "9px 13px", background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 8, color: c.text, fontSize: 12.5, marginTop: 10, lineHeight: 1.6,
    }}>
      {children}
    </div>
  );
}

function Card({ title, icon, children, glow, tag }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${glow ? "var(--accent)" : "var(--border)"}`,
      borderRadius: "var(--radius-lg)", padding: 22, marginBottom: 18,
      boxShadow: glow
        ? "0 0 0 1px var(--accent-glow), 0 4px 32px rgba(59,130,246,0.1)"
        : "var(--shadow)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
          color: glow ? "var(--accent2)" : "var(--text)", flex: 1,
        }}>{title}</span>
        {tag && (
          <span style={{
            fontSize: 9.5, fontWeight: 800, background: "rgba(16,185,129,0.15)",
            color: "var(--success)", padding: "2px 8px", borderRadius: 999, letterSpacing: "0.04em",
          }}>{tag}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function SpinEl({ size = 15 }) {
  return (
    <span style={{
      width: size, height: size, border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
      animation: "spin 0.8s linear infinite", flexShrink: 0,
    }} />
  );
}

// ─── File Dropper ─────────────────────────────────────────────────────────────
function FileDropper({ label, icon, accept, file, onFile, hint, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["docx", "doc", "txt", "pdf"].includes(ext)) {
      alert("Only DOCX, DOC, TXT, PDF files are supported.");
      return;
    }
    onFile(f);
  };

  const borderColor = file
    ? "var(--success)"
    : dragOver
    ? "var(--accent)"
    : "var(--border)";

  return (
    <div>
      <Label>{label}</Label>
      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !loading && ref.current.click()}
        style={{
          border: `2px dashed ${borderColor}`, borderRadius: 12, padding: "20px 16px",
          textAlign: "center", cursor: loading ? "not-allowed" : "pointer",
          background: dragOver
            ? "rgba(59,130,246,0.05)"
            : file
            ? "rgba(16,185,129,0.04)"
            : "var(--bg)",
          transition: "all .25s", transform: dragOver ? "scale(1.01)" : "scale(1)",
          minHeight: 90, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 6,
          opacity: loading ? 0.7 : 1,
        }}
      >
        <input
          ref={ref} type="file" accept={accept} style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {loading ? (
          <>
            <SpinEl size={20} />
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Reading &amp; stripping PII...
            </div>
          </>
        ) : file ? (
          <>
            <div style={{ fontSize: 22 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--success)" }}>{file.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Click to replace</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 26 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Drop {label} here or click to browse</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{hint || "DOCX · DOC · TXT · PDF"}</div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PII Badge Strip ──────────────────────────────────────────────────────────
function PIIBadges({ pii }) {
  if (!pii) return null;
  const categories = [
    { key: "emails",    label: "Email",    icon: "✉️",  color: "#f87171" },
    { key: "phones",    label: "Phone",    icon: "📞",  color: "#fb923c" },
    { key: "ids",       label: "ID/Pass",  icon: "🪪",  color: "#facc15" },
    { key: "dobs",      label: "DOB",      icon: "🎂",  color: "#a78bfa" },
    { key: "addresses", label: "Address",  icon: "🏠",  color: "#60a5fa" },
    { key: "urls",      label: "URL/Link", icon: "🔗",  color: "#34d399" },
  ];
  const total = categories.reduce((s, c) => s + (pii[c.key]?.length || 0), 0);
  if (total === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {categories.map(({ key, label, icon, color }) => {
        const count = pii[key]?.length || 0;
        if (!count) return null;
        return (
          <span
            key={key}
            title={pii[key].join(", ")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 999,
              background: color + "18", border: `1px solid ${color}44`,
              fontSize: 11, fontWeight: 700, color,
              cursor: "help",
            }}
          >
            {icon} {count} {label}{count !== 1 ? "s" : ""} removed
          </span>
        );
      })}
    </div>
  );
}

// ─── CV Preview Box ───────────────────────────────────────────────────────────
// Shows the full extracted CV text with PII replaced by [REDACTED] tags.
// Highlights each [REDACTED] placeholder in red so the recruiter can see exactly
// what was stripped before the text goes to Groq.
function CVPreviewBox({ previewData, fileName }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!previewData) return null;

  const { safe_text, raw_chars, safe_chars, pii } = previewData;
  const totalStripped = Object.values(pii).reduce((s, arr) => s + arr.length, 0);
  const charsSaved = raw_chars - safe_chars;

  // Split safe_text on [REDACTED] placeholders and render with highlights
  const renderRedacted = (text) => {
    const REDACT_RE = /(\[(?:EMAIL|PHONE|ID|DOB|ADDRESS|LINKEDIN|URL) REDACTED\])/g;
    const parts = text.split(REDACT_RE);
    return parts.map((part, i) =>
      REDACT_RE.test(part) ? (
        <span
          key={i}
          style={{
            background: "rgba(239,68,68,0.18)",
            color: "#f87171",
            borderRadius: 4,
            padding: "0 4px",
            fontWeight: 700,
            fontSize: 11,
            fontFamily: "monospace",
            border: "1px solid rgba(239,68,68,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div style={{
      marginTop: 14,
      border: "1px solid rgba(16,185,129,0.35)",
      borderRadius: 12,
      overflow: "hidden",
      animation: "fadeIn 0.3s ease",
    }}>
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "rgba(16,185,129,0.12)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderBottom: collapsed ? "none" : "1px solid rgba(16,185,129,0.2)",
        cursor: "pointer",
      }} onClick={() => setCollapsed(v => !v)}>
        <span style={{ fontSize: 18 }}>🔒</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "var(--success)" }}>
            CV Text Preview — PII Stripped
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {fileName} · {raw_chars.toLocaleString()} → {safe_chars.toLocaleString()} chars
            {charsSaved > 0 && (
              <span style={{ color: "var(--success)", marginLeft: 6 }}>
                (−{charsSaved.toLocaleString()} chars of PII removed)
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {totalStripped > 0 && (
            <div style={{
              background: "rgba(239,68,68,0.18)", color: "#f87171",
              borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 800,
              border: "1px solid rgba(239,68,68,0.3)",
            }}>
              🔴 {totalStripped} PII item{totalStripped !== 1 ? "s" : ""} redacted
            </div>
          )}
          {totalStripped === 0 && (
            <div style={{
              background: "rgba(16,185,129,0.15)", color: "var(--success)",
              borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 800,
            }}>
              ✅ No PII found
            </div>
          )}
          <span style={{ color: "var(--text-dim)", fontSize: 13, fontWeight: 700 }}>
            {collapsed ? "▼ Show" : "▲ Hide"}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div style={{ background: "var(--surface)", padding: "14px 16px" }}>

          {/* ── PII badges ───────────────────────────────────────────────── */}
          {totalStripped > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
              }}>
                Items removed before sending to AI:
              </div>
              <PIIBadges pii={pii} />
            </div>
          )}

          {/* ── What was removed table ───────────────────────────────────── */}
          {totalStripped > 0 && (() => {
            const cats = [
              { key: "emails",    label: "Emails",          icon: "✉️" },
              { key: "phones",    label: "Phone Numbers",   icon: "📞" },
              { key: "ids",       label: "IDs / Passports", icon: "🪪" },
              { key: "dobs",      label: "Dates of Birth",  icon: "🎂" },
              { key: "addresses", label: "Addresses",       icon: "🏠" },
              { key: "urls",      label: "URLs / LinkedIn", icon: "🔗" },
            ];
            const filled = cats.filter(c => pii[c.key]?.length);
            if (!filled.length) return null;
            return (
              <div style={{
                marginBottom: 14,
                padding: "10px 13px",
                background: "rgba(239,68,68,0.05)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 800, color: "#f87171",
                  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
                }}>
                  ❌ Removed values (will NOT be sent to AI):
                </div>
                {filled.map(({ key, label, icon }) => (
                  <div key={key} style={{ marginBottom: 5 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                      display: "inline-flex", alignItems: "center", gap: 4, minWidth: 130,
                    }}>
                      {icon} {label}:
                    </span>
                    {pii[key].map((val, i) => (
                      <span
                        key={i}
                        style={{
                          display: "inline-block",
                          marginLeft: 6,
                          padding: "1px 7px",
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          borderRadius: 5,
                          fontFamily: "monospace",
                          fontSize: 11,
                          color: "#f87171",
                          textDecoration: "line-through",
                          marginBottom: 3,
                        }}
                      >
                        {val.length > 55 ? val.slice(0, 52) + "..." : val}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── The full safe CV text ────────────────────────────────────── */}
          <div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 800, color: "var(--success)",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>
                ✅ Text that will be sent to Groq AI:
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                {safe_chars.toLocaleString()} chars · ~{Math.round(safe_chars / 4).toLocaleString()} tokens
              </div>
            </div>

            <div style={{
              padding: "14px 16px",
              background: "rgba(0,0,0,0.25)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontFamily: "monospace",
              fontSize: 11.5,
              color: "var(--text-muted)",
              lineHeight: 1.85,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 420,
              overflowY: "auto",
            }}>
              {renderRedacted(safe_text)}
            </div>

            <div style={{
              marginTop: 8,
              fontSize: 11,
              color: "var(--text-dim)",
              lineHeight: 1.6,
            }}>
              🔴 <strong style={{ color: "#f87171" }}>Red highlights</strong> = PII replaced with [REDACTED] placeholder &nbsp;·&nbsp;
              Everything else is sent as-is to Groq for skill matrix generation.
            </div>
          </div>

          {/* ── Privacy guarantee ────────────────────────────────────────── */}
          <div style={{
            marginTop: 12, padding: "8px 12px",
            background: "rgba(16,185,129,0.06)",
            borderRadius: 7, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.7,
          }}>
            🛡️ <strong style={{ color: "var(--success)" }}>Privacy guarantee:</strong>{" "}
            The raw CV (with original PII) was processed in server memory only and immediately deleted.
            Only the redacted version above is sent to Groq AI. Your CV file is never stored permanently.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PII Report Panel (post-generation) ──────────────────────────────────────
function PIIReportPanel({ report }) {
  const [showPreview, setShowPreview] = useState(false);
  if (!report) return null;

  const categories = [
    { key: "emails",    label: "Emails",          icon: "✉️",  color: "#f87171" },
    { key: "phones",    label: "Phone Numbers",   icon: "📞",  color: "#fb923c" },
    { key: "ids",       label: "ID / Passport",   icon: "🪪",  color: "#facc15" },
    { key: "dobs",      label: "Dates of Birth",  icon: "🎂",  color: "#a78bfa" },
    { key: "addresses", label: "Addresses",       icon: "🏠",  color: "#60a5fa" },
    { key: "urls",      label: "URLs / LinkedIn", icon: "🔗",  color: "#34d399" },
  ];

  const totalStripped = categories.reduce((sum, c) => sum + (report[c.key]?.length || 0), 0);

  return (
    <div style={{
      marginTop: 16, border: "1px solid rgba(16,185,129,0.35)",
      borderRadius: 12, overflow: "hidden", animation: "fadeIn 0.3s ease",
    }}>
      <div style={{
        background: "rgba(16,185,129,0.12)", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid rgba(16,185,129,0.2)",
      }}>
        <span style={{ fontSize: 18 }}>🔒</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "var(--success)" }}>
            Generation Complete — Privacy Report
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {totalStripped} sensitive item{totalStripped !== 1 ? "s" : ""} were redacted before AI processing
          </div>
        </div>
        <div style={{
          background: totalStripped > 0 ? "rgba(16,185,129,0.2)" : "rgba(59,130,246,0.15)",
          color: totalStripped > 0 ? "var(--success)" : "var(--accent2)",
          borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 800,
        }}>
          {totalStripped > 0 ? `${totalStripped} REDACTED` : "CLEAN"}
        </div>
      </div>

      <div style={{ padding: "14px 16px", background: "var(--surface)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {categories.map(({ key, label, icon, color }) => {
            const items = report[key] || [];
            const found = items.length > 0;
            return (
              <div key={key} style={{
                padding: "10px 12px", borderRadius: 9,
                border: `1px solid ${found ? color + "44" : "var(--border)"}`,
                background: found ? color + "11" : "var(--bg)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: found ? 6 : 0 }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: found ? color : "var(--text-dim)" }}>
                    {label}
                  </span>
                  <span style={{
                    marginLeft: "auto", fontSize: 10, fontWeight: 800,
                    color: found ? color : "var(--text-dim)",
                    background: found ? color + "22" : "transparent",
                    padding: "1px 6px", borderRadius: 999,
                  }}>
                    {found ? `${items.length}` : "none"}
                  </span>
                </div>
                {found && items.map((item, i) => (
                  <div key={i} style={{
                    fontSize: 10.5, color: "var(--text-muted)", background: "var(--surface2)",
                    borderRadius: 5, padding: "2px 7px", marginTop: 3,
                    fontFamily: "monospace", wordBreak: "break-all",
                    textDecoration: "line-through", opacity: 0.8,
                  }}>
                    {item.length > 45 ? item.slice(0, 42) + "..." : item}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <button
            onClick={() => setShowPreview(v => !v)}
            style={{
              background: "none", border: "1px solid var(--border)", borderRadius: 7,
              color: "var(--text-muted)", fontSize: 12, fontWeight: 600,
              padding: "6px 14px", cursor: "pointer", fontFamily: "var(--font-body)",
              display: "flex", alignItems: "center", gap: 7,
            }}
          >
            <span>{showPreview ? "▲" : "▼"}</span>
            {showPreview ? "Hide" : "Show"} safe CV preview (first 800 chars sent to AI)
          </button>

          {showPreview && (
            <div style={{
              marginTop: 10, padding: "12px 14px", background: "rgba(0,0,0,0.25)",
              border: "1px solid var(--border)", borderRadius: 8,
              fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)",
              lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
              maxHeight: 320, overflowY: "auto",
            }}>
              {report.cv_safe_preview || "No preview available."}
              {report.cv_safe_chars > 800 && (
                <div style={{
                  marginTop: 8, color: "var(--text-dim)", fontFamily: "var(--font-body)",
                  fontSize: 10.5, borderTop: "1px solid var(--border)", paddingTop: 6,
                }}>
                  … {(report.cv_safe_chars - 800).toLocaleString()} more chars sent (not shown)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main SkillMatrix Component ───────────────────────────────────────────────
export default function SkillMatrix() {
  const [smFile, setSmFile]             = useState(null);
  const [cvFile, setCvFile]             = useState(null);

  // CV preview state — populated as soon as a CV is uploaded
  const [cvPreview, setCvPreview]       = useState(null);   // {safe_text, raw_chars, safe_chars, pii}
  const [cvPreviewLoading, setCvPreviewLoading] = useState(false);
  const [cvPreviewError, setCvPreviewError]     = useState(null);

  // Generation state
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [downloadUrl, setDownloadUrl]   = useState(null);
  const [downloadName, setDownloadName] = useState("Skill_Matrix_Filled.docx");
  const [stage, setStage]               = useState("idle");
  const [piiReport, setPiiReport]       = useState(null);

  // ── CV upload handler — immediately calls /api/preview-cv ─────────────────
  const handleCvFile = async (file) => {
    setCvFile(file);
    setCvPreview(null);
    setCvPreviewError(null);
    setCvPreviewLoading(true);

    try {
      const formData = new FormData();
      formData.append("cv", file);
      const apiBase = import.meta.env.VITE_API_URL || "";
      const resp = await fetch(`${apiBase}/api/preview-cv`, {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        let detail = `Error ${resp.status}`;
        try { const j = await resp.json(); detail = j.detail || detail; } catch (_) {}
        throw new Error(detail);
      }
      const data = await resp.json();
      setCvPreview(data);
    } catch (err) {
      setCvPreviewError(err.message || "Could not preview CV.");
    } finally {
      setCvPreviewLoading(false);
    }
  };

  const reset = () => {
    setSmFile(null);
    setCvFile(null);
    setCvPreview(null);
    setCvPreviewError(null);
    setError(null);
    setDownloadUrl(null);
    setStage("idle");
    setPiiReport(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  };

  const stageLabels = {
    idle:       "",
    uploading:  "📤 Uploading files...",
    generating: "🤖 AI filling skill matrix...",
    building:   "📝 Building DOCX...",
    done:       "✅ Done!",
  };

  const generate = async () => {
    if (!smFile) { setError("Please upload the Skill Matrix file."); return; }
    if (!cvFile) { setError("Please upload the Candidate CV file."); return; }

    setLoading(true);
    setError(null);
    setDownloadUrl(null);
    setPiiReport(null);
    setStage("uploading");

    try {
      const formData = new FormData();
      formData.append("skill_matrix", smFile);
      formData.append("cv", cvFile);

      setStage("generating");

      const apiBase = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiBase}/api/generate-skill-matrix`, {
        method: "POST",
        body: formData,
      });

      setStage("building");

      if (!response.ok) {
        let detail = `Server error (${response.status})`;
        try { const j = await response.json(); detail = j.detail || detail; } catch (_) {}
        throw new Error(detail);
      }

      // Decode PII report from header
      const piiHeader = response.headers.get("X-PII-Report");
      if (piiHeader) {
        try {
          setPiiReport(JSON.parse(atob(piiHeader)));
        } catch (_) {}
      }

      const disposition = response.headers.get("Content-Disposition") || "";
      const fnMatch = disposition.match(/filename[^;=\n]*=["']?([^"'\n;]+)["']?/);
      const fname = fnMatch ? fnMatch[1] : "Skill_Matrix_Filled.docx";
      setDownloadName(fname);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStage("done");

      const a = document.createElement("a");
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);

    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStage("idle");
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = smFile && cvFile && !loading && !cvPreviewLoading;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 60 }}>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px" }}>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, boxShadow: "0 2px 12px rgba(16,185,129,0.35)",
            }}>📊</div>
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20,
                letterSpacing: "-0.02em",
              }}>Skill Matrix Generator</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                Upload an empty Skill Matrix + Candidate CV → get a filled .docx in seconds
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 20, alignItems: "start" }}>

          {/* ── LEFT column — uploads ──────────────────────────────────────── */}
          <div>
            <Card title="Upload Files" icon="📁" tag="REQUIRED">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Skill Matrix file */}
                <FileDropper
                  label="Skill Matrix (empty template)" icon="📋"
                  accept=".docx,.doc,.txt,.pdf" file={smFile}
                  onFile={setSmFile}
                  hint="The blank skill matrix with requirements"
                />

                {/* CV file — triggers live preview on drop */}
                <FileDropper
                  label="Candidate CV" icon="👤"
                  accept=".docx,.doc,.txt,.pdf" file={cvFile}
                  onFile={handleCvFile}
                  hint="The candidate's resume / CV"
                  loading={cvPreviewLoading}
                />
              </div>

              {/* File size info */}
              {(smFile || cvFile) && (
                <div style={{
                  marginTop: 14, padding: "10px 13px",
                  background: "var(--surface2)", borderRadius: 8,
                  fontSize: 12, lineHeight: 2,
                }}>
                  {smFile && (
                    <div>
                      📋 <strong style={{ color: "var(--text)" }}>Skill Matrix:</strong>{" "}
                      <span style={{ color: "var(--success)" }}>{smFile.name}</span>
                      <span style={{ color: "var(--text-dim)", marginLeft: 6 }}>
                        ({(smFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                  {cvFile && (
                    <div>
                      👤 <strong style={{ color: "var(--text)" }}>CV:</strong>{" "}
                      <span style={{ color: "var(--success)" }}>{cvFile.name}</span>
                      <span style={{ color: "var(--text-dim)", marginLeft: 6 }}>
                        ({(cvFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* CV preview error */}
              {cvPreviewError && (
                <Alert type="red">
                  ⚠️ Preview failed: {cvPreviewError}. You can still generate — the server will re-extract the CV.
                </Alert>
              )}
            </Card>

            {/* How it works */}
            <Card title="How It Works" icon="💡">
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.9 }}>
                {[
                  ["1.", "Upload your", "empty Skill Matrix", "(DOCX with requirement rows)"],
                  ["2.", "Upload the", "Candidate CV", "— PII is stripped instantly in the preview"],
                  ["3.", "Review the", "CV preview box", "to confirm what goes to AI"],
                  ["4.", "Click Generate →", "filled .docx", "downloads automatically"],
                ].map(([num, pre, bold, post], i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <span style={{ color: "var(--accent2)", fontWeight: 700, flexShrink: 0 }}>{num}</span>
                    <span>{pre} <strong style={{ color: "var(--text)" }}>{bold}</strong> {post}</span>
                  </div>
                ))}
              </div>
              <Alert type="green">
                🔒 <strong>PII stripped instantly on upload:</strong> The preview box below shows
                exactly what text goes to Groq — with all sensitive data replaced by
                <span style={{ color: "#f87171", fontFamily: "monospace", fontSize: 11,
                  background: "rgba(239,68,68,0.1)", padding: "0 4px", borderRadius: 3, margin: "0 3px" }}>
                  [REDACTED]
                </span>
                tags highlighted in red.
              </Alert>
            </Card>

            {/* .env setup */}
            <Card title="Environment Setup" icon="⚙️">
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.8 }}>
                Add to your <code style={{
                  background: "var(--surface2)", padding: "1px 5px",
                  borderRadius: 4, fontFamily: "monospace", fontSize: 11,
                }}>.env</code> file:
              </div>
              <div style={{
                marginTop: 10, padding: "12px 14px",
                background: "rgba(0,0,0,0.25)", border: "1px solid var(--border)",
                borderRadius: 8, fontFamily: "monospace", fontSize: 12,
                color: "#fbbf24", lineHeight: 2,
              }}>
                <div><span style={{ color: "var(--text-dim)" }}># Sizzling generator (existing)</span></div>
                <div>GROQ_API_KEY=gsk_your_existing_key</div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ color: "var(--text-dim)" }}># Skill matrix (separate quota)</span>
                </div>
                <div>GROQ_SM_API_KEY=gsk_your_new_key</div>
              </div>
              <Alert type="amber">
                ⚠️ If <code style={{ fontFamily: "monospace" }}>GROQ_SM_API_KEY</code> is not set,
                the system falls back to <code style={{ fontFamily: "monospace" }}>GROQ_API_KEY</code> automatically.
              </Alert>
            </Card>
          </div>

          {/* ── RIGHT column — preview + generate ─────────────────────────── */}
          <div>

            {/* CV Preview Box — shown immediately after CV upload */}
            {(cvPreview || cvPreviewLoading) && (
              <div style={{ marginBottom: 18 }}>
                {cvPreviewLoading ? (
                  <div style={{
                    border: "1px solid var(--border)", borderRadius: 12,
                    padding: "20px", textAlign: "center",
                    background: "var(--surface)", color: "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  }}>
                    <SpinEl size={18} />
                    <span style={{ fontSize: 13 }}>Extracting text and stripping PII from CV...</span>
                  </div>
                ) : (
                  <CVPreviewBox previewData={cvPreview} fileName={cvFile?.name || ""} />
                )}
              </div>
            )}

            {/* Generate card */}
            <Card title="Generate Skill Matrix" icon="🤖" glow>
              <Alert type="blue">
                🛡️ <strong>CV-only evidence:</strong> AI fills each row using only what's in the
                candidate's CV. The CV text in the preview above is exactly what goes to Groq.
              </Alert>

              {/* Stage progress */}
              {loading && (
                <div style={{
                  marginTop: 14, padding: "12px 14px",
                  background: "rgba(59,130,246,0.07)",
                  border: "1px solid rgba(59,130,246,0.25)", borderRadius: 9,
                  fontSize: 13, color: "var(--accent2)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <SpinEl size={14} />
                  <span>{stageLabels[stage] || "Processing..."}</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  marginTop: 12, padding: "12px 14px",
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#f87171", marginBottom: 3 }}>
                    ❌ Error
                  </div>
                  <div style={{ fontSize: 12.5, color: "rgba(248,113,113,0.85)", lineHeight: 1.6 }}>
                    {error}
                  </div>
                </div>
              )}

              {/* Waiting hint */}
              {cvPreviewLoading && (
                <Alert type="amber">
                  ⏳ Waiting for CV preview to finish before you can generate...
                </Alert>
              )}

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={!canGenerate}
                style={{
                  width: "100%", marginTop: 16, padding: "13px", fontSize: 14,
                  border: "none", borderRadius: 9,
                  background: !canGenerate
                    ? "#374151"
                    : "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff", fontFamily: "var(--font-body)", fontWeight: 700,
                  cursor: !canGenerate ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: !canGenerate ? "none" : "0 4px 16px rgba(16,185,129,0.3)",
                  transition: "all 0.2s", opacity: !canGenerate ? 0.6 : 1,
                }}
              >
                {loading
                  ? <><SpinEl /> {stageLabels[stage] || "Processing..."}</>
                  : "📊 Generate Filled Skill Matrix (.docx)"}
              </button>

              {!smFile && !cvFile && (
                <div style={{
                  marginTop: 8, textAlign: "center",
                  fontSize: 11.5, color: "var(--text-dim)",
                }}>
                  Upload both files on the left to enable generation
                </div>
              )}

              {/* Success + Download */}
              {stage === "done" && downloadUrl && (
                <div style={{
                  marginTop: 16, padding: "16px",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)", marginBottom: 6 }}>
                    ✅ Skill Matrix Generated!
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
                    Downloaded automatically. Click below if it didn't start.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <a
                      href={downloadUrl} download={downloadName}
                      style={{
                        flex: 1, padding: "10px 16px",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff", borderRadius: 8, textDecoration: "none",
                        textAlign: "center", fontWeight: 700, fontSize: 13,
                        boxShadow: "0 2px 10px rgba(16,185,129,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      }}
                    >
                      ⬇️ Download {downloadName}
                    </a>
                    <button
                      onClick={reset}
                      style={{
                        padding: "10px 16px", background: "var(--surface2)",
                        color: "var(--text-muted)", border: "1px solid var(--border)",
                        borderRadius: 8, cursor: "pointer",
                        fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13,
                      }}
                    >
                      ↺ New
                    </button>
                  </div>
                </div>
              )}

              {/* Post-generation PII report */}
              <PIIReportPanel report={piiReport} />

              {/* Tips */}
              <div style={{ marginTop: 20 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
                }}>
                  💡 Tips for best results
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.9 }}>
                  <div>• <strong style={{ color: "var(--text-muted)" }}>Skill Matrix:</strong> 2-column table (requirements | answers) works best</div>
                  <div>• <strong style={{ color: "var(--text-muted)" }}>CV format:</strong> DOCX or TXT gives the cleanest text extraction</div>
                  <div>• <strong style={{ color: "var(--text-muted)" }}>Review the preview</strong> before generating — confirm PII is stripped correctly</div>
                  <div>• <strong style={{ color: "var(--text-muted)" }}>Always review</strong> the output before sending to the client</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}