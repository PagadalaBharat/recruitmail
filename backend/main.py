##################################### ------------------------- working code 

# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import httpx
# import os
# import json
# from dotenv import load_dotenv

# load_dotenv()

# app = FastAPI(title="Recruiter Email Generator API")

# # ── CORS ──────────────────────────────────────────────────────────────────────
# FRONTEND_URL = os.getenv("FRONTEND_URL", "")
# ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://localhost:5173",
#     "http://127.0.0.1:3000",
#     "http://127.0.0.1:5173",
# ]
# if FRONTEND_URL:
#     ALLOWED_ORIGINS.append(FRONTEND_URL)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=ALLOWED_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ── Groq config ───────────────────────────────────────────────────────────────
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
# GROQ_MODEL   = "llama-3.1-8b-instant"


# class GenerateSizzlingRequest(BaseModel):
#     cv_text: str
#     jd_text: str


# class SizzlingResponse(BaseModel):
#     candidate_name: str
#     top_sentences: list[str]
#     skills: list[str]


# # ── Groq call with full error handling ───────────────────────────────────────
# async def call_groq(prompt: str) -> str:
#     if not GROQ_API_KEY:
#         raise HTTPException(
#             status_code=500,
#             detail=(
#                 "GROQ_API_KEY is not set. "
#                 "Add it to your .env file: GROQ_API_KEY=gsk_..."
#             ),
#         )

#     headers = {
#         "Authorization": f"Bearer {GROQ_API_KEY}",
#         "Content-Type": "application/json",
#     }
#     payload = {
#         "model": GROQ_MODEL,
#         "messages": [{"role": "user", "content": prompt}],
#         "temperature": 0.3,
#         "max_tokens": 1024,
#     }

#     try:
#         async with httpx.AsyncClient(timeout=60.0) as client:
#             response = await client.post(
#                 GROQ_API_URL, headers=headers, json=payload
#             )

#             if response.status_code == 401:
#                 raise HTTPException(
#                     status_code=401,
#                     detail="Invalid GROQ_API_KEY. Check your .env file.",
#                 )
#             if response.status_code == 429:
#                 retry_after = response.headers.get("retry-after", "")
#                 wait = f"{retry_after} seconds" if retry_after else "20-30 seconds"
#                 raise HTTPException(
#                     status_code=429,
#                     detail=f"Groq rate limit reached. Please wait {wait} and try again.",
#                 )
#             if response.status_code == 413:
#                 raise HTTPException(
#                     status_code=413,
#                     detail="CV text is too large for Groq. Trim it and try again.",
#                 )
#             if response.status_code != 200:
#                 body = response.text[:300]
#                 raise HTTPException(
#                     status_code=response.status_code,
#                     detail=f"Groq API error ({response.status_code}): {body}",
#                 )

#             data = response.json()
#             content = data["choices"][0]["message"]["content"].strip()
#             if not content:
#                 raise HTTPException(
#                     status_code=500,
#                     detail="Groq returned an empty response. Please try again.",
#                 )
#             return content

#     except httpx.TimeoutException:
#         raise HTTPException(
#             status_code=504,
#             detail="Groq took too long to respond (>60s). Please try again.",
#         )
#     except httpx.ConnectError:
#         raise HTTPException(
#             status_code=503,
#             detail="Cannot reach Groq API. Check your internet connection.",
#         )
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"Unexpected error calling Groq: {str(e)}"
#         )


# # ── JSON parser (tolerant of markdown fences) ─────────────────────────────────
# def parse_json_response(raw: str) -> dict:
#     raw = raw.strip()

#     # Strip ```json ... ``` fences
#     if raw.startswith("```"):
#         parts = raw.split("```")
#         inner = parts[1]
#         if inner.lower().startswith("json"):
#             inner = inner[4:]
#         raw = inner.strip()

#     try:
#         return json.loads(raw)
#     except json.JSONDecodeError:
#         pass

#     # Fallback: find first { ... } block
#     s, e = raw.find("{"), raw.rfind("}") + 1
#     if s != -1 and e > s:
#         try:
#             return json.loads(raw[s:e])
#         except json.JSONDecodeError:
#             pass

#     raise HTTPException(
#         status_code=500,
#         detail=(
#             "AI returned an unexpected format. "
#             "Please try again — if it keeps failing, simplify the CV text."
#         ),
#     )


# # ── Main endpoint ─────────────────────────────────────────────────────────────
# @app.post("/api/generate-sizzling", response_model=SizzlingResponse)
# async def generate_sizzling(request: GenerateSizzlingRequest):
#     cv = request.cv_text.strip()
#     jd = request.jd_text.strip()

#     if not cv:
#         raise HTTPException(status_code=400, detail="CV text is required.")
#     if not jd:
#         raise HTTPException(status_code=400, detail="Job description text is required.")
#     if len(cv) > 40_000:
#         raise HTTPException(
#             status_code=413,
#             detail="CV text is too long (>40,000 chars). Please trim it.",
#         )
#     if len(jd) > 10_000:
#         raise HTTPException(
#             status_code=413,
#             detail="Job description is too long (>10,000 chars). Please trim it.",
#         )

#     prompt = f"""Act as a senior recruiter. You will receive a candidate CV and a Job Description (JD).
# Perform ALL tasks and return a single valid JSON object. No markdown, no extra text, JSON only.

# TASK 1 - Extract from CV:
# - candidate_name: The candidate's full name
# - designation: Their current or most recent job title/role (e.g., "Full Stack Developer", "Test Manager", "Data Engineer")
# - years_experience: Total years of professional experience (e.g., "4+", "10+", "15+")

# TASK 2 - top_sentences: Generate exactly 3 sentences matching CV to JD.

# SENTENCE 1 FORMAT (MANDATORY):
# "[Candidate Name] is a [Designation] with [X]+ years of experience in [key skills/domains from CV that match JD], with hands-on expertise in [specific tools/technologies from CV]."

# SENTENCE 2 FORMAT:
# Start with "Proficient in" or "Skilled in" — describe specific technical capabilities, tools, and methodologies from the CV that match JD requirements.

# SENTENCE 3 FORMAT:
# Start with "Demonstrated" or "Adept at" — describe accomplishments, domain experience, or measurable achievements from the CV relevant to JD.

# Rules for all sentences:
# - Each sentence MUST be 2-3 lines long with specific details.
# - Use ONLY information that EXISTS in the CV. Do not invent anything.
# - Focus on skills/experience matching the JD requirements.

# TASK 3 - skills: Extract exactly 15 skills from the CV most relevant to the JD.
# Rules:
# - ALL skills must exist in the CV. Do not invent any skill.
# - Prioritize skills mentioned in the JD.
# - Short phrases only (1-4 words each).

# Return ONLY this JSON:
# {{
#   "candidate_name": "Full Name",
#   "designation": "Job Title",
#   "years_experience": "X+",
#   "top_sentences": ["Sentence 1 starting with candidate name.", "Sentence 2 starting with Proficient/Skilled.", "Sentence 3 starting with Demonstrated/Adept."],
#   "skills": ["Skill 1","Skill 2","Skill 3","Skill 4","Skill 5","Skill 6","Skill 7","Skill 8","Skill 9","Skill 10","Skill 11","Skill 12","Skill 13","Skill 14","Skill 15"]
# }}

# CV:
# {cv}

# JD:
# {jd}

# JSON output:"""

#     try:
#         raw = await call_groq(prompt)
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#     parsed = parse_json_response(raw)

#     return SizzlingResponse(
#         candidate_name=str(parsed.get("candidate_name", "")).strip().strip('"'),
#         top_sentences=(parsed.get("top_sentences", []) or [])[:3],
#         skills=(parsed.get("skills", []) or [])[:15],
#     )


# # ── Health check ──────────────────────────────────────────────────────────────
# @app.get("/api/health")
# async def health():
#     return {
#         "status": "ok",
#         "groq_configured": bool(GROQ_API_KEY),
#         "model": GROQ_MODEL,
#     }



# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import httpx
# import os
# import json
# from dotenv import load_dotenv

# load_dotenv()

# app = FastAPI(title="Recruiter Email Generator API")

# # ── CORS ──────────────────────────────────────────────────────────────────────
# FRONTEND_URL = os.getenv("FRONTEND_URL", "")
# ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://localhost:5173",
#     "http://127.0.0.1:3000",
#     "http://127.0.0.1:5173",
# ]
# if FRONTEND_URL:
#     ALLOWED_ORIGINS.append(FRONTEND_URL)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=ALLOWED_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ── Groq config ───────────────────────────────────────────────────────────────
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
# GROQ_MODEL   = "llama-3.1-8b-instant"


# class GenerateSizzlingRequest(BaseModel):
#     cv_text: str
#     jd_text: str


# class SizzlingResponse(BaseModel):
#     candidate_name: str
#     top_sentences: list[str]
#     skills: list[str]


# # ── Groq call with full error handling ───────────────────────────────────────
# async def call_groq(prompt: str) -> str:
#     if not GROQ_API_KEY:
#         raise HTTPException(
#             status_code=500,
#             detail=(
#                 "GROQ_API_KEY is not set. "
#                 "Add it to your .env file: GROQ_API_KEY=gsk_..."
#             ),
#         )

#     headers = {
#         "Authorization": f"Bearer {GROQ_API_KEY}",
#         "Content-Type": "application/json",
#     }
#     payload = {
#         "model": GROQ_MODEL,
#         "messages": [{"role": "user", "content": prompt}],
#         "temperature": 0.3,
#         "max_tokens": 1024,
#     }

#     try:
#         async with httpx.AsyncClient(timeout=60.0) as client:
#             response = await client.post(
#                 GROQ_API_URL, headers=headers, json=payload
#             )

#             if response.status_code == 401:
#                 raise HTTPException(
#                     status_code=401,
#                     detail="Invalid GROQ_API_KEY. Check your .env file.",
#                 )
#             if response.status_code == 429:
#                 retry_after = response.headers.get("retry-after", "")
#                 wait = f"{retry_after} seconds" if retry_after else "20-30 seconds"
#                 raise HTTPException(
#                     status_code=429,
#                     detail=f"Groq rate limit reached. Please wait {wait} and try again.",
#                 )
#             if response.status_code == 413:
#                 raise HTTPException(
#                     status_code=413,
#                     detail="CV text is too large for Groq. Trim it and try again.",
#                 )
#             if response.status_code != 200:
#                 body = response.text[:300]
#                 raise HTTPException(
#                     status_code=response.status_code,
#                     detail=f"Groq API error ({response.status_code}): {body}",
#                 )

#             data = response.json()
#             content = data["choices"][0]["message"]["content"].strip()
#             if not content:
#                 raise HTTPException(
#                     status_code=500,
#                     detail="Groq returned an empty response. Please try again.",
#                 )
#             return content

#     except httpx.TimeoutException:
#         raise HTTPException(
#             status_code=504,
#             detail="Groq took too long to respond (>60s). Please try again.",
#         )
#     except httpx.ConnectError:
#         raise HTTPException(
#             status_code=503,
#             detail="Cannot reach Groq API. Check your internet connection.",
#         )
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"Unexpected error calling Groq: {str(e)}"
#         )


# # ── JSON parser (tolerant of markdown fences) ─────────────────────────────────
# def parse_json_response(raw: str) -> dict:
#     raw = raw.strip()

#     # Strip ```json ... ``` fences
#     if raw.startswith("```"):
#         parts = raw.split("```")
#         inner = parts[1]
#         if inner.lower().startswith("json"):
#             inner = inner[4:]
#         raw = inner.strip()

#     try:
#         return json.loads(raw)
#     except json.JSONDecodeError:
#         pass

#     # Fallback: find first { ... } block
#     s, e = raw.find("{"), raw.rfind("}") + 1
#     if s != -1 and e > s:
#         try:
#             return json.loads(raw[s:e])
#         except json.JSONDecodeError:
#             pass

#     raise HTTPException(
#         status_code=500,
#         detail=(
#             "AI returned an unexpected format. "
#             "Please try again — if it keeps failing, simplify the CV text."
#         ),
#     )


# # ── Main endpoint ─────────────────────────────────────────────────────────────
# @app.post("/api/generate-sizzling", response_model=SizzlingResponse)
# async def generate_sizzling(request: GenerateSizzlingRequest):
#     cv = request.cv_text.strip()
#     jd = request.jd_text.strip()

#     if not cv:
#         raise HTTPException(status_code=400, detail="CV text is required.")
#     if not jd:
#         raise HTTPException(status_code=400, detail="Job description text is required.")
#     if len(cv) > 40_000:
#         raise HTTPException(
#             status_code=413,
#             detail="CV text is too long (>40,000 chars). Please trim it.",
#         )
#     if len(jd) > 10_000:
#         raise HTTPException(
#             status_code=413,
#             detail="Job description is too long (>10,000 chars). Please trim it.",
#         )

#     prompt = f"""Act as a senior recruiter. You will receive a candidate CV and a Job Description (JD).
# Perform ALL tasks and return a single valid JSON object. No markdown, no extra text, JSON only.

# TASK 1 - Extract from CV:
# - candidate_name: The candidate's full name
# - designation: Their current or most recent job title/role (e.g., "Full Stack Developer", "Test Manager", "Data Engineer")
# - years_experience: Total years of professional experience (e.g., "4+", "10+", "15+")

# TASK 2 - top_sentences: Generate exactly 3 sentences matching CV to JD.

# SENTENCE 1 FORMAT (MANDATORY):
# "[Candidate Name] is a [Designation] with [X]+ years of experience in [key skills/domains from CV that match JD], with hands-on expertise in [specific tools/technologies from CV]."

# SENTENCE 2 FORMAT:
# Start with "Proficient in" or "Skilled in" — describe specific technical capabilities, tools, and methodologies from the CV that match JD requirements.

# SENTENCE 3 FORMAT:
# Start with "Demonstrated" or "Adept at" — describe accomplishments, domain experience, or measurable achievements from the CV relevant to JD.

# Rules for all sentences:
# - Each sentence MUST be 2-3 lines long with specific details.
# - Use ONLY information that EXISTS in the CV. Do not invent anything.
# - Focus on skills/experience matching the JD requirements.

# TASK 3 - skills: Extract exactly 15 skills from the CV most relevant to the JD.
# Rules:
# - ALL skills must exist in the CV. Do not invent any skill.
# - Prioritize skills mentioned in the JD.
# - Short phrases only (1-4 words each).

# Return ONLY this JSON:
# {{
#   "candidate_name": "Full Name",
#   "designation": "Job Title",
#   "years_experience": "X+",
#   "top_sentences": ["Sentence 1 starting with candidate name.", "Sentence 2 starting with Proficient/Skilled.", "Sentence 3 starting with Demonstrated/Adept."],
#   "skills": ["Skill 1","Skill 2","Skill 3","Skill 4","Skill 5","Skill 6","Skill 7","Skill 8","Skill 9","Skill 10","Skill 11","Skill 12","Skill 13","Skill 14","Skill 15"]
# }}

# CV:
# {cv}

# JD:
# {jd}

# JSON output:"""

#     try:
#         raw = await call_groq(prompt)
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#     parsed = parse_json_response(raw)

#     return SizzlingResponse(
#         candidate_name=str(parsed.get("candidate_name", "")).strip().strip('"'),
#         top_sentences=(parsed.get("top_sentences", []) or [])[:3],
#         skills=(parsed.get("skills", []) or [])[:15],
#     )


# # ── Health check ──────────────────────────────────────────────────────────────
# @app.get("/api/health")
# async def health():
#     return {
#         "status": "ok",
#         "groq_configured": bool(GROQ_API_KEY),
#         "model": GROQ_MODEL,
#     }

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Recruiter Email Generator API")

# ── CORS ──────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Groq config ───────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.1-8b-instant"


class GenerateSizzlingRequest(BaseModel):
    cv_text: str
    jd_text: str


class SizzlingResponse(BaseModel):
    candidate_name: str
    top_sentences: list[str]
    skills: list[str]


# ── CV skill presence checker (Python-side safety net) ────────────────────────
def skill_exists_in_cv(skill: str, cv_text: str) -> bool:
    """
    Returns True if every meaningful word in the skill phrase appears in the CV.
    Case-insensitive. Ignores small stop words (and, &, /, etc.).
    """
    STOP = {"and", "&", "/", "the", "with", "for", "in", "of", "a", "an"}
    cv_lower = cv_text.lower()
    words = [w.strip(".,()[]") for w in skill.lower().split() if w.strip(".,()[]") not in STOP]
    return all(word in cv_lower for word in words if word)


def filter_skills_to_cv(skills: list[str], cv_text: str) -> list[str]:
    """Remove any skill that cannot be verified against the CV text."""
    return [s for s in skills if skill_exists_in_cv(s, cv_text)]


# ── Groq call with full error handling ───────────────────────────────────────
async def call_groq(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail=(
                "GROQ_API_KEY is not set. "
                "Add it to your .env file: GROQ_API_KEY=gsk_..."
            ),
        )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,   # lowered from 0.3 → less creative = less hallucination
        "max_tokens": 1024,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                GROQ_API_URL, headers=headers, json=payload
            )

            if response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid GROQ_API_KEY. Check your .env file.")
            if response.status_code == 429:
                retry_after = response.headers.get("retry-after", "")
                wait = f"{retry_after} seconds" if retry_after else "20-30 seconds"
                raise HTTPException(status_code=429, detail=f"Groq rate limit reached. Please wait {wait} and try again.")
            if response.status_code == 413:
                raise HTTPException(status_code=413, detail="CV text is too large for Groq. Trim it and try again.")
            if response.status_code != 200:
                body = response.text[:300]
                raise HTTPException(status_code=response.status_code, detail=f"Groq API error ({response.status_code}): {body}")

            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()
            if not content:
                raise HTTPException(status_code=500, detail="Groq returned an empty response. Please try again.")
            return content

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Groq took too long to respond (>60s). Please try again.")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Cannot reach Groq API. Check your internet connection.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error calling Groq: {str(e)}")


# ── JSON parser (tolerant of markdown fences) ─────────────────────────────────
def parse_json_response(raw: str) -> dict:
    raw = raw.strip()

    if raw.startswith("```"):
        parts = raw.split("```")
        inner = parts[1]
        if inner.lower().startswith("json"):
            inner = inner[4:]
        raw = inner.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    s, e = raw.find("{"), raw.rfind("}") + 1
    if s != -1 and e > s:
        try:
            return json.loads(raw[s:e])
        except json.JSONDecodeError:
            pass

    raise HTTPException(
        status_code=500,
        detail="AI returned an unexpected format. Please try again — if it keeps failing, simplify the CV text.",
    )


# ── Prompt builder (separated for clarity) ────────────────────────────────────
def build_prompt(cv: str, jd: str) -> str:
    return f"""You are a senior technical recruiter. You will be given a CV and a Job Description (JD).

YOUR ONLY SOURCE OF TRUTH IS THE CV TEXT BELOW. You must not use any knowledge, assumptions, or information outside of it.

═══════════════════════════════════════════════════════
ANTI-HALLUCINATION RULES — READ BEFORE DOING ANYTHING
═══════════════════════════════════════════════════════
1. SKILLS: Every single skill you list MUST be a word or phrase that literally appears in the CV text.
   - Before adding any skill, ask yourself: "Can I find this exact word or phrase in the CV?"
   - If you CANNOT find it word-for-word in the CV → DO NOT include it.
   - Example of VIOLATION: CV has "Redux" but NOT "Zustand" → you may list Redux, you may NOT list Zustand.
   - Example of VIOLATION: CV has "Docker" and "Kubernetes" → you may list both. CV does NOT have "Terraform" → do NOT list it.
   - Do NOT infer, assume, or guess any skill. Only copy skills you can see in the CV.

2. SENTENCES: Every fact, tool, technology, or achievement mentioned in your 3 sentences MUST be directly stated in the CV.
   - Do NOT combine skills from the JD with the candidate's name unless the CV also mentions that skill.
   - Do NOT write "experience with X" unless X is written in the CV.

3. VERIFICATION STEP (do this mentally before outputting):
   For each skill in your list, locate the exact word in the CV. If you cannot locate it → remove it.
   For each claim in your sentences, locate the supporting evidence in the CV. If you cannot → rewrite without it.

═══════════════════════════════════════════════════════
TASK 1 — EXTRACT FROM CV (copy exactly as written)
═══════════════════════════════════════════════════════
- candidate_name: The candidate's full name
- designation: Their current or most recent job title/role
- years_experience: Total years of professional experience (e.g., "4+", "10+")

═══════════════════════════════════════════════════════
TASK 2 — 3 SIZZLING SENTENCES (CV facts only)
═══════════════════════════════════════════════════════
SENTENCE 1 — Must start with candidate's name:
"[Name] is a [designation from CV] with [X]+ years of experience in [domains from CV matching JD], with hands-on expertise in [specific tools from CV]."

SENTENCE 2 — Must start with "Proficient in" or "experienced in":
Describe specific technical capabilities, tools, and methodologies FROM THE CV that match the JD.

SENTENCE 3 — Must start with "Demonstrated" or "Adept at":
Describe accomplishments or domain experience FROM THE CV relevant to the JD.

Rules:
- Each sentence must be 2–3 lines with specific details.
- Every tool, technology, and achievement must exist in the CV text. No exceptions.

═══════════════════════════════════════════════════════
TASK 3 — EXACTLY 15 SKILLS (from CV only)
═══════════════════════════════════════════════════════
- Extract exactly 15 skills. Each skill must be a word or phrase that literally appears in the CV.
- Prioritize skills that also appear in the JD, but ONLY if they are in the CV.
- If fewer than 15 verifiable skills exist in the CV that match the JD, pad with other skills from the CV.
- Short phrases only (1–4 words each).
- DO NOT invent, infer, or guess. Copy from CV only.

═══════════════════════════════════════════════════════
OUTPUT FORMAT — JSON only, no markdown, no extra text
═══════════════════════════════════════════════════════
{{
  "candidate_name": "Full Name",
  "designation": "Job Title",
  "years_experience": "X+",
  "top_sentences": [
    "Sentence 1 starting with candidate name.",
    "Sentence 2 starting with Proficient/Skilled.",
    "Sentence 3 starting with Demonstrated/Adept."
  ],
  "skills": ["Skill 1","Skill 2","Skill 3","Skill 4","Skill 5","Skill 6","Skill 7","Skill 8","Skill 9","Skill 10","Skill 11","Skill 12","Skill 13","Skill 14","Skill 15"]
}}

═══════════════════════════════════════════════════════
CV (your ONLY source — do not use anything outside this)
═══════════════════════════════════════════════════════
{cv}

═══════════════════════════════════════════════════════
JD (use only to decide PRIORITY of skills — not as a source of skills)
═══════════════════════════════════════════════════════
{jd}

JSON output:"""


# ── Main endpoint ─────────────────────────────────────────────────────────────
@app.post("/api/generate-sizzling", response_model=SizzlingResponse)
async def generate_sizzling(request: GenerateSizzlingRequest):
    cv = request.cv_text.strip()
    jd = request.jd_text.strip()

    if not cv:
        raise HTTPException(status_code=400, detail="CV text is required.")
    if not jd:
        raise HTTPException(status_code=400, detail="Job description text is required.")
    if len(cv) > 40_000:
        raise HTTPException(status_code=413, detail="CV text is too long (>40,000 chars). Please trim it.")
    if len(jd) > 10_000:
        raise HTTPException(status_code=413, detail="Job description is too long (>10,000 chars). Please trim it.")

    prompt = build_prompt(cv, jd)

    try:
        raw = await call_groq(prompt)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    parsed = parse_json_response(raw)

    # ── AI output ─────────────────────────────────────────────────────────────
    raw_skills: list[str] = (parsed.get("skills", []) or [])[:15]

    # ── Python-side safety net: strip any skill not verifiable in CV ──────────
    verified_skills = filter_skills_to_cv(raw_skills, cv)

    # Log dropped skills for debugging (visible in uvicorn console)
    dropped = [s for s in raw_skills if s not in verified_skills]
    if dropped:
        print(f"[SKILL FILTER] Dropped hallucinated skills: {dropped}")

    return SizzlingResponse(
        candidate_name=str(parsed.get("candidate_name", "")).strip().strip('"'),
        top_sentences=(parsed.get("top_sentences", []) or [])[:3],
        skills=verified_skills,
    )


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "groq_configured": bool(GROQ_API_KEY),
        "model": GROQ_MODEL,
    }