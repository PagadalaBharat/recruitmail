
// import { useState, useRef, useCallback, useEffect } from "react";
// import axios from "axios";
// import "./App.css";
// import SkillMatrix from "./SkillMatrix";

// // ─── EU/EEA Country → Nationality mapping ────────────────────────────────────
// const EU_MAP = {
//   austria: "Austrian",
//   belgium: "Belgian",
//   bulgaria: "Bulgarian",
//   croatia: "Croatian",
//   cyprus: "Cypriot",
//   "czech republic": "Czech",
//   czechia: "Czech",
//   denmark: "Danish",
//   estonia: "Estonian",
//   finland: "Finnish",
//   france: "French",
//   germany: "German",
//   greece: "Greek",
//   hungary: "Hungarian",
//   ireland: "Irish",
//   italy: "Italian",
//   latvia: "Latvian",
//   lithuania: "Lithuanian",
//   luxembourg: "Luxembourgish",
//   malta: "Maltese",
//   netherlands: "Dutch",
//   holland: "Dutch",
//   poland: "Polish",
//   portugal: "Portuguese",
//   romania: "Romanian",
//   slovakia: "Slovak",
//   slovenia: "Slovenian",
//   spain: "Spanish",
//   sweden: "Swedish",
//   "united kingdom": "British",
//   uk: "British",
//   norway: "Norwegian",
//   iceland: "Icelandic",
//   switzerland: "Swiss",
//   liechtenstein: "Liechtensteiner",
//   austrian: "Austrian",
//   belgian: "Belgian",
//   bulgarian: "Bulgarian",
//   croatian: "Croatian",
//   cypriot: "Cypriot",
//   czech: "Czech",
//   danish: "Danish",
//   estonian: "Estonian",
//   finnish: "Finnish",
//   french: "French",
//   german: "German",
//   greek: "Greek",
//   hungarian: "Hungarian",
//   irish: "Irish",
//   italian: "Italian",
//   latvian: "Latvian",
//   lithuanian: "Lithuanian",
//   luxembourgish: "Luxembourgish",
//   maltese: "Maltese",
//   dutch: "Dutch",
//   polish: "Polish",
//   portuguese: "Portuguese",
//   romanian: "Romanian",
//   slovak: "Slovak",
//   slovenian: "Slovenian",
//   spanish: "Spanish",
//   swedish: "Swedish",
//   british: "British",
//   norwegian: "Norwegian",
//   icelandic: "Icelandic",
//   swiss: "Swiss",
// };

// const NATIONALITY_SUGGESTIONS = [
//   "Austrian","Belgian","Bulgarian","Croatian","Cypriot","Czech","Danish","Dutch",
//   "Estonian","Finnish","French","German","Greek","Hungarian","Icelandic","Irish",
//   "Italian","Latvian","Liechtensteiner","Lithuanian","Luxembourgish","Maltese",
//   "Norwegian","Polish","Portuguese","Romanian","Slovak","Slovenian","Spanish",
//   "Swedish","Swiss","British","Indian","Pakistani","Bangladeshi","Sri Lankan",
//   "Nepali","American","Canadian","Australian","Chinese","Filipino","Nigerian",
//   "Kenyan","South African","Brazilian","Mexican","Turkish","Egyptian","Moroccan",
//   "Algerian","Ukrainian","Russian","Belarusian","Georgian","Armenian","Azerbaijani",
//   "Thai","Vietnamese","Indonesian","Malaysian","Singaporean","Japanese","Korean",
// ];

// const EU_NATIONALITIES = new Set([
//   "Austrian","Belgian","Bulgarian","Croatian","Cypriot","Czech","Danish","Dutch",
//   "Estonian","Finnish","French","German","Greek","Hungarian","Icelandic","Irish",
//   "Italian","Latvian","Lithuanian","Luxembourgish","Maltese","Norwegian","Polish",
//   "Portuguese","Romanian","Slovak","Slovenian","Spanish","Swedish","Swiss",
//   "British","Liechtensteiner",
// ]);

// function isEUNationality(nat) {
//   if (!nat?.trim()) return null;
//   for (const eu of EU_NATIONALITIES) {
//     if (eu.toLowerCase() === nat.trim().toLowerCase()) return true;
//   }
//   return false;
// }

// function resolveNationality(input) {
//   if (!input) return input;
//   return EU_MAP[input.trim().toLowerCase()] || input;
// }

// // ─── Rate helpers ─────────────────────────────────────────────────────────────
// // ─── Rate helpers ─────────────────────────────────────────────────────────────
// // Rules:
// //   600 SEK/Hour  | 50 EUR/Hour   → type "hour"  → "Has own Limited company to manage payroll."
// //   60000 SEK/Month | 4000 EUR/Month → type "month" → "Willing to work under Avance payroll."
// // Detection: look for /Hour or /Month (case-insensitive) after a number+currency.
// function parseBuyRateInput(raw) {
//   if (!raw?.trim()) return { type: null, formatted: "", currency: "SEK" };

//   const str   = raw.trim();
//   const lower = str.toLowerCase();

//   // Extract the numeric amount (first number found)
//   const numMatch = str.match(/[\d]+(?:[,.\s]\d+)*/);
//   const amount   = numMatch ? parseFloat(numMatch[0].replace(/[,\s]/g, "")) : null;

//   // Currency: EUR if "eur" appears, else SEK
//   const currency = /eur/i.test(str) ? "EUR" : "SEK";

//   // Detect unit: /hour or /month (with optional space before slash)
//   const isHour  = /\/\s*h(our)?/i.test(str);
//   const isMonth = /\/\s*m(onth)?/i.test(str);

//   if (!amount || (!isHour && !isMonth)) {
//     // No unit detected yet — return unparsed so user keeps typing
//     return { type: null, formatted: str, currency };
//   }

//   if (isHour) {
//     return {
//       type:      "hour",
//       formatted: `Gross - ${amount.toLocaleString()} ${currency}/Hour`,
//       amount,
//       currency,
//     };
//   }

//   // isMonth
//   return {
//     type:      "month",
//     formatted: `Gross - ${amount.toLocaleString()} ${currency}/Month`,
//     amount,
//     currency,
//   };
// }

// // ─── Candidate Info builder ───────────────────────────────────────────────────
// function buildCandidateInfo(name, isEU, rateType, workAuth) {
//   const n = name || "[Candidate Name]";
//   // "hour"  → own Limited company (gross hourly contractor)
//   // "month" → Avance payroll (monthly employed via agency)
//   // null    → default to Limited company
//   const payrollBullet =
//     rateType === "month"
//       ? "Willing to work under Avance payroll."
//       : "Has own Limited company to manage payroll.";
//   const base = [
//     `${n} is actively looking for new opportunities, as his recent project ended in Feb 2026.`,
//     `Has no interviews/offers in the pipeline.`,
//     `No planned vacations & his communication skills are good.`,
//   ];
//   if (isEU === false && workAuth) {
//     base.push(`${workAuth} and his wife is working for Prodware as permanent employee on a sponsored visa.`);
//   }
//   base.push(payrollBullet);
//   return base.join("\n");
// }

// const todayFormatted = () =>
//   new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// // ─── PII helpers ──────────────────────────────────────────────────────────────
// function stripPII(text) {
//   return text
//     .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[EMAIL REDACTED]")
//     .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, "[PHONE REDACTED]")
//     .replace(
//       /\b\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi,
//       "[DOB REDACTED]"
//     )
//     .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, "[DOB REDACTED]");
// }

// // ─── NEW: Whitespace normalizer ───────────────────────────────────────────────
// // Collapses multiple spaces within lines, removes blank lines entirely.
// // Typical saving: 30–40% fewer tokens on PDF/DOCX extracted text.
// function normalizeWhitespace(text) {
//   return text
//     .split("\n")
//     .map((line) => line.replace(/\s+/g, " ").trim()) // collapse spaces within each line
//     .filter((line) => line.length > 0)               // drop blank / whitespace-only lines
//     .join("\n");                                       // rejoin with single newlines
// }

// function extractPII(text) {
//   const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
//   const phoneMatch = text.match(/(\+[\d\s\-().]{7,}\d|\b0\d[\d\s\-]{7,}\d)/);
//   const dobMatch = text.match(
//     /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/i
//   );
//   const namePatternMatch = text.match(/(?:Full\s*Name|Name)\s*[:\-]\s*([^\n\r,]+)/i);
//   const firstLineMatch = text
//     .trim()
//     .split("\n")
//     .find((l) => l.trim().length > 2 && l.trim().length < 60);
//   const locationMatch = text.match(
//     /(?:Present\s*(?:Staying\s*)?Location|Location|Address|City)\s*[:\-]\s*([^\n\r,]+(?:,\s*[^\n\r]+)?)/i
//   );
//   const nationalityMatch = text.match(/Nationality\s*[:\-]\s*([^\n\r,]+)/i);
//   const eligibilityMatch = text.match(/Eligibility[^\n\r:]*[:\-]\s*([^\n\r]+)/i);
//   const cvSourceMatch = text.match(/CV\s*Source\s*[:\-]\s*([^\n\r]+)/i);
//   return {
//     email: emailMatch ? emailMatch[0].trim() : "",
//     phone: phoneMatch ? phoneMatch[0].trim() : "",
//     dob: dobMatch ? dobMatch[0].trim() : "",
//     name: namePatternMatch
//       ? namePatternMatch[1].trim()
//       : firstLineMatch
//       ? firstLineMatch.trim()
//       : "",
//     location: locationMatch ? locationMatch[1].trim() : "",
//     nationality: nationalityMatch ? nationalityMatch[1].trim() : "",
//     eligibility: eligibilityMatch ? eligibilityMatch[1].trim() : "",
//     cvSource: cvSourceMatch ? cvSourceMatch[1].trim() : "",
//   };
// }

// async function parsePDF(file) {
//   const pdfjsLib = window["pdfjs-dist/build/pdf"];
//   if (!pdfjsLib) throw new Error("PDF.js not loaded");
//   pdfjsLib.GlobalWorkerOptions.workerSrc =
//     "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
//   const arrayBuffer = await file.arrayBuffer();
//   const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
//   let fullText = "";
//   for (let i = 1; i <= pdf.numPages; i++) {
//     const page = await pdf.getPage(i);
//     const content = await page.getTextContent();
//     fullText += content.items.map((item) => item.str).join(" ") + "\n";
//   }
//   return fullText;
// }

// async function parseDOCX(file) {
//   const mammoth = window.mammoth;
//   if (!mammoth) throw new Error("Mammoth.js not loaded");
//   const arrayBuffer = await file.arrayBuffer();
//   const result = await mammoth.extractRawText({ arrayBuffer });
//   return result.value;
// }

// const FIXED_INTERVIEW =
//   "Candidate is available for interviews anytime during the week days with prior notice.";
// const FIXED_JOIN_PREFIX = "He can take up this project";

// const EMPTY_FORM = {
//   hiName: "Mahesh",
//   candidateName: "",
//   role: "",
//   location: "",
//   mspName: "",
//   programName: "",
//   requisitionId: "",
//   requisitionName: "",
//   billRate: "Open",
//   buyRateRaw: "",
//   buyRate: "",
//   submittedRate: "Please Suggest",
//   candidateSubmitted: todayFormatted(),
//   submissionDeadline: "",
//   projectDuration: "",
//   requirements: "",
//   cvText: "",
//   sizzlingLine1: "",
//   sizzlingSkills: "",
//   sizzlingLine2: "",
//   sizzlingLine3: "",
//   sizzlingExtra: `Fluent in English and Swedish both written and oral.\nAvailable immediately (Project ended).\nLives in Stockholm, Sweden and is flexible to be onsite 3 days a week.`,
//   candidateInfo: buildCandidateInfo("", null, null, ""),
//   fullName: "",
//   presentLocation: "",
//   emailId: "",
//   contactNumber: "",
//   nationality: "",
//   workAuthorization: "",
//   eligibility: "",
//   cvSource: "",
//   dob: "",
//   joinNoteSuffix: "immediately.",
// };

// // ─── HTML email builder ───────────────────────────────────────────────────────
// function buildHtmlEmail(f) {
//   const li = (t) =>
//     `<li style="margin-bottom:5px;font-family:Arial,sans-serif;font-size:14px;line-height:1.65">${t.replace(/^[•\-*]\s*/, "")}</li>`;
//   const block = (text) =>
//     text
//       .split("\n")
//       .filter((l) => l.trim())
//       .map((l) => li(l))
//       .join("");
//   const rows = [
//     ["MSP Name", f.mspName],
//     ["Program Name", f.programName],
//     ["Requisition ID", f.requisitionId],
//     ["Requisition Name", f.requisitionName],
//     ["Bill Rate by client", f.billRate],
//     ["Candidate Buy Rate", f.buyRate],
//     ["Submitted Rate by Avance (with Margin)", f.submittedRate],
//     ["Candidate Submitted", f.candidateSubmitted],
//     ["Submission Deadline", f.submissionDeadline],
//     ["Project Duration", f.projectDuration],
//   ];
//   const tableRows = rows
//     .map(
//       ([k, v]) => `
//     <tr>
//       <td style="border:1px solid #cbd5e1;padding:8px 13px;background:#f8fafc;font-weight:600;width:46%;font-family:Arial,sans-serif;font-size:14px;color:#334155">${k}</td>
//       <td style="border:1px solid #cbd5e1;padding:8px 13px;font-family:Arial,sans-serif;font-size:14px;color:#1e293b">${v || ""}</td>
//     </tr>`
//     )
//     .join("");
//   const sizzLis = [];
//   if (f.sizzlingLine1) sizzLis.push(li(f.sizzlingLine1));
//   if (f.sizzlingSkills)
//     sizzLis.push(
//       `<li style="margin-bottom:5px;font-family:Arial,sans-serif;font-size:14px"><strong>Skills:</strong> ${f.sizzlingSkills}</li>`
//     );
//   if (f.sizzlingLine2) sizzLis.push(li(f.sizzlingLine2));
//   if (f.sizzlingLine3) sizzLis.push(li(f.sizzlingLine3));
//   const detailLis = [
//     f.fullName && li(`Full Name: ${f.fullName}`),
//     f.presentLocation && li(`Present Staying Location: ${f.presentLocation}`),
//     f.emailId && li(`Email ID: ${f.emailId}`),
//     f.contactNumber && li(`Contact Number: ${f.contactNumber}`),
//     f.nationality && li(`Nationality: ${f.nationality}`),
//     f.workAuthorization && li(`Work Authorization: ${f.workAuthorization}`),
//     f.eligibility && li(`Eligibility to Work in job location: ${f.eligibility}`),
//     f.cvSource && li(`CV Source: ${f.cvSource}`),
//     f.dob && li(`DOB: ${f.dob}`),
//   ]
//     .filter(Boolean)
//     .join("");
//   const interviewLine =
//     `Interview: ${FIXED_INTERVIEW} ${FIXED_JOIN_PREFIX} ${f.joinNoteSuffix || "immediately."}`.trim();
//   return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#1e293b;max-width:720px">
//   <p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 8px">Hi <strong>${f.hiName}</strong>,</p>
//   <p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 16px">Please find the attached resume of <strong>${f.candidateName}</strong> for <strong>${f.role}</strong> role at <strong>${f.location}</strong>.</p>
//   <table style="border-collapse:collapse;width:100%;margin:0 0 20px;border:1px solid #cbd5e1"><tbody>${tableRows}</tbody></table>
//   ${block(f.requirements) ? `<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Requirements:</p><ul style="margin:0 0 16px 20px;padding:0">${block(f.requirements)}</ul>` : ""}
//   <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Sizzling:</p>
//   <ul style="margin:0 0 16px 20px;padding:0">${sizzLis.join("")}${block(f.sizzlingExtra)}</ul>
//   <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Candidate Information:</p>
//   <ul style="margin:0 0 16px 20px;padding:0">${block(f.candidateInfo)}</ul>
//   ${detailLis ? `<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Details:</p><ul style="margin:0 0 16px 20px;padding:0">${detailLis}</ul>` : ""}
//   <p style="background:#fef9c3;border-left:4px solid #f59e0b;padding:10px 16px;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;margin:0">${interviewLine}</p>
// </div>`;
// }

// async function copyHtmlToClipboard(html) {
//   try {
//     await navigator.clipboard.write([
//       new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }) }),
//     ]);
//   } catch {
//     const tmp = document.createElement("div");
//     tmp.innerHTML = html;
//     await navigator.clipboard.writeText(tmp.innerText);
//   }
// }

// // ─── Error parser ─────────────────────────────────────────────────────────────
// function parseApiError(err) {
//   if (!err?.response) {
//     const code = err?.code || "";
//     const msg = err?.message || "";
//     if (code === "ECONNABORTED" || msg.includes("timeout")) {
//       return {
//         type: "timeout",
//         title: "Request Timed Out",
//         message: "Groq took too long to respond. Please try again.",
//         action: "Retry",
//         retryable: true,
//       };
//     }
//     return {
//       type: "backend_down",
//       title: "Backend Server Not Running",
//       message:
//         "The API server is not reachable. Start it with:\n\nuvicorn main:app --reload\n\nMake sure your terminal is in the project folder, then refresh and try again.",
//       action: "Retry after starting server",
//       retryable: true,
//     };
//   }
//   const status = err.response.status;
//   const detail = err.response?.data?.detail || err.response?.data?.error || null;
//   if (status === 400)
//     return { type: "validation", title: "Invalid Request", message: detail || "Check your CV text and job requirements.", action: null, retryable: false };
//   if (status === 401)
//     return { type: "auth", title: "Invalid API Key", message: "Your GROQ_API_KEY is invalid or expired. Check your .env file.", action: null, retryable: false };
//   if (status === 403)
//     return { type: "auth", title: "Access Denied", message: detail || "Access denied by Groq API.", action: null, retryable: false };
//   if (status === 413)
//     return { type: "payload", title: "CV Text Too Large", message: detail || "The CV text is too large. Trim it to the most relevant sections.", action: null, retryable: false };
//   if (status === 422)
//     return { type: "validation", title: "Processing Error", message: detail || "The AI could not process the text. Ensure CV and requirements are plain text.", action: null, retryable: false };
//   if (status === 429) {
//     const retryAfter = err.response?.headers?.["retry-after"];
//     const wait = retryAfter ? `${retryAfter} seconds` : "20-30 seconds";
//     return {
//       type: "rateLimit",
//       title: "Rate Limit Reached",
//       message: `Too many requests. Please wait ${wait} before trying again.`,
//       action: "Retry after wait",
//       retryable: true,
//       waitSeconds: retryAfter ? parseInt(retryAfter) : 25,
//     };
//   }
//   if (status === 500)
//     return { type: "server", title: "Server Error", message: detail || "An unexpected server error occurred. Try again in a moment.", action: "Retry", retryable: true };
//   if (status === 503 || status === 502 || status === 504)
//     return { type: "unavailable", title: "Service Unavailable", message: detail || "The AI service is temporarily down. Please try again shortly.", action: "Retry", retryable: true };
//   return { type: "unknown", title: `Error (${status})`, message: detail || "Something went wrong. Please try again.", action: "Retry", retryable: true };
// }

// // ─── Backend Status Banner ────────────────────────────────────────────────────
// function BackendBanner({ status }) {
//   if (status === "ok" || status === "checking") return null;
//   return (
//     <div style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.3)", padding: "10px 28px", display: "flex", alignItems: "center", gap: 12 }}>
//       <span style={{ fontSize: 16 }}>🔌</span>
//       <div style={{ flex: 1 }}>
//         <span style={{ fontWeight: 700, fontSize: 12.5, color: "#f87171" }}>Backend Not Running — </span>
//         <span style={{ fontSize: 12, color: "rgba(248,113,113,0.8)" }}>
//           Start it first:{" "}
//           <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 7px", borderRadius: 4, fontFamily: "monospace", fontSize: 11.5, color: "#fbbf24" }}>
//             uvicorn main:app --reload
//           </code>{" "}
//           — then the AI Generate button will work.
//         </span>
//       </div>
//       <span style={{ fontSize: 11, color: "rgba(248,113,113,0.5)", flexShrink: 0 }}>port 8000</span>
//     </div>
//   );
// }

// // ─── AI Error Alert ────────────────────────────────────────────────────────────
// function AIErrorAlert({ error, onRetry, retryCountdown }) {
//   if (!error) return null;
//   const iconMap = {
//     backend_down: "🔌", network: "📡", timeout: "⏱️", rateLimit: "⏳",
//     auth: "🔑", validation: "📋", payload: "📦", server: "🖥️",
//     unavailable: "🔧", unknown: "⚠️",
//   };
//   const icon = iconMap[error.type] || "⚠️";
//   return (
//     <div style={{ marginTop: 10, padding: "13px 15px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, animation: "fadeIn 0.25s ease" }}>
//       <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
//         <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
//         <div style={{ flex: 1, minWidth: 0 }}>
//           <div style={{ fontWeight: 700, fontSize: 13, color: "#f87171", marginBottom: 4 }}>{error.title}</div>
//           <div style={{ fontSize: 12.5, color: "rgba(248,113,113,0.85)", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{error.message}</div>
//           {error.type === "backend_down" && (
//             <div style={{ marginTop: 8, padding: "7px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 6, fontFamily: "monospace", fontSize: 12, color: "#fbbf24" }}>
//               uvicorn main:app --reload
//             </div>
//           )}
//           {error.retryable && onRetry && (
//             <button
//               onClick={onRetry}
//               disabled={retryCountdown > 0}
//               style={{
//                 marginTop: 10, padding: "5px 14px", fontSize: 12, fontWeight: 700,
//                 border: "1px solid rgba(239,68,68,0.4)", borderRadius: 7,
//                 background: retryCountdown > 0 ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.14)",
//                 color: retryCountdown > 0 ? "rgba(248,113,113,0.4)" : "#f87171",
//                 cursor: retryCountdown > 0 ? "not-allowed" : "pointer",
//                 transition: "all .2s", fontFamily: "var(--font-body)",
//               }}
//             >
//               {retryCountdown > 0 ? `⏳ Retry in ${retryCountdown}s` : `↺ ${error.action || "Retry"}`}
//             </button>
//           )}
//         </div>
//         <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(248,113,113,0.5)", padding: "2px 7px", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
//           {error.type}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── UI Primitives ────────────────────────────────────────────────────────────
// function Label({ children, hint, lock }) {
//   return (
//     <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
//       {children}
//       {hint && <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-dim)", fontSize: 10.5 }}>{hint}</span>}
//       {lock && <span style={{ fontSize: 9.5, background: "var(--accent)", color: "#fff", padding: "1px 6px", borderRadius: 999, fontWeight: 700, letterSpacing: 0 }}>FIXED</span>}
//     </label>
//   );
// }

// function Inp({ value, onChange, placeholder, disabled, highlight }) {
//   return (
//     <input
//       value={value}
//       onChange={onChange}
//       placeholder={placeholder}
//       disabled={disabled}
//       style={{
//         width: "100%",
//         background: disabled ? "var(--surface2)" : highlight ? "rgba(16,185,129,0.05)" : "var(--bg)",
//         border: `1px solid ${highlight ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
//         borderRadius: "var(--radius)",
//         padding: "9px 13px",
//         color: disabled ? "var(--text-muted)" : "var(--text)",
//         fontFamily: "var(--font-body)",
//         fontSize: 13.5,
//         outline: "none",
//         transition: "border-color .2s, background .2s",
//         cursor: disabled ? "not-allowed" : "text",
//         boxSizing: "border-box",
//       }}
//       onFocus={(e) => { if (!disabled) e.target.style.borderColor = "var(--accent)"; }}
//       onBlur={(e) => (e.target.style.borderColor = highlight ? "rgba(16,185,129,0.4)" : "var(--border)")}
//     />
//   );
// }

// function TA({ value, onChange, placeholder, rows = 3, glow }) {
//   return (
//     <textarea
//       value={value}
//       onChange={onChange}
//       placeholder={placeholder}
//       rows={rows}
//       style={{
//         width: "100%",
//         background: glow ? "rgba(59,130,246,0.04)" : "var(--bg)",
//         border: `1px solid ${glow ? "rgba(59,130,246,0.5)" : "var(--border)"}`,
//         borderRadius: "var(--radius)",
//         padding: "9px 13px",
//         color: "var(--text)",
//         fontFamily: "var(--font-body)",
//         fontSize: 13.5,
//         outline: "none",
//         resize: "vertical",
//         lineHeight: 1.7,
//         transition: "border-color .2s",
//         boxSizing: "border-box",
//       }}
//       onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
//       onBlur={(e) => (e.target.style.borderColor = glow ? "rgba(59,130,246,0.5)" : "var(--border)")}
//     />
//   );
// }

// function Field({ label, hint, lock, children }) {
//   return (
//     <div style={{ marginBottom: 13 }}>
//       <Label hint={hint} lock={lock}>{label}</Label>
//       {children}
//     </div>
//   );
// }

// function Card({ title, icon, children, glow, tag, delay = 0 }) {
//   return (
//     <div
//       className="card-enter"
//       style={{
//         background: "var(--surface)",
//         border: `1px solid ${glow ? "var(--accent)" : "var(--border)"}`,
//         borderRadius: "var(--radius-lg)",
//         padding: 18,
//         marginBottom: 16,
//         boxShadow: glow
//           ? "0 0 0 1px var(--accent-glow), 0 4px 32px rgba(59,130,246,0.1)"
//           : "var(--shadow)",
//         animationDelay: `${delay}ms`,
//         transition: "box-shadow 0.2s, border-color 0.2s",
//       }}
//     >
//       <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 15 }}>
//         <span style={{ fontSize: 15 }}>{icon}</span>
//         <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13.5, color: glow ? "var(--accent2)" : "var(--text)", flex: 1 }}>{title}</span>
//         {tag && (
//           <span style={{ fontSize: 9.5, fontWeight: 800, background: "rgba(16,185,129,0.15)", color: "var(--success)", padding: "2px 8px", borderRadius: 999, letterSpacing: "0.04em" }}>
//             {tag}
//           </span>
//         )}
//       </div>
//       {children}
//     </div>
//   );
// }

// function G2({ children }) {
//   return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
// }

// function Alert({ type, children }) {
//   const map = {
//     green: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", text: "#34d399" },
//     red:   { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)",  text: "#f87171" },
//     blue:  { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", text: "#60a5fa" },
//     amber: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", text: "#fbbf24" },
//   };
//   const c = map[type] || map.blue;
//   return (
//     <div style={{ padding: "9px 13px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text, fontSize: 12.5, marginTop: 10, animation: "fadeIn 0.25s ease" }}>
//       {children}
//     </div>
//   );
// }

// // ─── Buy Rate Input ────────────────────────────────────────────────────────────
// function BuyRateInput({ rawValue, formattedValue, rateType, onChange }) {
//   const [focused, setFocused] = useState(false);

//   // Colour & badge by rate type
//   const typeConfig = {
//     hour:  { color: "#10b981", border: "rgba(16,185,129,0.4)", badge: "/HOUR",  badgeBg: "#10b981" },
//     month: { color: "#3b82f6", border: "rgba(59,130,246,0.4)", badge: "/MONTH", badgeBg: "#3b82f6" },
//   };
//   const cfg = typeConfig[rateType] || null;

//   return (
//     <div>
//       {/* Input field */}
//       <div style={{ position: "relative" }}>
//         <input
//           value={focused ? rawValue : formattedValue || rawValue}
//           onChange={(e) => onChange(e.target.value)}
//           onFocus={() => setFocused(true)}
//           onBlur={() => setFocused(false)}
//           placeholder="e.g. 600 SEK/Hour  or  60000 SEK/Month  or  50 EUR/Hour"
//           style={{
//             width: "100%",
//             background: "var(--bg)",
//             border: `1px solid ${cfg ? cfg.border : "var(--border)"}`,
//             borderRadius: "var(--radius)",
//             padding: cfg ? "9px 80px 9px 13px" : "9px 13px",
//             color: "var(--text)",
//             fontFamily: "var(--font-body)",
//             fontSize: 13.5,
//             outline: "none",
//             transition: "border-color .2s",
//             boxSizing: "border-box",
//           }}
//           onFocus={(e) => { e.target.style.borderColor = cfg ? cfg.border : "var(--accent)"; }}
//           onBlur={(e)  => { e.target.style.borderColor = cfg ? cfg.border : "var(--border)"; }}
//         />
//         {cfg && (
//           <span style={{
//             position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
//             background: cfg.badgeBg, color: "#fff", fontSize: 9.5, fontWeight: 800,
//             padding: "2px 8px", borderRadius: 999, letterSpacing: "0.06em",
//           }}>
//             {cfg.badge}
//           </span>
//         )}
//       </div>

//       {/* What the email will show */}
//       {formattedValue && !focused && (
//         <div style={{ marginTop: 5, fontSize: 11.5, color: cfg ? cfg.color : "var(--text-muted)" }}>
//           📧 Email will show: <strong>{formattedValue}</strong>
//         </div>
//       )}

//       {/* Payroll bullet hint */}
//       {rateType === "hour" && !focused && formattedValue && (
//         <div style={{
//           marginTop: 6, padding: "7px 11px",
//           background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)",
//           borderRadius: 7, fontSize: 11.5, color: "var(--success)",
//         }}>
//           💼 Hourly rate → Candidate Info bullet: <strong>"Has own Limited company to manage payroll."</strong>
//         </div>
//       )}
//       {rateType === "month" && !focused && formattedValue && (
//         <div style={{
//           marginTop: 6, padding: "7px 11px",
//           background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)",
//           borderRadius: 7, fontSize: 11.5, color: "var(--accent2)",
//         }}>
//           💰 Monthly rate → Candidate Info bullet: <strong>"Willing to work under Avance payroll."</strong>
//         </div>
//       )}

//       {/* Typing hint when empty */}
//       {!rawValue && (
//         <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-dim)", lineHeight: 1.7 }}>
//           💡 Type the amount + currency + unit, e.g.:<br />
//           <span style={{ color: "var(--success)", fontWeight: 600 }}>600 SEK/Hour</span> or{" "}
//           <span style={{ color: "var(--success)", fontWeight: 600 }}>50 EUR/Hour</span>
//           {" "}→ own Limited company<br />
//           <span style={{ color: "var(--accent2)", fontWeight: 600 }}>60000 SEK/Month</span> or{" "}
//           <span style={{ color: "var(--accent2)", fontWeight: 600 }}>4000 EUR/Month</span>
//           {" "}→ Avance payroll
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Nationality Autocomplete ─────────────────────────────────────────────────
// function NationalityInput({ value, onChange, onResolved }) {
//   const [suggestions, setSuggestions] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [highlighted, setHighlighted] = useState(0);
//   const handleInput = (e) => {
//     const val = e.target.value;
//     onChange(val);
//     if (!val.trim()) { setSuggestions([]); setOpen(false); return; }
//     const lower = val.toLowerCase();
//     const filtered = NATIONALITY_SUGGESTIONS.filter((s) => s.toLowerCase().startsWith(lower)).slice(0, 8);
//     setSuggestions(filtered);
//     setOpen(filtered.length > 0);
//     setHighlighted(0);
//   };
//   const select = (s) => { onResolved(resolveNationality(s)); setSuggestions([]); setOpen(false); };
//   const handleBlur = () => {
//     setTimeout(() => {
//       setOpen(false);
//       if (value) { const r = resolveNationality(value); if (r !== value) onResolved(r); }
//     }, 150);
//   };
//   const handleKey = (e) => {
//     if (!open) return;
//     if (e.key === "ArrowDown") { setHighlighted((h) => Math.min(h + 1, suggestions.length - 1)); e.preventDefault(); }
//     if (e.key === "ArrowUp") { setHighlighted((h) => Math.max(h - 1, 0)); e.preventDefault(); }
//     if (e.key === "Enter") { select(suggestions[highlighted]); e.preventDefault(); }
//     if (e.key === "Escape") setOpen(false);
//   };
//   const euStatus = isEUNationality(value);
//   return (
//     <div style={{ position: "relative" }}>
//       <div style={{ position: "relative" }}>
//         <input
//           value={value}
//           onChange={handleInput}
//           onBlur={handleBlur}
//           onKeyDown={handleKey}
//           onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; if (value && suggestions.length > 0) setOpen(true); }}
//           placeholder="Type country or nationality…"
//           autoComplete="off"
//           style={{
//             width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
//             borderRadius: "var(--radius)", padding: "9px 38px 9px 13px", color: "var(--text)",
//             fontFamily: "var(--font-body)", fontSize: 13.5, outline: "none",
//             transition: "border-color .2s", boxSizing: "border-box",
//           }}
//         />
//         {value && <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>{euStatus === true ? "🇪🇺" : euStatus === false ? "🌍" : ""}</span>}
//       </div>
//       {open && (
//         <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 8, marginTop: 3, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "fadeIn 0.15s ease" }}>
//           {suggestions.map((s, i) => {
//             const isEuItem = EU_NATIONALITIES.has(s);
//             return (
//               <div
//                 key={s}
//                 onMouseDown={() => select(s)}
//                 onMouseEnter={() => setHighlighted(i)}
//                 style={{
//                   padding: "9px 13px", cursor: "pointer", fontSize: 13.5,
//                   background: i === highlighted ? "var(--accent-glow)" : "transparent",
//                   color: "var(--text)", display: "flex", alignItems: "center", gap: 8,
//                   borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
//                   transition: "background .1s",
//                 }}
//               >
//                 <span>{isEuItem ? "🇪🇺" : "🌍"}</span>
//                 <span>{s}</span>
//                 {isEuItem && <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--success)", fontWeight: 700 }}>EU/EEA</span>}
//               </div>
//             );
//           })}
//         </div>
//       )}
//       {value && euStatus !== null && (
//         <div style={{ marginTop: 5, fontSize: 11.5, animation: "fadeIn 0.2s ease", color: euStatus ? "var(--success)" : "#f59e0b" }}>
//           {euStatus ? "✓ EU/EEA National — No work permit required" : "⚠ Non-EU — Work authorization required"}
//         </div>
//       )}
//     </div>
//   );
// }

// function WorkAuthField({ value, onChange, show }) {
//   if (!show) return null;
//   return (
//     <div style={{ animation: "slideDown 0.3s ease", gridColumn: "1 / -1" }}>
//       <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 10, padding: "12px 14px" }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
//           <span style={{ fontSize: 14 }}>⚠️</span>
//           <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Work Authorization Required</span>
//         </div>
//         <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
//           Work Permit / Authorization Status
//           <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 6, fontSize: 10.5, color: "var(--text-dim)" }}>auto-fills Candidate Info bullet</span>
//         </label>
//         <input
//           value={value}
//           onChange={onChange}
//           placeholder="e.g. Dependent work permit, Valid till Dec 2029"
//           style={{ width: "100%", background: "var(--bg)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 8, padding: "9px 13px", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 13.5, outline: "none", transition: "border-color .2s", boxSizing: "border-box" }}
//           onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
//           onBlur={(e) => (e.target.style.borderColor = "rgba(245,158,11,0.4)")}
//         />
//         {value && (
//           <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5 }}>
//             📝 Bullet: "<em>{value} and his wife is working for Prodware as permanent employee on a sponsored visa.</em>"
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

// function JoinNoteField({ value, onChange }) {
//   return (
//     <div>
//       <Label hint="only the suffix is editable">Joining Note</Label>
//       <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", background: "var(--bg)" }}>
//         <span style={{ padding: "9px 10px 9px 13px", background: "var(--surface2)", color: "var(--text-muted)", fontSize: 13.5, fontFamily: "var(--font-body)", whiteSpace: "nowrap", borderRight: "1px solid var(--border)", flexShrink: 0 }}>
//           {FIXED_JOIN_PREFIX}
//         </span>
//         <input
//           value={value}
//           onChange={onChange}
//           placeholder="immediately."
//           style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "9px 13px", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 13.5 }}
//         />
//       </div>
//       <p style={{ fontSize: 10.5, color: "var(--text-dim)", marginTop: 4 }}>
//         Preview: <em style={{ color: "var(--text-muted)" }}>Interview: {FIXED_INTERVIEW} {FIXED_JOIN_PREFIX} {value || "immediately."}</em>
//       </p>
//     </div>
//   );
// }

// // ─── CV Uploader ──────────────────────────────────────────────────────────────
// function CVUploader({ onExtracted, onTextReady }) {
//   const [status, setStatus] = useState("idle");
//   const [fileName, setFileName] = useState("");
//   const [err, setErr] = useState("");
//   const [pii, setPii] = useState(null);
//   const [dragOver, setDragOver] = useState(false);
//   const [tokenSaving, setTokenSaving] = useState(null); // { before, after, pct }
//   const ref = useRef();

//   const process = async (file) => {
//     if (!file) return;
//     const ext = file.name.split(".").pop().toLowerCase();
//     if (!["pdf", "docx", "doc", "txt"].includes(ext)) {
//       setStatus("error");
//       setErr("Only PDF, DOCX, DOC or TXT supported.");
//       return;
//     }
//     setStatus("loading");
//     setFileName(file.name);
//     setErr("");
//     setPii(null);
//     setTokenSaving(null);
//     try {
//       let raw =
//         ext === "txt"
//           ? await file.text()
//           : ext === "pdf"
//           ? await parsePDF(file)
//           : await parseDOCX(file);

//       if (!raw.trim()) {
//         setStatus("error");
//         setErr("No text extracted. Try another format.");
//         return;
//       }

//       // ── Extract PII from original text BEFORE stripping/normalizing ──────
//       const found = extractPII(raw);
//       setPii(found);
//       onExtracted(found);

//       // ── Strip PII then normalize whitespace ───────────────────────────────
//       const stripped = stripPII(raw);
//       const normalized = normalizeWhitespace(stripped);

//       // ── Show token-saving stats ───────────────────────────────────────────
//       const beforeChars = stripped.length;
//       const afterChars = normalized.length;
//       const pct = Math.round(((beforeChars - afterChars) / beforeChars) * 100);
//       setTokenSaving({ before: beforeChars, after: afterChars, pct });

//       onTextReady(normalized);
//       setStatus("done");
//     } catch (e) {
//       setStatus("error");
//       setErr(e.message || "Parse failed.");
//     }
//   };

//   const borderColor =
//     status === "done" ? "var(--success)" : status === "error" ? "#ef4444" : dragOver ? "var(--accent)" : "var(--border)";

//   return (
//     <div>
//       <div
//         onDrop={(e) => { e.preventDefault(); setDragOver(false); process(e.dataTransfer.files[0]); }}
//         onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
//         onDragLeave={() => setDragOver(false)}
//         onClick={() => ref.current.click()}
//         style={{
//           border: `2px dashed ${borderColor}`,
//           borderRadius: 12,
//           padding: 22,
//           textAlign: "center",
//           cursor: "pointer",
//           background: dragOver ? "rgba(59,130,246,0.05)" : status === "done" ? "rgba(16,185,129,0.04)" : "var(--bg)",
//           transition: "all .25s",
//           marginBottom: 10,
//           transform: dragOver ? "scale(1.01)" : "scale(1)",
//         }}
//       >
//         <input ref={ref} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={(e) => process(e.target.files[0])} />
//         {status === "idle" && (
//           <div style={{ animation: "fadeIn 0.3s ease" }}>
//             <div style={{ fontSize: 28, marginBottom: 7 }}>📄</div>
//             <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>Drop CV here or click to browse</div>
//             <div style={{ fontSize: 12, color: "var(--text-muted)" }}>PDF · DOCX · DOC · TXT</div>
//           </div>
//         )}
//         {status === "loading" && (
//           <div style={{ animation: "fadeIn 0.3s ease" }}>
//             <SpinEl size={26} />
//             <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-muted)" }}>Parsing <strong>{fileName}</strong>…</div>
//           </div>
//         )}
//         {status === "done" && (
//           <div style={{ animation: "fadeIn 0.3s ease" }}>
//             <div style={{ fontSize: 28, marginBottom: 5 }}>✅</div>
//             <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)", marginBottom: 2 }}>{fileName}</div>
//             <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Parsed — PII auto-filled locally · AI gets safe copy</div>
//             <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>Click to upload different file</div>
//           </div>
//         )}
//         {status === "error" && (
//           <div style={{ animation: "fadeIn 0.3s ease" }}>
//             <div style={{ fontSize: 28, marginBottom: 5 }}>❌</div>
//             <div style={{ fontWeight: 700, fontSize: 13, color: "#f87171", marginBottom: 3 }}>{err}</div>
//             <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Click to try again</div>
//           </div>
//         )}
//       </div>

//       <Alert type="green">
//         🔒 <strong>Privacy Safe:</strong> Email, Phone & DOB extracted in your browser only — <strong>never sent to AI</strong>.
//       </Alert>

//       {/* ── Token saving badge ── */}
//       {tokenSaving && status === "done" && (
//         <div
//           style={{
//             marginTop: 8,
//             padding: "8px 12px",
//             background: "rgba(16,185,129,0.07)",
//             border: "1px solid rgba(16,185,129,0.2)",
//             borderRadius: 8,
//             fontSize: 11.5,
//             color: "var(--success)",
//             animation: "fadeIn 0.3s ease",
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//             flexWrap: "wrap",
//           }}
//         >
//           <span>⚡ <strong>Whitespace removed:</strong></span>
//           <span style={{ color: "var(--text-muted)" }}>{tokenSaving.before.toLocaleString()} chars</span>
//           <span>→</span>
//           <span style={{ color: "var(--success)", fontWeight: 700 }}>{tokenSaving.after.toLocaleString()} chars</span>
//           <span
//             style={{
//               marginLeft: "auto",
//               background: "rgba(16,185,129,0.2)",
//               color: "var(--success)",
//               fontWeight: 800,
//               padding: "1px 8px",
//               borderRadius: 999,
//               fontSize: 11,
//             }}
//           >
//             -{tokenSaving.pct}% tokens saved
//           </span>
//         </div>
//       )}

//       {pii && status === "done" && (
//         <div style={{ marginTop: 8, padding: "9px 12px", background: "var(--surface2)", borderRadius: 8, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 2, animation: "fadeIn 0.3s ease" }}>
//           <strong style={{ color: "var(--text)", fontSize: 12 }}>🔍 Auto-detected (local only):</strong><br />
//           {pii.name && <span style={{ marginRight: 12 }}>👤 <strong style={{ color: "var(--text)" }}>{pii.name}</strong></span>}
//           {pii.email && <span style={{ marginRight: 12 }}>✉️ <strong style={{ color: "var(--text)" }}>{pii.email}</strong></span>}
//           {pii.phone && <span style={{ marginRight: 12 }}>📞 <strong style={{ color: "var(--text)" }}>{pii.phone}</strong></span>}
//           {pii.dob && <span>🎂 <strong style={{ color: "var(--text)" }}>{pii.dob}</strong></span>}
//         </div>
//       )}
//     </div>
//   );
// }

// function EmailPreview({ form }) {
//   return (
//     <div
//       style={{ background: "#fff", borderRadius: "var(--radius-lg)", padding: "36px 40px", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
//       dangerouslySetInnerHTML={{ __html: buildHtmlEmail(form) }}
//     />
//   );
// }

// // ─── Main App ─────────────────────────────────────────────────────────────────
// export default function App() {
//   const [form, setForm] = useState(EMPTY_FORM);
//   const [view, setView] = useState("form");
//   const [aiLoading, setAiLoading] = useState(false);
//   const [aiError, setAiError] = useState(null);
//   const [aiSuccess, setAiSuccess] = useState(false);
//   const [copied, setCopied] = useState(false);
//   const [candInfoManual, setCandInfoManual] = useState(false);
//   const [retryCountdown, setRetryCountdown] = useState(0);
//   const [backendStatus, setBackendStatus] = useState("checking");

//   useEffect(() => {
//     const check = async () => {
//       try {
//         const apiBase = import.meta.env.VITE_API_URL || "";
//         await axios.get(`${apiBase}/api/health`, { timeout: 4000 });
//         setBackendStatus("ok");
//       } catch {
//         setBackendStatus("down");
//       }
//     };
//     check();
//     const interval = setInterval(check, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   const rateInfo = parseBuyRateInput(form.buyRateRaw);
//   const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
//   const setRole = (e) => {
//     const v = e.target.value;
//     setForm((f) => ({ ...f, role: v, requisitionName: v }));
//   };
//   const setReqName = (e) => {
//     const v = e.target.value;
//     setForm((f) => ({ ...f, requisitionName: v, role: v }));
//   };
//   const rebuild = (name, nat, rateType, workAuth) =>
//     buildCandidateInfo(name, isEUNationality(nat), rateType, workAuth);
//   const setCandName = (e) => {
//     const name = e.target.value;
//     setForm((f) => ({
//       ...f,
//       candidateName: name,
//       fullName: name,
//       candidateInfo: candInfoManual
//         ? f.candidateInfo.replace(/^.+is actively looking/, `${name || "[Candidate Name]"} is actively looking`)
//         : rebuild(name, f.nationality, rateInfo.type, f.workAuthorization),
//     }));
//   };
//   const handleNationalityResolved = (resolved) => {
//     const eu = isEUNationality(resolved);
//     const eligibility = eu === true ? "Yes, EU National" : eu === false ? "Yes" : "";
//     setForm((f) => ({
//       ...f,
//       nationality: resolved,
//       eligibility,
//       workAuthorization: eu === true ? "" : f.workAuthorization,
//       candidateInfo: candInfoManual
//         ? f.candidateInfo
//         : rebuild(f.candidateName, resolved, rateInfo.type, eu === true ? "" : f.workAuthorization),
//     }));
//   };
//   const handleNationalityChange = (val) => setForm((f) => ({ ...f, nationality: val }));
//   const handleWorkAuthChange = (e) => {
//     const workAuth = e.target.value;
//     setForm((f) => ({
//       ...f,
//       workAuthorization: workAuth,
//       candidateInfo: candInfoManual ? f.candidateInfo : rebuild(f.candidateName, f.nationality, rateInfo.type, workAuth),
//     }));
//   };
//   const handleBuyRateChange = (raw) => {
//     const info = parseBuyRateInput(raw);
//     setForm((f) => ({
//       ...f,
//       buyRateRaw: raw,
//       buyRate: info.formatted || raw,
//       candidateInfo: candInfoManual ? f.candidateInfo : rebuild(f.candidateName, f.nationality, info.type, f.workAuthorization),
//     }));
//   };
//   const setCandInfo = (e) => {
//     setCandInfoManual(true);
//     setForm((f) => ({ ...f, candidateInfo: e.target.value }));
//   };

//   // ── CV text manual paste: normalize on change ──────────────────────────────
//   const handleCvTextChange = (e) => {
//     setForm((f) => ({ ...f, cvText: normalizeWhitespace(e.target.value) }));
//   };

//   const reset = () => {
//     if (window.confirm("Reset all fields to defaults?")) {
//       setForm(EMPTY_FORM);
//       setCandInfoManual(false);
//       setAiError(null);
//       setAiSuccess(false);
//     }
//   };
//   const handleExtracted = (pii) => {
//     setForm((f) => {
//       const name = pii.name || f.candidateName;
//       const resolvedNat = pii.nationality ? resolveNationality(pii.nationality) : f.nationality;
//       const eu = isEUNationality(resolvedNat);
//       const eligibility = eu === true ? "Yes, EU National" : eu === false ? "Yes" : pii.eligibility || f.eligibility;
//       setCandInfoManual(false);
//       return {
//         ...f,
//         candidateName: name,
//         fullName: name,
//         emailId: pii.email || f.emailId,
//         contactNumber: pii.phone || f.contactNumber,
//         dob: pii.dob || f.dob,
//         presentLocation: pii.location || f.presentLocation,
//         nationality: resolvedNat,
//         eligibility,
//         cvSource: pii.cvSource || f.cvSource,
//         candidateInfo: rebuild(name, resolvedNat, rateInfo.type, f.workAuthorization),
//       };
//     });
//   };

//   // onTextReady now receives already-normalized text from CVUploader
//   const handleTextReady = (safeText) => setForm((f) => ({ ...f, cvText: safeText }));

//   const startRetryCountdown = useCallback((seconds) => {
//     setRetryCountdown(seconds);
//     const interval = setInterval(() => {
//       setRetryCountdown((prev) => {
//         if (prev <= 1) { clearInterval(interval); return 0; }
//         return prev - 1;
//       });
//     }, 1000);
//   }, []);

//   const generateAI = async () => {
//     if (!form.cvText.trim()) {
//       setAiError({ type: "validation", title: "CV Text Required", message: "Please upload a CV or paste CV text before generating.", retryable: false });
//       return;
//     }
//     if (!form.requirements.trim()) {
//       setAiError({ type: "validation", title: "Job Requirements Required", message: "Please fill in the Job Requirements field before generating.", retryable: false });
//       return;
//     }
//     setAiLoading(true);
//     setAiError(null);
//     setAiSuccess(false);
//     try {
//       const apiBase = import.meta.env.VITE_API_URL || "";
//       const { data } = await axios.post(
//         `${apiBase}/api/generate-sizzling`,
//         { cv_text: form.cvText, jd_text: form.requirements },
//         { timeout: 60000 }
//       );
//       if (!data?.top_sentences || !Array.isArray(data.top_sentences))
//         throw Object.assign(new Error("Bad response"), { response: { status: 500, data: { detail: "Server returned unexpected format." } } });
//       const [s1, s2, s3] = data.top_sentences;
//       setForm((f) => ({
//         ...f,
//         candidateName: f.candidateName || data.candidate_name || "",
//         fullName: f.fullName || data.candidate_name || "",
//         sizzlingLine1: s1 || "",
//         sizzlingLine2: s2 || "",
//         sizzlingLine3: s3 || "",
//         sizzlingSkills: Array.isArray(data.skills) ? data.skills.join(", ") : data.skills || "",
//       }));
//       setAiSuccess(true);
//       setBackendStatus("ok");
//     } catch (err) {
//       const parsed = parseApiError(err);
//       setAiError(parsed);
//       if (parsed.type === "rateLimit" && parsed.waitSeconds) startRetryCountdown(parsed.waitSeconds);
//     } finally {
//       setAiLoading(false);
//     }
//   };

//   const handleCopy = async () => {
//     await copyHtmlToClipboard(buildHtmlEmail(form));
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2500);
//   };
//   const needsWorkAuth = isEUNationality(form.nationality) === false;

//   return (
//     <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
//       {/* ── Header ─────────────────────────────────────────────────────────── */}
//       <header style={{ borderBottom: "1px solid var(--border)", padding: "0 28px", background: "rgba(22,26,34,0.92)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
//         <div style={{ maxWidth: 1460, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 2px 12px rgba(99,102,241,0.4)" }}>✉️</div>
//             <div>
//               <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>RecruitMail</div>
//               <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: -1 }}>
//                 <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>AI-Powered · Privacy Safe · Europe Focus</div>
//                 <span
//                   title={backendStatus === "ok" ? "Backend running" : backendStatus === "checking" ? "Checking..." : "Backend not running"}
//                   style={{ width: 7, height: 7, borderRadius: "50%", background: backendStatus === "ok" ? "#10b981" : backendStatus === "checking" ? "#f59e0b" : "#ef4444", display: "inline-block", flexShrink: 0 }}
//                 />
//                 <span style={{ fontSize: 9, color: backendStatus === "ok" ? "#10b981" : backendStatus === "checking" ? "#f59e0b" : "#ef4444" }}>
//                   {backendStatus === "ok" ? "API OK" : backendStatus === "checking" ? "checking…" : "API DOWN"}
//                 </span>
//               </div>
//             </div>
//           </div>
//           <div style={{ display: "flex", gap: 4, background: "var(--surface2)", padding: 3, borderRadius: 9, border: "1px solid var(--border)" }}>
//             {[
//               { key: "form",         label: "📝 Email Form" },
//               { key: "preview",      label: "👁 Preview" },
//               { key: "skillmatrix",  label: "📊 Skill Matrix" },
//             ].map(({ key, label }) => (
//               <button
//                 key={key}
//                 onClick={() => setView(key)}
//                 style={{
//                   padding: "5px 16px", borderRadius: 7, border: "none", cursor: "pointer",
//                   fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5,
//                   background: view === key
//                     ? key === "skillmatrix" ? "linear-gradient(135deg,#10b981,#059669)" : "var(--accent)"
//                     : "transparent",
//                   color: view === key ? "#fff" : "var(--text-muted)",
//                   transition: "all .2s",
//                   boxShadow: view === key
//                     ? key === "skillmatrix" ? "0 2px 8px rgba(16,185,129,0.35)" : "0 2px 8px rgba(59,130,246,0.3)"
//                     : "none",
//                   whiteSpace: "nowrap",
//                 }}
//               >
//                 {label}
//               </button>
//             ))}
//           </div>
//           <div style={{ display: "flex", gap: 8 }}>
//             {view !== "skillmatrix" && (
//               <>
//                 <button onClick={reset} style={ghostBtn}>↺ Reset</button>
//                 <button onClick={handleCopy} style={copied ? successBtn : primaryBtn}>
//                   {copied ? "✓ Copied to Clipboard!" : "📋 Copy Email"}
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </header>

//       <BackendBanner status={backendStatus} />

//       <main style={{ maxWidth: 1460, margin: "0 auto", padding: "22px 28px" }}>
//         {view === "skillmatrix" ? (
//           <SkillMatrix />
//         ) : view === "form" ? (
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
//             {/* LEFT */}
//             <div>
//               <Card title="Upload Candidate CV" icon="📁" tag="AUTO-FILL" delay={0}>
//                 <CVUploader onExtracted={handleExtracted} onTextReady={handleTextReady} />
//               </Card>
//               <Card title="Greeting & Role" icon="👋" delay={50}>
//                 <G2>
//                   <Field label="Hi (Recipient Name)" hint="default: Mahesh">
//                     <Inp value={form.hiName} onChange={set("hiName")} placeholder="Mahesh" />
//                   </Field>
//                   <Field label="Candidate Name" hint="auto-fills on upload">
//                     <Inp value={form.candidateName} onChange={setCandName} placeholder="Ravi Teja" />
//                   </Field>
//                   <Field label="Role / Position" hint="→ syncs Requisition Name">
//                     <Inp value={form.role} onChange={setRole} placeholder="Operational QA Coordinator / Tester" />
//                   </Field>
//                   <Field label="Location">
//                     <Inp value={form.location} onChange={set("location")} placeholder="Stockholm, Sweden" />
//                   </Field>
//                 </G2>
//               </Card>
//               <Card title="Submission Details" icon="📋" delay={100}>
//                 <G2>
//                   <Field label="MSP Name">
//                     <Inp value={form.mspName} onChange={set("mspName")} placeholder="KeyMan AB" />
//                   </Field>
//                   <Field label="Program Name">
//                     <Inp value={form.programName} onChange={set("programName")} placeholder="(optional)" />
//                   </Field>
//                   <Field label="Requisition ID">
//                     <Inp value={form.requisitionId} onChange={set("requisitionId")} placeholder="HO287890" />
//                   </Field>
//                   <Field label="Requisition Name" hint="synced with Role">
//                     <Inp value={form.requisitionName} onChange={setReqName} placeholder="auto-filled from Role" />
//                   </Field>
//                   <Field label="Bill Rate by Client" lock>
//                     <Inp value={form.billRate} disabled />
//                   </Field>
//                   <div style={{ marginBottom: 13 }}>
//                     <Label hint="type amount + currency + /Hour or /Month">Candidate Buy Rate</Label>
//                     <BuyRateInput
//                       rawValue={form.buyRateRaw}
//                       formattedValue={rateInfo.formatted}
//                       rateType={rateInfo.type}
//                       onChange={handleBuyRateChange}
//                     />
//                   </div>
//                   <Field label="Submitted Rate (with Margin)" lock>
//                     <Inp value={form.submittedRate} disabled />
//                   </Field>
//                   <Field label="Candidate Submitted">
//                     <Inp value={form.candidateSubmitted} onChange={set("candidateSubmitted")} placeholder="14th Apr 2025" />
//                   </Field>
//                   <Field label="Submission Deadline">
//                     <Inp value={form.submissionDeadline} onChange={set("submissionDeadline")} placeholder="15th Apr 2025" />
//                   </Field>
//                   <Field label="Project Duration">
//                     <Inp value={form.projectDuration} onChange={set("projectDuration")} placeholder="2026-06-01 to 2027-03-31" />
//                   </Field>
//                 </G2>
//               </Card>
//               <Card title="Candidate Details" icon="🪪" tag="AUTO-FILL" delay={150}>
//                 <G2>
//                   <Field label="Full Name" hint="auto-filled">
//                     <Inp value={form.fullName} onChange={set("fullName")} placeholder="Ravi Teja Pagadala" />
//                   </Field>
//                   <Field label="Present Location" hint="auto-filled">
//                     <Inp value={form.presentLocation} onChange={set("presentLocation")} placeholder="Stockholm, Sweden" />
//                   </Field>
//                   <Field label="Email ID" hint="🔒 local only">
//                     <Inp value={form.emailId} onChange={set("emailId")} placeholder="ravi@gmail.com" />
//                   </Field>
//                   <Field label="Contact Number" hint="🔒 local only">
//                     <Inp value={form.contactNumber} onChange={set("contactNumber")} placeholder="+46(0)7032191048" />
//                   </Field>
//                   <div style={{ marginBottom: 13 }}>
//                     <Label hint="type country or nationality">Nationality</Label>
//                     <NationalityInput value={form.nationality} onChange={handleNationalityChange} onResolved={handleNationalityResolved} />
//                   </div>
//                   <Field label="Eligibility to Work" hint="auto-fills from nationality">
//                     <Inp value={form.eligibility} onChange={set("eligibility")} placeholder="auto-filled" highlight={!!form.eligibility} />
//                     {form.eligibility && (
//                       <div style={{ fontSize: 10.5, marginTop: 3, color: isEUNationality(form.nationality) ? "var(--success)" : "#f59e0b" }}>
//                         {isEUNationality(form.nationality) === true ? "✓ Yes, EU National" : "✓ Yes (with work authorization)"}
//                       </div>
//                     )}
//                   </Field>
//                   <Field label="CV Source" hint="auto-filled">
//                     <Inp value={form.cvSource} onChange={set("cvSource")} placeholder="LinkedIn" />
//                   </Field>
//                   <Field label="Date of Birth" hint="🔒 local only">
//                     <Inp value={form.dob} onChange={set("dob")} placeholder="16th Sep 2002" />
//                   </Field>
//                   <WorkAuthField value={form.workAuthorization} onChange={handleWorkAuthChange} show={needsWorkAuth} />
//                 </G2>
//                 <div style={{ marginTop: 6 }}>
//                   <Field label="Interview Note" lock>
//                     <Inp value={FIXED_INTERVIEW} disabled />
//                   </Field>
//                   <JoinNoteField value={form.joinNoteSuffix} onChange={set("joinNoteSuffix")} />
//                 </div>
//               </Card>
//             </div>

//             {/* RIGHT */}
//             <div>
//               <Card title="Job Requirements (from JD)" icon="📄" delay={0}>
//                 <Field label="Paste requirements — one per line">
//                   <TA
//                     value={form.requirements}
//                     onChange={set("requirements")}
//                     rows={7}
//                     placeholder={
//                       "Good experience in coordinating and following up on testing activities\nExperience in performing End to End tests\nExperience in planning and coordination\nExperience in developing and analyzing KPIs\nExperience working in Jira or similar tools\nHave a good command of the Swedish language"
//                     }
//                   />
//                 </Field>
//               </Card>

//               <Card title="AI Sizzling Generator" icon="🤖" glow delay={50}>
//                 <Alert type="blue">
//                   🛡️ <strong>Privacy safe:</strong> Email, phone & DOB replaced with [REDACTED] before being sent to AI.
//                 </Alert>
//                 {backendStatus === "down" && (
//                   <Alert type="amber">
//                     ⚠️ <strong>Backend not running.</strong> Start it:{" "}
//                     <code style={{ background: "rgba(0,0,0,0.2)", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>
//                       uvicorn main:app --reload
//                     </code>
//                   </Alert>
//                 )}
//                 <div style={{ marginTop: 12 }}>
//                   <Field label="CV Text" hint="auto-filled on upload (PII stripped + whitespace normalized) — or paste manually">
//                     <TA
//                       value={form.cvText}
//                       onChange={handleCvTextChange}
//                       rows={7}
//                       placeholder="Upload a CV above, or paste CV text here manually…"
//                     />
//                   </Field>
//                   {/* Live character counter */}
//                   {form.cvText && (
//                     <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-dim)", textAlign: "right" }}>
//                       {form.cvText.length.toLocaleString()} chars ·{" "}
//                       <span style={{ color: form.cvText.length > 30000 ? "#f87171" : "var(--success)" }}>
//                         ~{Math.round(form.cvText.length / 4).toLocaleString()} tokens
//                       </span>
//                     </div>
//                   )}
//                 </div>
//                 <button
//                   onClick={generateAI}
//                   disabled={aiLoading || retryCountdown > 0}
//                   style={{
//                     width: "100%", padding: "12px", fontSize: 13.5, border: "none", borderRadius: 9,
//                     background: aiLoading || retryCountdown > 0 ? "#374151" : "linear-gradient(135deg,#3b82f6,#6366f1)",
//                     color: "#fff", fontFamily: "var(--font-body)", fontWeight: 700,
//                     cursor: aiLoading || retryCountdown > 0 ? "not-allowed" : "pointer",
//                     display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
//                     boxShadow: aiLoading || retryCountdown > 0 ? "none" : "0 4px 16px rgba(99,102,241,0.3)",
//                     transition: "all 0.2s", opacity: retryCountdown > 0 ? 0.7 : 1,
//                   }}
//                 >
//                   {aiLoading ? <><SpinEl /> Generating — please wait…</> : retryCountdown > 0 ? `⏳ Retry available in ${retryCountdown}s` : "✨ Generate Sizzling with AI"}
//                 </button>

//                 <AIErrorAlert error={aiError} onRetry={generateAI} retryCountdown={retryCountdown} />
//                 {aiSuccess && <Alert type="green">✅ AI complete! Review & edit the fields below.</Alert>}

//                 <div style={{ marginTop: 16 }}>
//                   <Field label="Sizzling Line 1" hint="AI generated — editable">
//                     <TA value={form.sizzlingLine1} onChange={set("sizzlingLine1")} rows={3} glow={!!form.sizzlingLine1}
//                       placeholder="Experienced Test Manager with more than 20 years of experience coordinating and following up on testing activities between teams, deliveries and projects, including test planning and communication with stakeholders in agile environments using Scrum, Kanban and SAFE." />
//                   </Field>
//                   <Field label="Skills" hint="comma separated — AI generated">
//                     <TA value={form.sizzlingSkills} onChange={set("sizzlingSkills")} rows={2} glow={!!form.sizzlingSkills}
//                       placeholder="Test Management, End to End Testing, System Testing, Jira, Zephyr, HP ALM, SAFE, Scrum, Kanban, SQL, REST-services, KPI Analysis, Integration Testing, Acceptance Testing, Regression Testing" />
//                   </Field>
//                   <Field label="Sizzling Line 2" hint="AI generated — editable">
//                     <TA value={form.sizzlingLine2} onChange={set("sizzlingLine2")} rows={3} glow={!!form.sizzlingLine2}
//                       placeholder="Proficient in developing and analyzing KPIs and test coverage in projects, administering test cases in Jira, Zephyr, HP ALM and ReQTest, maintaining collaboration with vendors and Risk Management across large scale enterprise programs." />
//                   </Field>
//                   <Field label="Sizzling Line 3" hint="AI generated — editable">
//                     <TA value={form.sizzlingLine3} onChange={set("sizzlingLine3")} rows={3} glow={!!form.sizzlingLine3}
//                       placeholder="Demonstrated hands-on testing of SQL databases, ETL flows, REST-services and complex integration-heavy systems within Banking, Retail and Healthcare sectors." />
//                   </Field>
//                   <Field label="Additional Sizzling Bullets" hint="one per line — editable">
//                     <TA value={form.sizzlingExtra} onChange={set("sizzlingExtra")} rows={4}
//                       placeholder={"Fluent in English and Swedish both written and oral.\nAvailable immediately (Project ended).\nLives in Stockholm, Sweden and is flexible to be onsite 3 days a week."} />
//                   </Field>
//                 </div>
//               </Card>

//               <Card title="Candidate Information Bullets" icon="ℹ️" delay={100}>
//                 <div style={{ marginBottom: 10 }}>
//                   {rateInfo.type === "hour" && (
//                     <div style={{ padding: "6px 11px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 7, fontSize: 12, color: "var(--success)", marginBottom: 7 }}>
//                       💼 Hourly rate → last bullet: <strong>"Has own Limited company to manage payroll."</strong>
//                     </div>
//                   )}
//                   {rateInfo.type === "month" && (
//                     <div style={{ padding: "6px 11px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 7, fontSize: 12, color: "var(--accent2)", marginBottom: 7 }}>
//                       💰 Monthly rate → last bullet: <strong>"Willing to work under Avance payroll."</strong>
//                     </div>
//                   )}
//                   {form.nationality && isEUNationality(form.nationality) === true && (
//                     <div style={{ padding: "6px 11px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 7, fontSize: 12, color: "var(--success)", marginBottom: 7 }}>
//                       🇪🇺 EU National — standard 4 bullets
//                     </div>
//                   )}
//                   {form.nationality && isEUNationality(form.nationality) === false && (
//                     <div style={{ padding: "6px 11px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 7, fontSize: 12, color: "#f59e0b", marginBottom: 7 }}>
//                       🌍 Non-EU — work permit bullet {form.workAuthorization ? "inserted ✓" : "appears when Work Authorization is filled"}
//                     </div>
//                   )}
//                   {form.candidateName && (
//                     <div style={{ padding: "5px 11px", background: "rgba(59,130,246,0.08)", borderRadius: 7, fontSize: 12, color: "var(--accent2)", marginBottom: 7 }}>
//                       👤 <strong>{form.candidateName}</strong> — reflected in first bullet
//                     </div>
//                   )}
//                   {candInfoManual && (
//                     <div style={{ padding: "5px 11px", background: "rgba(239,68,68,0.08)", borderRadius: 7, fontSize: 11.5, color: "#f87171", marginBottom: 7 }}>
//                       ✏️ Manually edited — auto-updates paused. Reset to restore auto-mode.
//                     </div>
//                   )}
//                 </div>
//                 <TA value={form.candidateInfo} onChange={setCandInfo} rows={7} placeholder={buildCandidateInfo("Candidate Name", null, null, "")} />
//               </Card>
//             </div>
//           </div>
//         ) : (
//           <div className="fade-in">
//             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
//               <p style={{ color: "var(--text-muted)", fontSize: 12.5 }}>
//                 📌 Click <strong style={{ color: "var(--text)" }}>Copy Email</strong> then paste into Outlook or Gmail — the table renders correctly.
//               </p>
//               <button onClick={handleCopy} style={copied ? successBtn : primaryBtn}>
//                 {copied ? "✓ Copied!" : "📋 Copy Email (Outlook/Gmail ready)"}
//               </button>
//             </div>
//             <EmailPreview form={form} />
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

// function SpinEl({ size = 15 }) {
//   return (
//     <span style={{ width: size, height: size, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
//   );
// }

// const _b = { border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, padding: "8px 18px", transition: "all .2s" };
// const primaryBtn = { ..._b, background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", boxShadow: "0 2px 12px rgba(99,102,241,0.3)" };
// const successBtn = { ..._b, background: "var(--success)", color: "#fff" };
// const ghostBtn   = { ..._b, background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border)" };



import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import "./App.css";
import SkillMatrix from "./SkillMatrix";

// ─── EU/EEA Country → Nationality mapping ────────────────────────────────────
const EU_MAP = {
  austria: "Austrian",
  belgium: "Belgian",
  bulgaria: "Bulgarian",
  croatia: "Croatian",
  cyprus: "Cypriot",
  "czech republic": "Czech",
  czechia: "Czech",
  denmark: "Danish",
  estonia: "Estonian",
  finland: "Finnish",
  france: "French",
  germany: "German",
  greece: "Greek",
  hungary: "Hungarian",
  ireland: "Irish",
  italy: "Italian",
  latvia: "Latvian",
  lithuania: "Lithuanian",
  luxembourg: "Luxembourgish",
  malta: "Maltese",
  netherlands: "Dutch",
  holland: "Dutch",
  poland: "Polish",
  portugal: "Portuguese",
  romania: "Romanian",
  slovakia: "Slovak",
  slovenia: "Slovenian",
  spain: "Spanish",
  sweden: "Swedish",
  "united kingdom": "British",
  uk: "British",
  norway: "Norwegian",
  iceland: "Icelandic",
  switzerland: "Swiss",
  liechtenstein: "Liechtensteiner",
  austrian: "Austrian",
  belgian: "Belgian",
  bulgarian: "Bulgarian",
  croatian: "Croatian",
  cypriot: "Cypriot",
  czech: "Czech",
  danish: "Danish",
  estonian: "Estonian",
  finnish: "Finnish",
  french: "French",
  german: "German",
  greek: "Greek",
  hungarian: "Hungarian",
  irish: "Irish",
  italian: "Italian",
  latvian: "Latvian",
  lithuanian: "Lithuanian",
  luxembourgish: "Luxembourgish",
  maltese: "Maltese",
  dutch: "Dutch",
  polish: "Polish",
  portuguese: "Portuguese",
  romanian: "Romanian",
  slovak: "Slovak",
  slovenian: "Slovenian",
  spanish: "Spanish",
  swedish: "Swedish",
  british: "British",
  norwegian: "Norwegian",
  icelandic: "Icelandic",
  swiss: "Swiss",
};

const NATIONALITY_SUGGESTIONS = [
  "Austrian","Belgian","Bulgarian","Croatian","Cypriot","Czech","Danish","Dutch",
  "Estonian","Finnish","French","German","Greek","Hungarian","Icelandic","Irish",
  "Italian","Latvian","Liechtensteiner","Lithuanian","Luxembourgish","Maltese",
  "Norwegian","Polish","Portuguese","Romanian","Slovak","Slovenian","Spanish",
  "Swedish","Swiss","British","Indian","Pakistani","Bangladeshi","Sri Lankan",
  "Nepali","American","Canadian","Australian","Chinese","Filipino","Nigerian",
  "Kenyan","South African","Brazilian","Mexican","Turkish","Egyptian","Moroccan",
  "Algerian","Ukrainian","Russian","Belarusian","Georgian","Armenian","Azerbaijani",
  "Thai","Vietnamese","Indonesian","Malaysian","Singaporean","Japanese","Korean",
];

const EU_NATIONALITIES = new Set([
  "Austrian","Belgian","Bulgarian","Croatian","Cypriot","Czech","Danish","Dutch",
  "Estonian","Finnish","French","German","Greek","Hungarian","Icelandic","Irish",
  "Italian","Latvian","Lithuanian","Luxembourgish","Maltese","Norwegian","Polish",
  "Portuguese","Romanian","Slovak","Slovenian","Spanish","Swedish","Swiss",
  "British","Liechtensteiner",
]);

function isEUNationality(nat) {
  if (!nat?.trim()) return null;
  for (const eu of EU_NATIONALITIES) {
    if (eu.toLowerCase() === nat.trim().toLowerCase()) return true;
  }
  return false;
}

function resolveNationality(input) {
  if (!input) return input;
  return EU_MAP[input.trim().toLowerCase()] || input;
}

// ─── Rate helpers ─────────────────────────────────────────────────────────────
// ─── Rate helpers ─────────────────────────────────────────────────────────────
// Rules:
//   600 SEK/Hour  | 50 EUR/Hour   → type "hour"  → "Has own Limited company to manage payroll."
//   60000 SEK/Month | 4000 EUR/Month → type "month" → "Willing to work under Avance payroll."
// Detection: look for /Hour or /Month (case-insensitive) after a number+currency.
function parseBuyRateInput(raw) {
  if (!raw?.trim()) return { type: null, formatted: "", currency: "SEK" };

  const str   = raw.trim();
  const lower = str.toLowerCase();

  // Extract the numeric amount (first number found)
  const numMatch = str.match(/[\d]+(?:[,.\s]\d+)*/);
  const amount   = numMatch ? parseFloat(numMatch[0].replace(/[,\s]/g, "")) : null;

  // Currency: EUR if "eur" appears, else SEK
  const currency = /eur/i.test(str) ? "EUR" : "SEK";

  // Detect unit: /hour or /month (with optional space before slash)
  const isHour  = /\/\s*h(our)?/i.test(str);
  const isMonth = /\/\s*m(onth)?/i.test(str);

  if (!amount || (!isHour && !isMonth)) {
    // No unit detected yet — return unparsed so user keeps typing
    return { type: null, formatted: str, currency };
  }

  if (isHour) {
    return {
      type:      "hour",
      formatted: `Gross - ${amount.toLocaleString()} ${currency}/Hour`,
      amount,
      currency,
    };
  }

  // isMonth
  return {
    type:      "month",
    formatted: `Gross - ${amount.toLocaleString()} ${currency}/Month`,
    amount,
    currency,
  };
}

// ─── Candidate Info builder ───────────────────────────────────────────────────
function buildCandidateInfo(name, isEU, rateType, workAuth, gender = "he") {
  const n = name || "[Candidate Name]";
  // Derive pronouns from gender ("he" | "she" | other → "they")
  const g = (gender || "he").toLowerCase().trim();
  const his   = g === "she" ? "her"    : g === "he" ? "his"    : "their";
  const wife  = g === "she" ? "husband" : "wife";

  const payrollBullet =
    rateType === "month"
      ? "Willing to work under Avance payroll."
      : "Has own Limited company to manage payroll.";
  const base = [
    `${n} is actively looking for new opportunities, as ${his} recent project ended in Feb 2026.`,
    `Has no interviews/offers in the pipeline.`,
    `No planned vacations & ${his} communication skills are good.`,
  ];
  if (isEU === false && workAuth) {
    base.push(`${workAuth} and ${his} ${wife} is working for Prodware as permanent employee on a sponsored visa.`);
  }
  base.push(payrollBullet);
  return base.join("\n");
}

const todayFormatted = () => {
  const d = new Date();
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// ─── PII helpers ──────────────────────────────────────────────────────────────
function stripPII(text) {
  return text
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[EMAIL REDACTED]")
    .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, "[PHONE REDACTED]")
    .replace(
      /\b\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi,
      "[DOB REDACTED]"
    )
    .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, "[DOB REDACTED]");
}

// ─── NEW: Whitespace normalizer ───────────────────────────────────────────────
// Collapses multiple spaces within lines, removes blank lines entirely.
// Typical saving: 30–40% fewer tokens on PDF/DOCX extracted text.
function normalizeWhitespace(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim()) // collapse spaces within each line
    .filter((line) => line.length > 0)               // drop blank / whitespace-only lines
    .join("\n");                                       // rejoin with single newlines
}

function extractPII(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+[\d\s\-().]{7,}\d|\b0\d[\d\s\-]{7,}\d)/);
  const dobMatch = text.match(
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/i
  );
  const namePatternMatch = text.match(/(?:Full\s*Name|Name)\s*[:\-]\s*([^\n\r,]+)/i);
  const firstLineMatch = text
    .trim()
    .split("\n")
    .find((l) => l.trim().length > 2 && l.trim().length < 60);
  const locationMatch = text.match(
    /(?:Present\s*(?:Staying\s*)?Location|Location|Address|City)\s*[:\-]\s*([^\n\r,]+(?:,\s*[^\n\r]+)?)/i
  );
  const nationalityMatch = text.match(/Nationality\s*[:\-]\s*([^\n\r,]+)/i);
  const eligibilityMatch = text.match(/Eligibility[^\n\r:]*[:\-]\s*([^\n\r]+)/i);
  const cvSourceMatch = text.match(/CV\s*Source\s*[:\-]\s*([^\n\r]+)/i);
  return {
    email: emailMatch ? emailMatch[0].trim() : "",
    phone: phoneMatch ? phoneMatch[0].trim() : "",
    dob: dobMatch ? dobMatch[0].trim() : "",
    name: namePatternMatch
      ? namePatternMatch[1].trim()
      : firstLineMatch
      ? firstLineMatch.trim()
      : "",
    location: locationMatch ? locationMatch[1].trim() : "",
    nationality: nationalityMatch ? nationalityMatch[1].trim() : "",
    eligibility: eligibilityMatch ? eligibilityMatch[1].trim() : "",
    cvSource: cvSourceMatch ? cvSourceMatch[1].trim() : "",
  };
}

async function parsePDF(file) {
  const pdfjsLib = window["pdfjs-dist/build/pdf"];
  if (!pdfjsLib) throw new Error("PDF.js not loaded");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return fullText;
}

async function parseDOCX(file) {
  const mammoth = window.mammoth;
  if (!mammoth) throw new Error("Mammoth.js not loaded");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

const FIXED_INTERVIEW =
  "Candidate is available for interviews anytime during the week days with prior notice.";
const JOIN_MIDDLE = " can take up this project ";  // the fixed middle part

const EMPTY_FORM = {
  hiName: "Mahesh",
  candidateName: "",
  role: "",
  location: "",
  mspName: "",
  programName: "",
  requisitionId: "",
  requisitionName: "",
  billRate: "Open",
  buyRateRaw: "",
  buyRate: "",
  submittedRate: "Please Suggest",
  candidateSubmitted: todayFormatted(),
  submissionDeadline: "",
  projectDuration: "",
  requirements: "",
  cvText: "",
  sizzlingLine1: "",
  sizzlingSkills: "",
  sizzlingLine2: "",
  sizzlingLine3: "",
  sizzlingExtra: `Fluent in English and Swedish both written and oral.\nAvailable immediately (Project ended).\nLives in Stockholm, Sweden and is flexible to be onsite 3 days a week.`,
  candidateInfo: buildCandidateInfo("", null, null, "", "he"),
  fullName: "",
  presentLocation: "",
  emailId: "",
  contactNumber: "",
  nationality: "",
  workAuthorization: "",
  eligibility: "",
  cvSource: "LinkedIn",
  dob: "",
  joinNoteSuffix: "immediately.",
  joinPrefix: "He",
};

// ─── HTML email builder ───────────────────────────────────────────────────────
function buildHtmlEmail(f) {
  const li = (t) =>
    `<li style="margin-bottom:5px;font-family:Arial,sans-serif;font-size:14px;line-height:1.65">${t.replace(/^[•\-*]\s*/, "")}</li>`;
  const block = (text) =>
    text
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => li(l))
      .join("");
  const rows = [
    ["MSP Name", f.mspName],
    ["Program Name", f.programName],
    ["Requisition ID", f.requisitionId],
    ["Requisition Name", f.requisitionName],
    ["Bill Rate by client", f.billRate],
    ["Candidate Buy Rate", f.buyRate],
    ["Submitted Rate by Avance (with Margin)", f.submittedRate],
    ["Candidate Submitted", f.candidateSubmitted],
    ["Submission Deadline", f.submissionDeadline],
    ["Project Duration", f.projectDuration],
  ];
  const tableRows = rows
    .map(
      ([k, v]) => `
    <tr>
      <td style="border:1px solid #cbd5e1;padding:8px 13px;background:#f8fafc;font-weight:600;width:46%;font-family:Arial,sans-serif;font-size:14px;color:#334155">${k}</td>
      <td style="border:1px solid #cbd5e1;padding:8px 13px;font-family:Arial,sans-serif;font-size:14px;color:#1e293b">${v || ""}</td>
    </tr>`
    )
    .join("");
  const sizzLis = [];
  if (f.sizzlingLine1) sizzLis.push(li(f.sizzlingLine1));
  if (f.sizzlingSkills)
    sizzLis.push(
      `<li style="margin-bottom:5px;font-family:Arial,sans-serif;font-size:14px"><strong>Skills:</strong> ${f.sizzlingSkills}</li>`
    );
  if (f.sizzlingLine2) sizzLis.push(li(f.sizzlingLine2));
  if (f.sizzlingLine3) sizzLis.push(li(f.sizzlingLine3));
  const detailLis = [
    f.fullName && li(`Full Name: ${f.fullName}`),
    f.presentLocation && li(`Present Staying Location: ${f.presentLocation}`),
    f.emailId && li(`Email ID: ${f.emailId}`),
    f.contactNumber && li(`Contact Number: ${f.contactNumber}`),
    f.nationality && li(`Nationality: ${f.nationality}`),
    f.workAuthorization && li(`Work Authorization: ${f.workAuthorization}`),
    f.eligibility && li(`Eligibility to Work in job location: ${f.eligibility}`),
    f.cvSource && li(`CV Source: ${f.cvSource}`),
    f.dob && li(`DOB: ${f.dob}`),
  ]
    .filter(Boolean)
    .join("");
  const interviewLine =
    `Interview: ${FIXED_INTERVIEW} ${f.joinPrefix || "He"}${JOIN_MIDDLE}${f.joinNoteSuffix || "immediately."}`.trim();
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#1e293b;max-width:720px">
  <p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 8px">Hi <strong>${f.hiName}</strong>,</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 16px">Please find the attached resume of <strong>${f.candidateName}</strong> for <strong>${f.role}</strong> role at <strong>${f.location}</strong>.</p>
  <table style="border-collapse:collapse;width:100%;margin:0 0 20px;border:1px solid #cbd5e1"><tbody>${tableRows}</tbody></table>
  ${block(f.requirements) ? `<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Requirements:</p><ul style="margin:0 0 16px 20px;padding:0">${block(f.requirements)}</ul>` : ""}
  <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Sizzling:</p>
  <ul style="margin:0 0 16px 20px;padding:0">${sizzLis.join("")}${block(f.sizzlingExtra)}</ul>
  <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Candidate Information:</p>
  <ul style="margin:0 0 16px 20px;padding:0">${block(f.candidateInfo)}</ul>
  ${detailLis ? `<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px">Details:</p><ul style="margin:0 0 16px 20px;padding:0">${detailLis}</ul>` : ""}
  <p style="background:#fef9c3;border-left:4px solid #f59e0b;padding:10px 16px;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;margin:0">${interviewLine}</p>
</div>`;
}

async function copyHtmlToClipboard(html) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }) }),
    ]);
  } catch {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    await navigator.clipboard.writeText(tmp.innerText);
  }
}

// ─── Error parser ─────────────────────────────────────────────────────────────
function parseApiError(err) {
  if (!err?.response) {
    const code = err?.code || "";
    const msg = err?.message || "";
    if (code === "ECONNABORTED" || msg.includes("timeout")) {
      return {
        type: "timeout",
        title: "Request Timed Out",
        message: "Groq took too long to respond. Please try again.",
        action: "Retry",
        retryable: true,
      };
    }
    return {
      type: "backend_down",
      title: "Backend Server Not Running",
      message:
        "The API server is not reachable. Start it with:\n\nuvicorn main:app --reload\n\nMake sure your terminal is in the project folder, then refresh and try again.",
      action: "Retry after starting server",
      retryable: true,
    };
  }
  const status = err.response.status;
  const detail = err.response?.data?.detail || err.response?.data?.error || null;
  if (status === 400)
    return { type: "validation", title: "Invalid Request", message: detail || "Check your CV text and job requirements.", action: null, retryable: false };
  if (status === 401)
    return { type: "auth", title: "Invalid API Key", message: "Your GROQ_API_KEY is invalid or expired. Check your .env file.", action: null, retryable: false };
  if (status === 403)
    return { type: "auth", title: "Access Denied", message: detail || "Access denied by Groq API.", action: null, retryable: false };
  if (status === 413)
    return { type: "payload", title: "CV Text Too Large", message: detail || "The CV text is too large. Trim it to the most relevant sections.", action: null, retryable: false };
  if (status === 422)
    return { type: "validation", title: "Processing Error", message: detail || "The AI could not process the text. Ensure CV and requirements are plain text.", action: null, retryable: false };
  if (status === 429) {
    const retryAfter = err.response?.headers?.["retry-after"];
    const wait = retryAfter ? `${retryAfter} seconds` : "20-30 seconds";
    return {
      type: "rateLimit",
      title: "Rate Limit Reached",
      message: `Too many requests. Please wait ${wait} before trying again.`,
      action: "Retry after wait",
      retryable: true,
      waitSeconds: retryAfter ? parseInt(retryAfter) : 25,
    };
  }
  if (status === 500)
    return { type: "server", title: "Server Error", message: detail || "An unexpected server error occurred. Try again in a moment.", action: "Retry", retryable: true };
  if (status === 503 || status === 502 || status === 504)
    return { type: "unavailable", title: "Service Unavailable", message: detail || "The AI service is temporarily down. Please try again shortly.", action: "Retry", retryable: true };
  return { type: "unknown", title: `Error (${status})`, message: detail || "Something went wrong. Please try again.", action: "Retry", retryable: true };
}

// ─── Backend Status Banner ────────────────────────────────────────────────────
function BackendBanner({ status }) {
  if (status === "ok" || status === "checking") return null;
  return (
    <div style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.3)", padding: "10px 28px", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 16 }}>🔌</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 700, fontSize: 12.5, color: "#f87171" }}>Backend Not Running — </span>
        <span style={{ fontSize: 12, color: "rgba(248,113,113,0.8)" }}>
          Start it first:{" "}
          <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 7px", borderRadius: 4, fontFamily: "monospace", fontSize: 11.5, color: "#fbbf24" }}>
            uvicorn main:app --reload
          </code>{" "}
          — then the AI Generate button will work.
        </span>
      </div>
      <span style={{ fontSize: 11, color: "rgba(248,113,113,0.5)", flexShrink: 0 }}>port 8000</span>
    </div>
  );
}

// ─── AI Error Alert ────────────────────────────────────────────────────────────
function AIErrorAlert({ error, onRetry, retryCountdown }) {
  if (!error) return null;
  const iconMap = {
    backend_down: "🔌", network: "📡", timeout: "⏱️", rateLimit: "⏳",
    auth: "🔑", validation: "📋", payload: "📦", server: "🖥️",
    unavailable: "🔧", unknown: "⚠️",
  };
  const icon = iconMap[error.type] || "⚠️";
  return (
    <div style={{ marginTop: 10, padding: "13px 15px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, animation: "fadeIn 0.25s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#f87171", marginBottom: 4 }}>{error.title}</div>
          <div style={{ fontSize: 12.5, color: "rgba(248,113,113,0.85)", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{error.message}</div>
          {error.type === "backend_down" && (
            <div style={{ marginTop: 8, padding: "7px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 6, fontFamily: "monospace", fontSize: 12, color: "#fbbf24" }}>
              uvicorn main:app --reload
            </div>
          )}
          {error.retryable && onRetry && (
            <button
              onClick={onRetry}
              disabled={retryCountdown > 0}
              style={{
                marginTop: 10, padding: "5px 14px", fontSize: 12, fontWeight: 700,
                border: "1px solid rgba(239,68,68,0.4)", borderRadius: 7,
                background: retryCountdown > 0 ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.14)",
                color: retryCountdown > 0 ? "rgba(248,113,113,0.4)" : "#f87171",
                cursor: retryCountdown > 0 ? "not-allowed" : "pointer",
                transition: "all .2s", fontFamily: "var(--font-body)",
              }}
            >
              {retryCountdown > 0 ? `⏳ Retry in ${retryCountdown}s` : `↺ ${error.action || "Retry"}`}
            </button>
          )}
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(248,113,113,0.5)", padding: "2px 7px", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
          {error.type}
        </div>
      </div>
    </div>
  );
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Label({ children, hint, lock }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
      {children}
      {hint && <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-dim)", fontSize: 10.5 }}>{hint}</span>}
      {lock && <span style={{ fontSize: 9.5, background: "var(--accent)", color: "#fff", padding: "1px 6px", borderRadius: 999, fontWeight: 700, letterSpacing: 0 }}>FIXED</span>}
    </label>
  );
}

function Inp({ value, onChange, placeholder, disabled, highlight }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        background: disabled ? "var(--surface2)" : highlight ? "rgba(16,185,129,0.05)" : "var(--bg)",
        border: `1px solid ${highlight ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "9px 13px",
        color: disabled ? "var(--text-muted)" : "var(--text)",
        fontFamily: "var(--font-body)",
        fontSize: 13.5,
        outline: "none",
        transition: "border-color .2s, background .2s",
        cursor: disabled ? "not-allowed" : "text",
        boxSizing: "border-box",
      }}
      onFocus={(e) => { if (!disabled) e.target.style.borderColor = "var(--accent)"; }}
      onBlur={(e) => (e.target.style.borderColor = highlight ? "rgba(16,185,129,0.4)" : "var(--border)")}
    />
  );
}

function TA({ value, onChange, placeholder, rows = 3, glow }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        background: glow ? "rgba(59,130,246,0.04)" : "var(--bg)",
        border: `1px solid ${glow ? "rgba(59,130,246,0.5)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "9px 13px",
        color: "var(--text)",
        fontFamily: "var(--font-body)",
        fontSize: 13.5,
        outline: "none",
        resize: "vertical",
        lineHeight: 1.7,
        transition: "border-color .2s",
        boxSizing: "border-box",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
      onBlur={(e) => (e.target.style.borderColor = glow ? "rgba(59,130,246,0.5)" : "var(--border)")}
    />
  );
}

function Field({ label, hint, lock, children }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <Label hint={hint} lock={lock}>{label}</Label>
      {children}
    </div>
  );
}

function Card({ title, icon, children, glow, tag, delay = 0 }) {
  return (
    <div
      className="card-enter"
      style={{
        background: "var(--surface)",
        border: `1px solid ${glow ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: 18,
        marginBottom: 16,
        boxShadow: glow
          ? "0 0 0 1px var(--accent-glow), 0 4px 32px rgba(59,130,246,0.1)"
          : "var(--shadow)",
        animationDelay: `${delay}ms`,
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 15 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13.5, color: glow ? "var(--accent2)" : "var(--text)", flex: 1 }}>{title}</span>
        {tag && (
          <span style={{ fontSize: 9.5, fontWeight: 800, background: "rgba(16,185,129,0.15)", color: "var(--success)", padding: "2px 8px", borderRadius: 999, letterSpacing: "0.04em" }}>
            {tag}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function G2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
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
    <div style={{ padding: "9px 13px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text, fontSize: 12.5, marginTop: 10, animation: "fadeIn 0.25s ease" }}>
      {children}
    </div>
  );
}

// ─── Buy Rate Input ────────────────────────────────────────────────────────────
function BuyRateInput({ rawValue, formattedValue, rateType, onChange }) {
  const [focused, setFocused] = useState(false);

  // Colour & badge by rate type
  const typeConfig = {
    hour:  { color: "#10b981", border: "rgba(16,185,129,0.4)", badge: "/HOUR",  badgeBg: "#10b981" },
    month: { color: "#3b82f6", border: "rgba(59,130,246,0.4)", badge: "/MONTH", badgeBg: "#3b82f6" },
  };
  const cfg = typeConfig[rateType] || null;

  return (
    <div>
      {/* Input field */}
      <div style={{ position: "relative" }}>
        <input
          value={focused ? rawValue : formattedValue || rawValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="e.g. 600 SEK/Hour  or  60000 SEK/Month  or  50 EUR/Hour"
          style={{
            width: "100%",
            background: "var(--bg)",
            border: `1px solid ${cfg ? cfg.border : "var(--border)"}`,
            borderRadius: "var(--radius)",
            padding: cfg ? "9px 80px 9px 13px" : "9px 13px",
            color: "var(--text)",
            fontFamily: "var(--font-body)",
            fontSize: 13.5,
            outline: "none",
            transition: "border-color .2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => { e.target.style.borderColor = cfg ? cfg.border : "var(--accent)"; }}
          onBlur={(e)  => { e.target.style.borderColor = cfg ? cfg.border : "var(--border)"; }}
        />
        {cfg && (
          <span style={{
            position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
            background: cfg.badgeBg, color: "#fff", fontSize: 9.5, fontWeight: 800,
            padding: "2px 8px", borderRadius: 999, letterSpacing: "0.06em",
          }}>
            {cfg.badge}
          </span>
        )}
      </div>

      {/* What the email will show */}
      {formattedValue && !focused && (
        <div style={{ marginTop: 5, fontSize: 11.5, color: cfg ? cfg.color : "var(--text-muted)" }}>
          📧 Email will show: <strong>{formattedValue}</strong>
        </div>
      )}

      {/* Payroll bullet hint */}
      {rateType === "hour" && !focused && formattedValue && (
        <div style={{
          marginTop: 6, padding: "7px 11px",
          background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 7, fontSize: 11.5, color: "var(--success)",
        }}>
          💼 Hourly rate → Candidate Info bullet: <strong>"Has own Limited company to manage payroll."</strong>
        </div>
      )}
      {rateType === "month" && !focused && formattedValue && (
        <div style={{
          marginTop: 6, padding: "7px 11px",
          background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 7, fontSize: 11.5, color: "var(--accent2)",
        }}>
          💰 Monthly rate → Candidate Info bullet: <strong>"Willing to work under Avance payroll."</strong>
        </div>
      )}

      {/* Typing hint when empty */}
      {!rawValue && (
        <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-dim)", lineHeight: 1.7 }}>
          💡 Type the amount + currency + unit, e.g.:<br />
          <span style={{ color: "var(--success)", fontWeight: 600 }}>600 SEK/Hour</span> or{" "}
          <span style={{ color: "var(--success)", fontWeight: 600 }}>50 EUR/Hour</span>
          {" "}→ own Limited company<br />
          <span style={{ color: "var(--accent2)", fontWeight: 600 }}>60000 SEK/Month</span> or{" "}
          <span style={{ color: "var(--accent2)", fontWeight: 600 }}>4000 EUR/Month</span>
          {" "}→ Avance payroll
        </div>
      )}
    </div>
  );
}

// ─── Nationality Autocomplete ─────────────────────────────────────────────────
function NationalityInput({ value, onChange, onResolved }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const handleInput = (e) => {
    const val = e.target.value;
    onChange(val);
    if (!val.trim()) { setSuggestions([]); setOpen(false); return; }
    const lower = val.toLowerCase();
    const filtered = NATIONALITY_SUGGESTIONS.filter((s) => s.toLowerCase().startsWith(lower)).slice(0, 8);
    setSuggestions(filtered);
    setOpen(filtered.length > 0);
    setHighlighted(0);
  };
  const select = (s) => { onResolved(resolveNationality(s)); setSuggestions([]); setOpen(false); };
  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
      if (value) { const r = resolveNationality(value); if (r !== value) onResolved(r); }
    }, 150);
  };
  const handleKey = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") { setHighlighted((h) => Math.min(h + 1, suggestions.length - 1)); e.preventDefault(); }
    if (e.key === "ArrowUp") { setHighlighted((h) => Math.max(h - 1, 0)); e.preventDefault(); }
    if (e.key === "Enter") { select(suggestions[highlighted]); e.preventDefault(); }
    if (e.key === "Escape") setOpen(false);
  };
  const euStatus = isEUNationality(value);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKey}
          onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; if (value && suggestions.length > 0) setOpen(true); }}
          placeholder="Type country or nationality…"
          autoComplete="off"
          style={{
            width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "9px 38px 9px 13px", color: "var(--text)",
            fontFamily: "var(--font-body)", fontSize: 13.5, outline: "none",
            transition: "border-color .2s", boxSizing: "border-box",
          }}
        />
        {value && <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>{euStatus === true ? "🇪🇺" : euStatus === false ? "🌍" : ""}</span>}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 8, marginTop: 3, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "fadeIn 0.15s ease" }}>
          {suggestions.map((s, i) => {
            const isEuItem = EU_NATIONALITIES.has(s);
            return (
              <div
                key={s}
                onMouseDown={() => select(s)}
                onMouseEnter={() => setHighlighted(i)}
                style={{
                  padding: "9px 13px", cursor: "pointer", fontSize: 13.5,
                  background: i === highlighted ? "var(--accent-glow)" : "transparent",
                  color: "var(--text)", display: "flex", alignItems: "center", gap: 8,
                  borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background .1s",
                }}
              >
                <span>{isEuItem ? "🇪🇺" : "🌍"}</span>
                <span>{s}</span>
                {isEuItem && <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--success)", fontWeight: 700 }}>EU/EEA</span>}
              </div>
            );
          })}
        </div>
      )}
      {value && euStatus !== null && (
        <div style={{ marginTop: 5, fontSize: 11.5, animation: "fadeIn 0.2s ease", color: euStatus ? "var(--success)" : "#f59e0b" }}>
          {euStatus ? "✓ EU/EEA National — No work permit required" : "⚠ Non-EU — Work authorization required"}
        </div>
      )}
    </div>
  );
}

function WorkAuthField({ value, onChange, show, gender }) {
  if (!show) return null;
  const g = (gender || "he").toLowerCase().trim();
  const his  = g === "she" ? "her"     : "his";
  const wife = g === "she" ? "husband" : "wife";
  return (
    <div style={{ animation: "slideDown 0.3s ease", gridColumn: "1 / -1" }}>
      <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Work Authorization Required</span>
        </div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
          Work Permit / Authorization Status
          <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 6, fontSize: 10.5, color: "var(--text-dim)" }}>auto-fills Candidate Info bullet</span>
        </label>
        <input
          value={value}
          onChange={onChange}
          placeholder="e.g. Dependent work permit, Valid till Dec 2029"
          style={{ width: "100%", background: "var(--bg)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 8, padding: "9px 13px", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 13.5, outline: "none", transition: "border-color .2s", boxSizing: "border-box" }}
          onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(245,158,11,0.4)")}
        />
        {value && (
          <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5 }}>
            📝 Bullet: "<em>{value} and {his} {wife} is working for Prodware as permanent employee on a sponsored visa.</em>"
          </p>
        )}
      </div>
    </div>
  );
}

function JoinNoteField({ prefix, onPrefixChange, suffix, onSuffixChange }) {
  return (
    <div>
      <Label hint="He / She — editable">Joining Note</Label>
      <div style={{
        display: "flex", alignItems: "center",
        border: "1px solid var(--border)", borderRadius: "var(--radius)",
        overflow: "hidden", background: "var(--bg)",
      }}>
        {/* Editable He/She */}
        <input
          value={prefix}
          onChange={onPrefixChange}
          placeholder="He"
          title="Type He or She"
          style={{
            width: 46, background: "var(--surface2)", border: "none",
            borderRight: "1px solid var(--border)", outline: "none",
            padding: "9px 8px", color: "var(--accent2)",
            fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 700,
            textAlign: "center", flexShrink: 0,
          }}
        />
        {/* Fixed middle */}
        <span style={{
          padding: "9px 8px", background: "var(--surface2)", color: "var(--text-muted)",
          fontSize: 13.5, fontFamily: "var(--font-body)", whiteSpace: "nowrap",
          borderRight: "1px solid var(--border)", flexShrink: 0,
        }}>
          can take up this project
        </span>
        {/* Editable suffix */}
        <input
          value={suffix}
          onChange={onSuffixChange}
          placeholder="immediately."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            padding: "9px 13px", color: "var(--text)",
            fontFamily: "var(--font-body)", fontSize: 13.5,
          }}
        />
      </div>
      <p style={{ fontSize: 10.5, color: "var(--text-dim)", marginTop: 4 }}>
        Preview:{" "}
        <em style={{ color: "var(--text-muted)" }}>
          Interview: {FIXED_INTERVIEW} {prefix || "He"}{JOIN_MIDDLE}{suffix || "immediately."}
        </em>
      </p>
    </div>
  );
}

// ─── CV Source shortcuts map ──────────────────────────────────────────────────
const CV_SOURCE_MAP = {
  l: "LinkedIn",
  li: "LinkedIn",
  lin: "LinkedIn",
  link: "LinkedIn",
  linked: "LinkedIn",
  linkedin: "LinkedIn",
  w: "Wisestep",
  wi: "Wisestep",
  wis: "Wisestep",
  wise: "Wisestep",
  wisest: "Wisestep",
  wisestep: "Wisestep",
  n: "Naukri",
  na: "Naukri",
  nau: "Naukri",
  nauk: "Naukri",
  naukri: "Naukri",
  i: "Indeed",
  in: "Indeed",
  ind: "Indeed",
  inde: "Indeed",
  indee: "Indeed",
  indeed: "Indeed",
  m: "Monster",
  mo: "Monster",
  mon: "Monster",
  mons: "Monster",
  monst: "Monster",
  monster: "Monster",
  r: "Referral",
  re: "Referral",
  ref: "Referral",
  refe: "Referral",
  refer: "Referral",
  referr: "Referral",
  referral: "Referral",
  g: "GitHub",
  gi: "GitHub",
  git: "GitHub",
  gith: "GitHub",
  github: "GitHub",
  x: "Xing",
  xi: "Xing",
  xin: "Xing",
  xing: "Xing",
};

const CV_SOURCE_SUGGESTIONS = [
  "LinkedIn", "Wisestep", "Indeed", "Naukri", "Monster",
  "Referral", "GitHub", "Xing", "JobTeaser", "StepStone",
];

function CVSourceInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef();

  const handleChange = (e) => {
    const raw = e.target.value;
    // Check shortcut map
    const resolved = CV_SOURCE_MAP[raw.trim().toLowerCase()];
    if (resolved) {
      onChange({ target: { value: resolved } });
    } else {
      onChange(e);
    }
    // Show dropdown suggestions
    const lower = raw.toLowerCase();
    const matches = CV_SOURCE_SUGGESTIONS.filter(s => s.toLowerCase().startsWith(lower));
    setOpen(matches.length > 0 && raw.length > 0);
    setHighlighted(0);
  };

  const suggestions = CV_SOURCE_SUGGESTIONS.filter(s =>
    s.toLowerCase().startsWith(value.toLowerCase())
  );

  const select = (s) => {
    onChange({ target: { value: s } });
    setOpen(false);
  };

  const handleKey = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") { setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); e.preventDefault(); }
    if (e.key === "ArrowUp")   { setHighlighted(h => Math.max(h - 1, 0)); e.preventDefault(); }
    if (e.key === "Enter")     { select(suggestions[highlighted]); e.preventDefault(); }
    if (e.key === "Escape")    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKey}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--accent)";
          if (value && suggestions.length > 0) setOpen(true);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border)";
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder="LinkedIn"
        autoComplete="off"
        style={{
          width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "9px 13px", color: "var(--text)",
          fontFamily: "var(--font-body)", fontSize: 13.5, outline: "none",
          transition: "border-color .2s", boxSizing: "border-box",
        }}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
          background: "var(--surface)", border: "1px solid var(--accent)",
          borderRadius: 8, marginTop: 3, overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "fadeIn 0.15s ease",
        }}>
          {suggestions.map((s, i) => (
            <div
              key={s}
              onMouseDown={() => select(s)}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                padding: "9px 13px", cursor: "pointer", fontSize: 13.5,
                background: i === highlighted ? "var(--accent-glow)" : "transparent",
                color: "var(--text)",
                borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background .1s",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
      {value && (
        <div style={{ marginTop: 4, fontSize: 10.5, color: "var(--text-dim)" }}>
          💡 Type first letter to shortcut: W→Wisestep, I→Indeed, N→Naukri, R→Referral…
        </div>
      )}
    </div>
  );
}
function CVUploader({ onExtracted, onTextReady }) {
  const [status, setStatus] = useState("idle");
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");
  const [pii, setPii] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [tokenSaving, setTokenSaving] = useState(null); // { before, after, pct }
  const ref = useRef();

  const process = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "doc", "txt"].includes(ext)) {
      setStatus("error");
      setErr("Only PDF, DOCX, DOC or TXT supported.");
      return;
    }
    setStatus("loading");
    setFileName(file.name);
    setErr("");
    setPii(null);
    setTokenSaving(null);
    try {
      let raw =
        ext === "txt"
          ? await file.text()
          : ext === "pdf"
          ? await parsePDF(file)
          : await parseDOCX(file);

      if (!raw.trim()) {
        setStatus("error");
        setErr("No text extracted. Try another format.");
        return;
      }

      // ── Extract PII from original text BEFORE stripping/normalizing ──────
      const found = extractPII(raw);
      setPii(found);
      onExtracted(found);

      // ── Strip PII then normalize whitespace ───────────────────────────────
      const stripped = stripPII(raw);
      const normalized = normalizeWhitespace(stripped);

      // ── Show token-saving stats ───────────────────────────────────────────
      const beforeChars = stripped.length;
      const afterChars = normalized.length;
      const pct = Math.round(((beforeChars - afterChars) / beforeChars) * 100);
      setTokenSaving({ before: beforeChars, after: afterChars, pct });

      onTextReady(normalized);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErr(e.message || "Parse failed.");
    }
  };

  const borderColor =
    status === "done" ? "var(--success)" : status === "error" ? "#ef4444" : dragOver ? "var(--accent)" : "var(--border)";

  return (
    <div>
      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); process(e.dataTransfer.files[0]); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => ref.current.click()}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: 12,
          padding: 22,
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "rgba(59,130,246,0.05)" : status === "done" ? "rgba(16,185,129,0.04)" : "var(--bg)",
          transition: "all .25s",
          marginBottom: 10,
          transform: dragOver ? "scale(1.01)" : "scale(1)",
        }}
      >
        <input ref={ref} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={(e) => process(e.target.files[0])} />
        {status === "idle" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 28, marginBottom: 7 }}>📄</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>Drop CV here or click to browse</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>PDF · DOCX · DOC · TXT</div>
          </div>
        )}
        {status === "loading" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <SpinEl size={26} />
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-muted)" }}>Parsing <strong>{fileName}</strong>…</div>
          </div>
        )}
        {status === "done" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 28, marginBottom: 5 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)", marginBottom: 2 }}>{fileName}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Parsed — PII auto-filled locally · AI gets safe copy</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>Click to upload different file</div>
          </div>
        )}
        {status === "error" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 28, marginBottom: 5 }}>❌</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#f87171", marginBottom: 3 }}>{err}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Click to try again</div>
          </div>
        )}
      </div>

      <Alert type="green">
        🔒 <strong>Privacy Safe:</strong> Email, Phone & DOB extracted in your browser only — <strong>never sent to AI</strong>.
      </Alert>

      {/* ── Token saving badge ── */}
      {tokenSaving && status === "done" && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "rgba(16,185,129,0.07)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 8,
            fontSize: 11.5,
            color: "var(--success)",
            animation: "fadeIn 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>⚡ <strong>Whitespace removed:</strong></span>
          <span style={{ color: "var(--text-muted)" }}>{tokenSaving.before.toLocaleString()} chars</span>
          <span>→</span>
          <span style={{ color: "var(--success)", fontWeight: 700 }}>{tokenSaving.after.toLocaleString()} chars</span>
          <span
            style={{
              marginLeft: "auto",
              background: "rgba(16,185,129,0.2)",
              color: "var(--success)",
              fontWeight: 800,
              padding: "1px 8px",
              borderRadius: 999,
              fontSize: 11,
            }}
          >
            -{tokenSaving.pct}% tokens saved
          </span>
        </div>
      )}

      {pii && status === "done" && (
        <div style={{ marginTop: 8, padding: "9px 12px", background: "var(--surface2)", borderRadius: 8, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 2, animation: "fadeIn 0.3s ease" }}>
          <strong style={{ color: "var(--text)", fontSize: 12 }}>🔍 Auto-detected (local only):</strong><br />
          {pii.name && <span style={{ marginRight: 12 }}>👤 <strong style={{ color: "var(--text)" }}>{pii.name}</strong></span>}
          {pii.email && <span style={{ marginRight: 12 }}>✉️ <strong style={{ color: "var(--text)" }}>{pii.email}</strong></span>}
          {pii.phone && <span style={{ marginRight: 12 }}>📞 <strong style={{ color: "var(--text)" }}>{pii.phone}</strong></span>}
          {pii.dob && <span>🎂 <strong style={{ color: "var(--text)" }}>{pii.dob}</strong></span>}
        </div>
      )}
    </div>
  );
}

function EmailPreview({ form }) {
  return (
    <div
      style={{ background: "#fff", borderRadius: "var(--radius-lg)", padding: "36px 40px", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
      dangerouslySetInnerHTML={{ __html: buildHtmlEmail(form) }}
    />
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [view, setView] = useState("form");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [candInfoManual, setCandInfoManual] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    const check = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "";
        await axios.get(`${apiBase}/api/health`, { timeout: 4000 });
        setBackendStatus("ok");
      } catch {
        setBackendStatus("down");
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const rateInfo = parseBuyRateInput(form.buyRateRaw);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setRole = (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, role: v, requisitionName: v }));
  };
  const setReqName = (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, requisitionName: v, role: v }));
  };
  const rebuild = (name, nat, rateType, workAuth, prefix) =>
    buildCandidateInfo(name, isEUNationality(nat), rateType, workAuth, prefix || form.joinPrefix || "he");
  const setCandName = (e) => {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      candidateName: name,
      fullName: name,
      candidateInfo: candInfoManual
        ? f.candidateInfo.replace(/^.+is actively looking/, `${name || "[Candidate Name]"} is actively looking`)
        : rebuild(name, f.nationality, rateInfo.type, f.workAuthorization),
    }));
  };
  const handleNationalityResolved = (resolved) => {
    const eu = isEUNationality(resolved);
    const eligibility = eu === true ? "Yes, EU National" : eu === false ? "Yes" : "";
    setForm((f) => ({
      ...f,
      nationality: resolved,
      eligibility,
      workAuthorization: eu === true ? "" : f.workAuthorization,
      candidateInfo: candInfoManual
        ? f.candidateInfo
        : rebuild(f.candidateName, resolved, rateInfo.type, eu === true ? "" : f.workAuthorization),
    }));
  };
  const handleNationalityChange = (val) => setForm((f) => ({ ...f, nationality: val }));
  const handleWorkAuthChange = (e) => {
    const workAuth = e.target.value;
    setForm((f) => ({
      ...f,
      workAuthorization: workAuth,
      candidateInfo: candInfoManual ? f.candidateInfo : rebuild(f.candidateName, f.nationality, rateInfo.type, workAuth),
    }));
  };
  const handleBuyRateChange = (raw) => {
    const info = parseBuyRateInput(raw);
    setForm((f) => ({
      ...f,
      buyRateRaw: raw,
      buyRate: info.formatted || raw,
      candidateInfo: candInfoManual ? f.candidateInfo : rebuild(f.candidateName, f.nationality, info.type, f.workAuthorization),
    }));
  };

  // ── Join prefix (He/She) change — rebuilds candidateInfo pronouns live ──────
  const handleJoinPrefixChange = (e) => {
    const prefix = e.target.value;
    setForm((f) => ({
      ...f,
      joinPrefix: prefix,
      candidateInfo: candInfoManual
        ? f.candidateInfo
        : buildCandidateInfo(
            f.candidateName,
            isEUNationality(f.nationality),
            parseBuyRateInput(f.buyRateRaw).type,
            f.workAuthorization,
            prefix,
          ),
    }));
  };
  const setCandInfo = (e) => {
    setCandInfoManual(true);
    setForm((f) => ({ ...f, candidateInfo: e.target.value }));
  };

  // ── CV text manual paste: normalize on change ──────────────────────────────
  const handleCvTextChange = (e) => {
    setForm((f) => ({ ...f, cvText: normalizeWhitespace(e.target.value) }));
  };

  const reset = () => {
    if (window.confirm("Reset all fields to defaults?")) {
      setForm(EMPTY_FORM);
      setCandInfoManual(false);
      setAiError(null);
      setAiSuccess(false);
    }
  };
  const handleExtracted = (pii) => {
    setForm((f) => {
      const name = pii.name || f.candidateName;
      const resolvedNat = pii.nationality ? resolveNationality(pii.nationality) : f.nationality;
      const eu = isEUNationality(resolvedNat);
      const eligibility = eu === true ? "Yes, EU National" : eu === false ? "Yes" : pii.eligibility || f.eligibility;
      setCandInfoManual(false);
      return {
        ...f,
        candidateName: name,
        fullName: name,
        emailId: pii.email || f.emailId,
        contactNumber: pii.phone || f.contactNumber,
        dob: pii.dob || f.dob,
        presentLocation: pii.location || f.presentLocation,
        nationality: resolvedNat,
        eligibility,
        cvSource: pii.cvSource || f.cvSource,
        candidateInfo: rebuild(name, resolvedNat, rateInfo.type, f.workAuthorization),
      };
    });
  };

  // onTextReady now receives already-normalized text from CVUploader
  const handleTextReady = (safeText) => setForm((f) => ({ ...f, cvText: safeText }));

  const startRetryCountdown = useCallback((seconds) => {
    setRetryCountdown(seconds);
    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const generateAI = async () => {
    if (!form.cvText.trim()) {
      setAiError({ type: "validation", title: "CV Text Required", message: "Please upload a CV or paste CV text before generating.", retryable: false });
      return;
    }
    if (!form.requirements.trim()) {
      setAiError({ type: "validation", title: "Job Requirements Required", message: "Please fill in the Job Requirements field before generating.", retryable: false });
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(false);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const { data } = await axios.post(
        `${apiBase}/api/generate-sizzling`,
        { cv_text: form.cvText, jd_text: form.requirements },
        { timeout: 60000 }
      );
      if (!data?.top_sentences || !Array.isArray(data.top_sentences))
        throw Object.assign(new Error("Bad response"), { response: { status: 500, data: { detail: "Server returned unexpected format." } } });
      const [s1, s2, s3] = data.top_sentences;
      setForm((f) => ({
        ...f,
        candidateName: f.candidateName || data.candidate_name || "",
        fullName: f.fullName || data.candidate_name || "",
        sizzlingLine1: s1 || "",
        sizzlingLine2: s2 || "",
        sizzlingLine3: s3 || "",
        sizzlingSkills: Array.isArray(data.skills) ? data.skills.join(", ") : data.skills || "",
      }));
      setAiSuccess(true);
      setBackendStatus("ok");
    } catch (err) {
      const parsed = parseApiError(err);
      setAiError(parsed);
      if (parsed.type === "rateLimit" && parsed.waitSeconds) startRetryCountdown(parsed.waitSeconds);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = async () => {
    await copyHtmlToClipboard(buildHtmlEmail(form));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const needsWorkAuth = isEUNationality(form.nationality) === false;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid var(--border)", padding: "0 28px", background: "rgba(22,26,34,0.92)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1460, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 2px 12px rgba(99,102,241,0.4)" }}>✉️</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>RecruitMail</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: -1 }}>
                <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>AI-Powered · Privacy Safe · Europe Focus</div>
                <span
                  title={backendStatus === "ok" ? "Backend running" : backendStatus === "checking" ? "Checking..." : "Backend not running"}
                  style={{ width: 7, height: 7, borderRadius: "50%", background: backendStatus === "ok" ? "#10b981" : backendStatus === "checking" ? "#f59e0b" : "#ef4444", display: "inline-block", flexShrink: 0 }}
                />
                <span style={{ fontSize: 9, color: backendStatus === "ok" ? "#10b981" : backendStatus === "checking" ? "#f59e0b" : "#ef4444" }}>
                  {backendStatus === "ok" ? "API OK" : backendStatus === "checking" ? "checking…" : "API DOWN"}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "var(--surface2)", padding: 3, borderRadius: 9, border: "1px solid var(--border)" }}>
            {[
              { key: "form",         label: "📝 Email Form" },
              { key: "preview",      label: "👁 Preview" },
              { key: "skillmatrix",  label: "📊 Skill Matrix" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                style={{
                  padding: "5px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5,
                  background: view === key
                    ? key === "skillmatrix" ? "linear-gradient(135deg,#10b981,#059669)" : "var(--accent)"
                    : "transparent",
                  color: view === key ? "#fff" : "var(--text-muted)",
                  transition: "all .2s",
                  boxShadow: view === key
                    ? key === "skillmatrix" ? "0 2px 8px rgba(16,185,129,0.35)" : "0 2px 8px rgba(59,130,246,0.3)"
                    : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {view !== "skillmatrix" && (
              <>
                <button onClick={reset} style={ghostBtn}>↺ Reset</button>
                <button onClick={handleCopy} style={copied ? successBtn : primaryBtn}>
                  {copied ? "✓ Copied to Clipboard!" : "📋 Copy Email"}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <BackendBanner status={backendStatus} />

      <main style={{ maxWidth: 1460, margin: "0 auto", padding: "22px 28px" }}>
        {view === "skillmatrix" ? (
          <SkillMatrix />
        ) : view === "form" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* LEFT */}
            <div>
              <Card title="Upload Candidate CV" icon="📁" tag="AUTO-FILL" delay={0}>
                <CVUploader onExtracted={handleExtracted} onTextReady={handleTextReady} />
              </Card>
              <Card title="Greeting & Role" icon="👋" delay={50}>
                <G2>
                  <Field label="Hi (Recipient Name)" hint="default: Mahesh">
                    <Inp value={form.hiName} onChange={set("hiName")} placeholder="Mahesh" />
                  </Field>
                  <Field label="Candidate Name" hint="auto-fills on upload">
                    <Inp value={form.candidateName} onChange={setCandName} placeholder="Ravi Teja" />
                  </Field>
                  <Field label="Role / Position" hint="→ syncs Requisition Name">
                    <Inp value={form.role} onChange={setRole} placeholder="Operational QA Coordinator / Tester" />
                  </Field>
                  <Field label="Location">
                    <Inp value={form.location} onChange={set("location")} placeholder="Stockholm, Sweden" />
                  </Field>
                </G2>
              </Card>
              <Card title="Submission Details" icon="📋" delay={100}>
                <G2>
                  <Field label="MSP Name">
                    <Inp value={form.mspName} onChange={set("mspName")} placeholder="KeyMan AB" />
                  </Field>
                  <Field label="Program Name">
                    <Inp value={form.programName} onChange={set("programName")} placeholder="(optional)" />
                  </Field>
                  <Field label="Requisition ID">
                    <Inp value={form.requisitionId} onChange={set("requisitionId")} placeholder="HO287890" />
                  </Field>
                  <Field label="Requisition Name" hint="synced with Role">
                    <Inp value={form.requisitionName} onChange={setReqName} placeholder="auto-filled from Role" />
                  </Field>
                  <Field label="Bill Rate by Client" lock>
                    <Inp value={form.billRate} disabled />
                  </Field>
                  <div style={{ marginBottom: 13 }}>
                    <Label hint="type amount + currency + /Hour or /Month">Candidate Buy Rate</Label>
                    <BuyRateInput
                      rawValue={form.buyRateRaw}
                      formattedValue={rateInfo.formatted}
                      rateType={rateInfo.type}
                      onChange={handleBuyRateChange}
                    />
                  </div>
                  <Field label="Submitted Rate (with Margin)" lock>
                    <Inp value={form.submittedRate} disabled />
                  </Field>
                  <Field label="Candidate Submitted">
                    <Inp value={form.candidateSubmitted} onChange={set("candidateSubmitted")} placeholder="14th Apr 2025" />
                  </Field>
                  <Field label="Submission Deadline">
                    <Inp value={form.submissionDeadline} onChange={set("submissionDeadline")} placeholder="15th Apr 2025" />
                  </Field>
                  <Field label="Project Duration">
                    <Inp value={form.projectDuration} onChange={set("projectDuration")} placeholder="2026-06-01 to 2027-03-31" />
                  </Field>
                </G2>
              </Card>
              <Card title="Candidate Details" icon="🪪" tag="AUTO-FILL" delay={150}>
                <G2>
                  <Field label="Full Name" hint="auto-filled">
                    <Inp value={form.fullName} onChange={set("fullName")} placeholder="Ravi Teja Pagadala" />
                  </Field>
                  <Field label="Present Location" hint="auto-filled">
                    <Inp value={form.presentLocation} onChange={set("presentLocation")} placeholder="Stockholm, Sweden" />
                  </Field>
                  <Field label="Email ID" hint="🔒 local only">
                    <Inp value={form.emailId} onChange={set("emailId")} placeholder="ravi@gmail.com" />
                  </Field>
                  <Field label="Contact Number" hint="🔒 local only">
                    <Inp value={form.contactNumber} onChange={set("contactNumber")} placeholder="+46(0)7032191048" />
                  </Field>
                  <div style={{ marginBottom: 13 }}>
                    <Label hint="type country or nationality">Nationality</Label>
                    <NationalityInput value={form.nationality} onChange={handleNationalityChange} onResolved={handleNationalityResolved} />
                  </div>
                  <Field label="Eligibility to Work" hint="auto-fills from nationality">
                    <Inp value={form.eligibility} onChange={set("eligibility")} placeholder="auto-filled" highlight={!!form.eligibility} />
                    {form.eligibility && (
                      <div style={{ fontSize: 10.5, marginTop: 3, color: isEUNationality(form.nationality) ? "var(--success)" : "#f59e0b" }}>
                        {isEUNationality(form.nationality) === true ? "✓ Yes, EU National" : "✓ Yes (with work authorization)"}
                      </div>
                    )}
                  </Field>
                  <Field label="CV Source" hint="auto-filled · type W for Wisestep, I for Indeed…">
                    <CVSourceInput value={form.cvSource} onChange={(e) => setForm(f => ({ ...f, cvSource: e.target.value }))} />
                  </Field>
                  <Field label="Date of Birth" hint="🔒 local only">
                    <Inp value={form.dob} onChange={set("dob")} placeholder="16th Sep 2002" />
                  </Field>
                  <WorkAuthField value={form.workAuthorization} onChange={handleWorkAuthChange} show={needsWorkAuth} gender={form.joinPrefix} />
                </G2>
                <div style={{ marginTop: 6 }}>
                  <Field label="Interview Note" lock>
                    <Inp value={FIXED_INTERVIEW} disabled />
                  </Field>
                  <JoinNoteField
                    prefix={form.joinPrefix}
                    onPrefixChange={handleJoinPrefixChange}
                    suffix={form.joinNoteSuffix}
                    onSuffixChange={set("joinNoteSuffix")}
                  />
                </div>
              </Card>
            </div>

            {/* RIGHT */}
            <div>
              <Card title="Job Requirements (from JD)" icon="📄" delay={0}>
                <Field label="Paste requirements — one per line">
                  <TA
                    value={form.requirements}
                    onChange={set("requirements")}
                    rows={7}
                    placeholder={
                      "Good experience in coordinating and following up on testing activities\nExperience in performing End to End tests\nExperience in planning and coordination\nExperience in developing and analyzing KPIs\nExperience working in Jira or similar tools\nHave a good command of the Swedish language"
                    }
                  />
                </Field>
              </Card>

              <Card title="AI Sizzling Generator" icon="🤖" glow delay={50}>
                <Alert type="blue">
                  🛡️ <strong>Privacy safe:</strong> Email, phone & DOB replaced with [REDACTED] before being sent to AI.
                </Alert>
                {backendStatus === "down" && (
                  <Alert type="amber">
                    ⚠️ <strong>Backend not running.</strong> Start it:{" "}
                    <code style={{ background: "rgba(0,0,0,0.2)", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>
                      uvicorn main:app --reload
                    </code>
                  </Alert>
                )}
                <div style={{ marginTop: 12 }}>
                  <Field label="CV Text" hint="auto-filled on upload (PII stripped + whitespace normalized) — or paste manually">
                    <TA
                      value={form.cvText}
                      onChange={handleCvTextChange}
                      rows={7}
                      placeholder="Upload a CV above, or paste CV text here manually…"
                    />
                  </Field>
                  {/* Live character counter */}
                  {form.cvText && (
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-dim)", textAlign: "right" }}>
                      {form.cvText.length.toLocaleString()} chars ·{" "}
                      <span style={{ color: form.cvText.length > 30000 ? "#f87171" : "var(--success)" }}>
                        ~{Math.round(form.cvText.length / 4).toLocaleString()} tokens
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={generateAI}
                  disabled={aiLoading || retryCountdown > 0}
                  style={{
                    width: "100%", padding: "12px", fontSize: 13.5, border: "none", borderRadius: 9,
                    background: aiLoading || retryCountdown > 0 ? "#374151" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                    color: "#fff", fontFamily: "var(--font-body)", fontWeight: 700,
                    cursor: aiLoading || retryCountdown > 0 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: aiLoading || retryCountdown > 0 ? "none" : "0 4px 16px rgba(99,102,241,0.3)",
                    transition: "all 0.2s", opacity: retryCountdown > 0 ? 0.7 : 1,
                  }}
                >
                  {aiLoading ? <><SpinEl /> Generating — please wait…</> : retryCountdown > 0 ? `⏳ Retry available in ${retryCountdown}s` : "✨ Generate Sizzling with AI"}
                </button>

                <AIErrorAlert error={aiError} onRetry={generateAI} retryCountdown={retryCountdown} />
                {aiSuccess && <Alert type="green">✅ AI complete! Review & edit the fields below.</Alert>}

                <div style={{ marginTop: 16 }}>
                  <Field label="Sizzling Line 1" hint="AI generated — editable">
                    <TA value={form.sizzlingLine1} onChange={set("sizzlingLine1")} rows={3} glow={!!form.sizzlingLine1}
                      placeholder="Experienced Test Manager with more than 20 years of experience coordinating and following up on testing activities between teams, deliveries and projects, including test planning and communication with stakeholders in agile environments using Scrum, Kanban and SAFE." />
                  </Field>
                  <Field label="Skills" hint="comma separated — AI generated">
                    <TA value={form.sizzlingSkills} onChange={set("sizzlingSkills")} rows={2} glow={!!form.sizzlingSkills}
                      placeholder="Test Management, End to End Testing, System Testing, Jira, Zephyr, HP ALM, SAFE, Scrum, Kanban, SQL, REST-services, KPI Analysis, Integration Testing, Acceptance Testing, Regression Testing" />
                  </Field>
                  <Field label="Sizzling Line 2" hint="AI generated — editable">
                    <TA value={form.sizzlingLine2} onChange={set("sizzlingLine2")} rows={3} glow={!!form.sizzlingLine2}
                      placeholder="Proficient in developing and analyzing KPIs and test coverage in projects, administering test cases in Jira, Zephyr, HP ALM and ReQTest, maintaining collaboration with vendors and Risk Management across large scale enterprise programs." />
                  </Field>
                  <Field label="Sizzling Line 3" hint="AI generated — editable">
                    <TA value={form.sizzlingLine3} onChange={set("sizzlingLine3")} rows={3} glow={!!form.sizzlingLine3}
                      placeholder="Demonstrated hands-on testing of SQL databases, ETL flows, REST-services and complex integration-heavy systems within Banking, Retail and Healthcare sectors." />
                  </Field>
                  <Field label="Additional Sizzling Bullets" hint="one per line — editable">
                    <TA value={form.sizzlingExtra} onChange={set("sizzlingExtra")} rows={4}
                      placeholder={"Fluent in English and Swedish both written and oral.\nAvailable immediately (Project ended).\nLives in Stockholm, Sweden and is flexible to be onsite 3 days a week."} />
                  </Field>
                </div>
              </Card>

              <Card title="Candidate Information Bullets" icon="ℹ️" delay={100}>
                <div style={{ marginBottom: 10 }}>
                  {/* Gender pronoun indicator */}
                  {(() => {
                    const g = (form.joinPrefix || "he").toLowerCase().trim();
                    const isShe = g === "she";
                    const isHe  = g === "he";
                    if (!isHe && !isShe) return null;
                    return (
                      <div style={{ padding: "6px 11px", background: isShe ? "rgba(236,72,153,0.08)" : "rgba(59,130,246,0.08)", border: `1px solid ${isShe ? "rgba(236,72,153,0.25)" : "rgba(59,130,246,0.2)"}`, borderRadius: 7, fontSize: 12, color: isShe ? "#f472b6" : "var(--accent2)", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{isShe ? "👩" : "👨"}</span>
                        <span>
                          {isShe
                            ? <>Female — pronouns: <strong>her</strong> · spouse bullet: <strong>husband</strong></>
                            : <>Male — pronouns: <strong>his</strong> · spouse bullet: <strong>wife</strong></>
                          }
                        </span>
                      </div>
                    );
                  })()}
                  {rateInfo.type === "hour" && (
                    <div style={{ padding: "6px 11px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 7, fontSize: 12, color: "var(--success)", marginBottom: 7 }}>
                      💼 Hourly rate → last bullet: <strong>"Has own Limited company to manage payroll."</strong>
                    </div>
                  )}
                  {rateInfo.type === "month" && (
                    <div style={{ padding: "6px 11px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 7, fontSize: 12, color: "var(--accent2)", marginBottom: 7 }}>
                      💰 Monthly rate → last bullet: <strong>"Willing to work under Avance payroll."</strong>
                    </div>
                  )}
                  {form.nationality && isEUNationality(form.nationality) === true && (
                    <div style={{ padding: "6px 11px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 7, fontSize: 12, color: "var(--success)", marginBottom: 7 }}>
                      🇪🇺 EU National — standard 4 bullets
                    </div>
                  )}
                  {form.nationality && isEUNationality(form.nationality) === false && (
                    <div style={{ padding: "6px 11px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 7, fontSize: 12, color: "#f59e0b", marginBottom: 7 }}>
                      🌍 Non-EU — work permit bullet {form.workAuthorization ? "inserted ✓" : "appears when Work Authorization is filled"}
                    </div>
                  )}
                  {form.candidateName && (
                    <div style={{ padding: "5px 11px", background: "rgba(59,130,246,0.08)", borderRadius: 7, fontSize: 12, color: "var(--accent2)", marginBottom: 7 }}>
                      👤 <strong>{form.candidateName}</strong> — reflected in first bullet
                    </div>
                  )}
                  {candInfoManual && (
                    <div style={{ padding: "5px 11px", background: "rgba(239,68,68,0.08)", borderRadius: 7, fontSize: 11.5, color: "#f87171", marginBottom: 7 }}>
                      ✏️ Manually edited — auto-updates paused. Reset to restore auto-mode.
                    </div>
                  )}
                </div>
                <TA value={form.candidateInfo} onChange={setCandInfo} rows={7} placeholder={buildCandidateInfo("Candidate Name", null, null, "", form.joinPrefix || "he")} />
              </Card>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <p style={{ color: "var(--text-muted)", fontSize: 12.5 }}>
                📌 Click <strong style={{ color: "var(--text)" }}>Copy Email</strong> then paste into Outlook or Gmail — the table renders correctly.
              </p>
              <button onClick={handleCopy} style={copied ? successBtn : primaryBtn}>
                {copied ? "✓ Copied!" : "📋 Copy Email (Outlook/Gmail ready)"}
              </button>
            </div>
            <EmailPreview form={form} />
          </div>
        )}
      </main>
    </div>
  );
}

function SpinEl({ size = 15 }) {
  return (
    <span style={{ width: size, height: size, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
  );
}

const _b = { border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, padding: "8px 18px", transition: "all .2s" };
const primaryBtn = { ..._b, background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", boxShadow: "0 2px 12px rgba(99,102,241,0.3)" };
const successBtn = { ..._b, background: "var(--success)", color: "#fff" };
const ghostBtn   = { ..._b, background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border)" };