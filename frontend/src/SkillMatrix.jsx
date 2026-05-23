import { useState, useRef } from "react";

// ─── Shared UI Primitives (self-contained, no App.jsx dependency) ─────────────

function Label({ children, hint }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
      color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
      {children}
      {hint && <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-dim)", fontSize: 10.5 }}>{hint}</span>}
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
    <div style={{ padding: "9px 13px", background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 8, color: c.text, fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function Card({ title, icon, children, glow, tag }) {
  return (
    <div style={{ background: "var(--surface)", border: `1px solid ${glow ? "var(--accent)" : "var(--border)"}`,
      borderRadius: "var(--radius-lg)", padding: 22, marginBottom: 18,
      boxShadow: glow ? "0 0 0 1px var(--accent-glow), 0 4px 32px rgba(59,130,246,0.1)" : "var(--shadow)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
          color: glow ? "var(--accent2)" : "var(--text)", flex: 1 }}>{title}</span>
        {tag && (
          <span style={{ fontSize: 9.5, fontWeight: 800, background: "rgba(16,185,129,0.15)",
            color: "var(--success)", padding: "2px 8px", borderRadius: 999, letterSpacing: "0.04em" }}>
            {tag}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SpinEl({ size = 15 }) {
  return (
    <span style={{ width: size, height: size, border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
      animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
  );
}

// ─── File Dropper ─────────────────────────────────────────────────────────────
function FileDropper({ label, icon, accept, file, onFile, hint }) {
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    const allowed = ["docx", "doc", "txt", "pdf"];
    if (!allowed.includes(ext)) {
      alert(`Only ${allowed.join(", ")} files are supported.`);
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
        onClick={() => ref.current.click()}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: 12,
          padding: "20px 16px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "rgba(59,130,246,0.05)" : file ? "rgba(16,185,129,0.04)" : "var(--bg)",
          transition: "all .25s",
          transform: dragOver ? "scale(1.01)" : "scale(1)",
          minHeight: 90,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <input ref={ref} type="file" accept={accept} style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])} />
        {file ? (
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

// ─── Preview Table ─────────────────────────────────────────────────────────────
function PreviewTable({ rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div style={{ marginTop: 20, overflowX: "auto" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        📋 Preview — {rows.length} rows filled
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: "38%", background: "#DEEAF6", color: "#1e293b" }}>Requirements</th>
            <th style={{ ...thStyle, background: "#DEEAF6", color: "#1e293b" }}>How candidate meets the requirement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: row.is_header ? "#F2F2F2" : i % 2 === 0 ? "var(--surface)" : "var(--bg)" }}>
              <td style={{ ...tdStyle, fontWeight: row.is_header ? 700 : 400, color: "var(--text)" }}>
                {row.requirement}
              </td>
              <td style={{ ...tdStyle, color: row.is_header ? "var(--text-dim)" : "var(--text)", fontStyle: row.is_header ? "italic" : "normal" }}>
                {row.answer || (row.is_header ? "—" : <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>Not filled</span>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  padding: "9px 12px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 12,
  border: "1px solid var(--border)",
};
const tdStyle = {
  padding: "8px 12px",
  verticalAlign: "top",
  border: "1px solid var(--border)",
  lineHeight: 1.6,
  wordBreak: "break-word",
};

// ─── Main SkillMatrix Component ───────────────────────────────────────────────
export default function SkillMatrix() {
  const [smFile, setSmFile]       = useState(null);
  const [cvFile, setCvFile]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [preview, setPreview]     = useState(null);  // [{requirement, answer, is_header}]
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState("Skill_Matrix_Filled.docx");
  const [stage, setStage]         = useState("idle"); // idle | extracting | generating | building | done

  const reset = () => {
    setSmFile(null);
    setCvFile(null);
    setError(null);
    setPreview(null);
    setDownloadUrl(null);
    setStage("idle");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  };

  const stageLabels = {
    idle:        "",
    extracting:  "📄 Reading files...",
    generating:  "🤖 AI filling skill matrix...",
    building:    "📝 Building DOCX...",
    done:        "✅ Done!",
  };

  const generate = async () => {
    if (!smFile) { setError("Please upload the Skill Matrix file."); return; }
    if (!cvFile) { setError("Please upload the Candidate CV file."); return; }

    setLoading(true);
    setError(null);
    setPreview(null);
    setDownloadUrl(null);
    setStage("extracting");

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
        try {
          const errJson = await response.json();
          detail = errJson.detail || detail;
        } catch (_) {}
        throw new Error(detail);
      }

      // Get filename from Content-Disposition header
      const disposition = response.headers.get("Content-Disposition") || "";
      const fnMatch = disposition.match(/filename[^;=\n]*=["']?([^"'\n;]+)["']?/);
      const fname = fnMatch ? fnMatch[1] : "Skill_Matrix_Filled.docx";
      setDownloadName(fname);

      // Convert to blob for download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Also fetch preview data from a second pass or parse headers
      // We'll request a preview separately via a JSON endpoint
      // For now, show a success message and let them download
      setStage("done");

      // Auto-trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStage("idle");
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = smFile && cvFile && !loading;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 60 }}>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 28px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              boxShadow: "0 2px 12px rgba(16,185,129,0.35)" }}>
              📊
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20,
                letterSpacing: "-0.02em" }}>Skill Matrix Generator</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                Upload an empty Skill Matrix + Candidate CV → get a filled .docx in seconds
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

          {/* LEFT — Uploads */}
          <div>
            <Card title="Upload Files" icon="📁" tag="REQUIRED">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <FileDropper
                  label="Skill Matrix (empty template)"
                  icon="📋"
                  accept=".docx,.doc,.txt,.pdf"
                  file={smFile}
                  onFile={setSmFile}
                  hint="The blank skill matrix with requirements"
                />
                <FileDropper
                  label="Candidate CV"
                  icon="👤"
                  accept=".docx,.doc,.txt,.pdf"
                  file={cvFile}
                  onFile={setCvFile}
                  hint="The candidate's resume / CV"
                />
              </div>

              {/* File status */}
              {(smFile || cvFile) && (
                <div style={{ marginTop: 14, padding: "10px 13px", background: "var(--surface2)",
                  borderRadius: 8, fontSize: 12, lineHeight: 2 }}>
                  {smFile && <div>📋 <strong style={{ color: "var(--text)" }}>Skill Matrix:</strong>{" "}
                    <span style={{ color: "var(--success)" }}>{smFile.name}</span>
                    <span style={{ color: "var(--text-dim)", marginLeft: 6 }}>
                      ({(smFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>}
                  {cvFile && <div>👤 <strong style={{ color: "var(--text)" }}>CV:</strong>{" "}
                    <span style={{ color: "var(--success)" }}>{cvFile.name}</span>
                    <span style={{ color: "var(--text-dim)", marginLeft: 6 }}>
                      ({(cvFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>}
                </div>
              )}
            </Card>

            <Card title="How It Works" icon="💡">
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.9 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "var(--accent2)", fontWeight: 700, flexShrink: 0 }}>1.</span>
                  <span>Upload your <strong style={{ color: "var(--text)" }}>empty Skill Matrix</strong> (DOCX template with requirement rows)</span>
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "var(--accent2)", fontWeight: 700, flexShrink: 0 }}>2.</span>
                  <span>Upload the <strong style={{ color: "var(--text)" }}>Candidate CV</strong> — any format (DOCX, PDF, TXT)</span>
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "var(--accent2)", fontWeight: 700, flexShrink: 0 }}>3.</span>
                  <span>AI reads both and fills each requirement with <strong style={{ color: "var(--text)" }}>evidence from the CV only</strong></span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "var(--accent2)", fontWeight: 700, flexShrink: 0 }}>4.</span>
                  <span>Download a <strong style={{ color: "var(--text)" }}>filled .docx</strong> with the exact same table layout as your template</span>
                </div>
              </div>
              <Alert type="blue">
                🔑 Uses <strong>GROQ_SM_API_KEY</strong> from your .env — separate from the Sizzling generator key.
              </Alert>
            </Card>
          </div>

          {/* RIGHT — Generate & Result */}
          <div>
            <Card title="Generate Skill Matrix" icon="🤖" glow>

              <Alert type="blue">
                🛡️ <strong>CV-only evidence:</strong> AI fills each row using only what's in the candidate's CV. No hallucination.
              </Alert>

              {/* Stage progress */}
              {loading && (
                <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(59,130,246,0.07)",
                  border: "1px solid rgba(59,130,246,0.25)", borderRadius: 9, fontSize: 13,
                  color: "var(--accent2)", display: "flex", alignItems: "center", gap: 10 }}>
                  <SpinEl size={14} />
                  <span>{stageLabels[stage] || "Processing..."}</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#f87171", marginBottom: 3 }}>❌ Error</div>
                  <div style={{ fontSize: 12.5, color: "rgba(248,113,113,0.85)", lineHeight: 1.6 }}>{error}</div>
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={!canGenerate}
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: "13px",
                  fontSize: 14,
                  border: "none",
                  borderRadius: 9,
                  background: !canGenerate
                    ? "#374151"
                    : "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  cursor: !canGenerate ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow: !canGenerate ? "none" : "0 4px 16px rgba(16,185,129,0.3)",
                  transition: "all 0.2s",
                  opacity: !canGenerate ? 0.6 : 1,
                }}
              >
                {loading
                  ? <><SpinEl /> {stageLabels[stage] || "Processing..."}</>
                  : "📊 Generate Filled Skill Matrix (.docx)"}
              </button>

              {!smFile && !cvFile && (
                <div style={{ marginTop: 8, textAlign: "center", fontSize: 11.5, color: "var(--text-dim)" }}>
                  Upload both files on the left to enable generation
                </div>
              )}

              {/* Success + Download */}
              {stage === "done" && downloadUrl && (
                <div style={{ marginTop: 16, padding: "16px", background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)", marginBottom: 6 }}>
                    ✅ Skill Matrix Generated!
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
                    Your filled skill matrix has been downloaded automatically. Click below if it didn't start.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <a
                      href={downloadUrl}
                      download={downloadName}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff",
                        borderRadius: 8,
                        textDecoration: "none",
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 13,
                        boxShadow: "0 2px 10px rgba(16,185,129,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                      }}
                    >
                      ⬇️ Download {downloadName}
                    </a>
                    <button
                      onClick={reset}
                      style={{
                        padding: "10px 16px",
                        background: "var(--surface2)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      ↺ New
                    </button>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  💡 Tips for best results
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.9 }}>
                  <div>• <strong style={{ color: "var(--text-muted)" }}>Skill Matrix format:</strong> 2-column table (requirements | answers) works best</div>
                  <div>• <strong style={{ color: "var(--text-muted)" }}>CV format:</strong> DOCX or TXT gives the cleanest text extraction</div>
                  <div>• <strong style={{ color: "var(--text-muted)" }}>AI is conservative:</strong> if CV doesn't mention a skill, it will say so honestly</div>
                  <div>• <strong style={{ color: "var(--text-muted)" }}>Always review</strong> the output before sending to the client</div>
                  <div>• <strong style={{ color: "var(--text-muted)" }}>GROQ_SM_API_KEY</strong> must be set in <code style={{ background: "var(--surface2)", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace" }}>.env</code></div>
                </div>
              </div>
            </Card>

            {/* .env reminder */}
            {/* <Card title="Environment Setup" icon="⚙️">
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.8 }}>
                Add this to your <code style={{ background: "var(--surface2)", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace", fontSize: 11 }}>.env</code> file:
              </div>
              <div style={{ marginTop: 10, padding: "12px 14px", background: "rgba(0,0,0,0.25)",
                border: "1px solid var(--border)", borderRadius: 8, fontFamily: "monospace",
                fontSize: 12, color: "#fbbf24", lineHeight: 2 }}>
                <div><span style={{ color: "var(--text-dim)" }}># Existing key (sizzling generator)</span></div>
                <div>GROQ_API_KEY=gsk_your_existing_key</div>
                <div style={{ marginTop: 4 }}><span style={{ color: "var(--text-dim)" }}># New key (skill matrix — separate quota)</span></div>
                <div>GROQ_SM_API_KEY=gsk_your_new_key</div>
              </div>
              <Alert type="amber">
                ⚠️ Both keys must be set. Get free API keys at{" "}
                <a href="https://console.groq.com" target="_blank" rel="noreferrer"
                  style={{ color: "#fbbf24", textDecoration: "underline" }}>
                  console.groq.com
                </a>
              </Alert>
            </Card> */}
          </div>
        </div>
      </main>
    </div>
  );
}