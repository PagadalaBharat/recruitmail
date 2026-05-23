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
############################################################################## Main working code 
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import httpx
# import os
# import json
# import re
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


# # ── CV skill presence checker (Python-side safety net) ────────────────────────
# def skill_exists_in_cv(skill: str, cv_text: str) -> bool:
#     """
#     Returns True if every meaningful word in the skill phrase appears in the CV.
#     Case-insensitive. Ignores small stop words (and, &, /, etc.).
#     """
#     STOP = {"and", "&", "/", "the", "with", "for", "in", "of", "a", "an"}
#     cv_lower = cv_text.lower()
#     words = [w.strip(".,()[]") for w in skill.lower().split() if w.strip(".,()[]") not in STOP]
#     return all(word in cv_lower for word in words if word)


# def filter_skills_to_cv(skills: list[str], cv_text: str) -> list[str]:
#     """Remove any skill that cannot be verified against the CV text."""
#     return [s for s in skills if skill_exists_in_cv(s, cv_text)]


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
#         "temperature": 0.1,   # lowered from 0.3 → less creative = less hallucination
#         "max_tokens": 1024,
#     }

#     try:
#         async with httpx.AsyncClient(timeout=60.0) as client:
#             response = await client.post(
#                 GROQ_API_URL, headers=headers, json=payload
#             )

#             if response.status_code == 401:
#                 raise HTTPException(status_code=401, detail="Invalid GROQ_API_KEY. Check your .env file.")
#             if response.status_code == 429:
#                 retry_after = response.headers.get("retry-after", "")
#                 wait = f"{retry_after} seconds" if retry_after else "20-30 seconds"
#                 raise HTTPException(status_code=429, detail=f"Groq rate limit reached. Please wait {wait} and try again.")
#             if response.status_code == 413:
#                 raise HTTPException(status_code=413, detail="CV text is too large for Groq. Trim it and try again.")
#             if response.status_code != 200:
#                 body = response.text[:300]
#                 raise HTTPException(status_code=response.status_code, detail=f"Groq API error ({response.status_code}): {body}")

#             data = response.json()
#             content = data["choices"][0]["message"]["content"].strip()
#             if not content:
#                 raise HTTPException(status_code=500, detail="Groq returned an empty response. Please try again.")
#             return content

#     except httpx.TimeoutException:
#         raise HTTPException(status_code=504, detail="Groq took too long to respond (>60s). Please try again.")
#     except httpx.ConnectError:
#         raise HTTPException(status_code=503, detail="Cannot reach Groq API. Check your internet connection.")
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Unexpected error calling Groq: {str(e)}")


# # ── JSON parser (tolerant of markdown fences) ─────────────────────────────────
# def parse_json_response(raw: str) -> dict:
#     raw = raw.strip()

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

#     s, e = raw.find("{"), raw.rfind("}") + 1
#     if s != -1 and e > s:
#         try:
#             return json.loads(raw[s:e])
#         except json.JSONDecodeError:
#             pass

#     raise HTTPException(
#         status_code=500,
#         detail="AI returned an unexpected format. Please try again — if it keeps failing, simplify the CV text.",
#     )


# # ── Prompt builder (separated for clarity) ────────────────────────────────────
# def build_prompt(cv: str, jd: str) -> str:
#     return f"""You are a senior technical recruiter. You will be given a CV and a Job Description (JD).

# YOUR ONLY SOURCE OF TRUTH IS THE CV TEXT BELOW. You must not use any knowledge, assumptions, or information outside of it.

# ═══════════════════════════════════════════════════════
# ANTI-HALLUCINATION RULES — READ BEFORE DOING ANYTHING
# ═══════════════════════════════════════════════════════
# 1. SKILLS: Every single skill you list MUST be a word or phrase that literally appears in the CV text.
#    - Before adding any skill, ask yourself: "Can I find this exact word or phrase in the CV?"
#    - If you CANNOT find it word-for-word in the CV → DO NOT include it.
#    - Example of VIOLATION: CV has "Redux" but NOT "Zustand" → you may list Redux, you may NOT list Zustand.
#    - Example of VIOLATION: CV has "Docker" and "Kubernetes" → you may list both. CV does NOT have "Terraform" → do NOT list it.
#    - Do NOT infer, assume, or guess any skill. Only copy skills you can see in the CV.

# 2. SENTENCES: Every fact, tool, technology, or achievement mentioned in your 3 sentences MUST be directly stated in the CV.
#    - Do NOT combine skills from the JD with the candidate's name unless the CV also mentions that skill.
#    - Do NOT write "experience with X" unless X is written in the CV.

# 3. VERIFICATION STEP (do this mentally before outputting):
#    For each skill in your list, locate the exact word in the CV. If you cannot locate it → remove it.
#    For each claim in your sentences, locate the supporting evidence in the CV. If you cannot → rewrite without it.

# ═══════════════════════════════════════════════════════
# TASK 1 — EXTRACT FROM CV (copy exactly as written)
# ═══════════════════════════════════════════════════════
# - candidate_name: The candidate's full name
# - designation: Their current or most recent job title/role
# - years_experience: Total years of professional experience (e.g., "4+", "10+")

# ═══════════════════════════════════════════════════════
# TASK 2 — 3 SIZZLING SENTENCES (CV facts only)
# ═══════════════════════════════════════════════════════
# SENTENCE 1 — Must start with candidate's name:
# "[Name] is a [designation from CV] with [X]+ years of experience in [domains from CV matching JD], with hands-on expertise in [specific tools from CV]."

# SENTENCE 2 — Must start with "Proficient in" or "experienced in":
# Describe specific technical capabilities, tools, and methodologies FROM THE CV that match the JD.

# SENTENCE 3 — Must start with "Demonstrated" or "Adept at":
# Describe accomplishments or domain experience FROM THE CV relevant to the JD.

# Rules:
# - Each sentence must be 2–3 lines with specific details.
# - Every tool, technology, and achievement must exist in the CV text. No exceptions.

# ═══════════════════════════════════════════════════════
# TASK 3 — EXACTLY 15 SKILLS (from CV only)
# ═══════════════════════════════════════════════════════
# - Extract exactly 15 skills. Each skill must be a word or phrase that literally appears in the CV.
# - Prioritize skills that also appear in the JD, but ONLY if they are in the CV.
# - If fewer than 15 verifiable skills exist in the CV that match the JD, pad with other skills from the CV.
# - Short phrases only (1–4 words each).
# - DO NOT invent, infer, or guess. Copy from CV only.

# ═══════════════════════════════════════════════════════
# OUTPUT FORMAT — JSON only, no markdown, no extra text
# ═══════════════════════════════════════════════════════
# {{
#   "candidate_name": "Full Name",
#   "designation": "Job Title",
#   "years_experience": "X+",
#   "top_sentences": [
#     "Sentence 1 starting with candidate name.",
#     "Sentence 2 starting with Proficient/Skilled.",
#     "Sentence 3 starting with Demonstrated/Adept."
#   ],
#   "skills": ["Skill 1","Skill 2","Skill 3","Skill 4","Skill 5","Skill 6","Skill 7","Skill 8","Skill 9","Skill 10","Skill 11","Skill 12","Skill 13","Skill 14","Skill 15"]
# }}

# ═══════════════════════════════════════════════════════
# CV (your ONLY source — do not use anything outside this)
# ═══════════════════════════════════════════════════════
# {cv}

# ═══════════════════════════════════════════════════════
# JD (use only to decide PRIORITY of skills — not as a source of skills)
# ═══════════════════════════════════════════════════════
# {jd}

# JSON output:"""


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
#         raise HTTPException(status_code=413, detail="CV text is too long (>40,000 chars). Please trim it.")
#     if len(jd) > 10_000:
#         raise HTTPException(status_code=413, detail="Job description is too long (>10,000 chars). Please trim it.")

#     prompt = build_prompt(cv, jd)

#     try:
#         raw = await call_groq(prompt)
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#     parsed = parse_json_response(raw)

#     # ── AI output ─────────────────────────────────────────────────────────────
#     raw_skills: list[str] = (parsed.get("skills", []) or [])[:15]

#     # ── Python-side safety net: strip any skill not verifiable in CV ──────────
#     verified_skills = filter_skills_to_cv(raw_skills, cv)

#     # Log dropped skills for debugging (visible in uvicorn console)
#     dropped = [s for s in raw_skills if s not in verified_skills]
#     if dropped:
#         print(f"[SKILL FILTER] Dropped hallucinated skills: {dropped}")

#     return SizzlingResponse(
#         candidate_name=str(parsed.get("candidate_name", "")).strip().strip('"'),
#         top_sentences=(parsed.get("top_sentences", []) or [])[:3],
#         skills=verified_skills,
#     )


# # ── Health check ──────────────────────────────────────────────────────────────
# @app.get("/api/health")
# async def health():
#     return {
#         "status": "ok",
#         "groq_configured": bool(GROQ_API_KEY),
#         "model": GROQ_MODEL,
#     }


######################################################################## skill matrix working code

# from fastapi import FastAPI, HTTPException, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import FileResponse
# from pydantic import BaseModel
# import httpx
# import os
# import json
# import re
# import tempfile
# import shutil
# import pdfplumber
# from pathlib import Path
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

# GROQ_API_KEY    = os.getenv("GROQ_API_KEY", "").strip()
# GROQ_SM_API_KEY = os.getenv("GROQ_SM_API_KEY", "").strip()
# GROQ_API_URL    = "https://api.groq.com/openai/v1/chat/completions"
# GROQ_MODEL      = "llama-3.3-70b-versatile"   # better JSON compliance than 8b

# # If SM key is missing/blank, fall back to the main key automatically
# def get_sm_key() -> str:
#     key = GROQ_SM_API_KEY or GROQ_API_KEY
#     if not key:
#         raise HTTPException(status_code=500, detail="No Groq API key configured. Check your .env file.")
#     return key

# print(f"[STARTUP] GROQ_API_KEY set: {bool(GROQ_API_KEY)}")
# print(f"[STARTUP] GROQ_SM_API_KEY set: {bool(GROQ_SM_API_KEY)}")
# print(f"[STARTUP] SM will use key: {'GROQ_SM_API_KEY' if GROQ_SM_API_KEY else 'GROQ_API_KEY (fallback)'}")


# # ═══════════════════════════════════════════════════════════════════════════════
# # SHARED MODELS
# # ═══════════════════════════════════════════════════════════════════════════════

# class GenerateSizzlingRequest(BaseModel):
#     cv_text: str
#     jd_text: str

# class SizzlingResponse(BaseModel):
#     candidate_name: str
#     top_sentences: list[str]
#     skills: list[str]


# # ═══════════════════════════════════════════════════════════════════════════════
# # SKILL FILTER
# # ═══════════════════════════════════════════════════════════════════════════════

# def skill_exists_in_cv(skill: str, cv_text: str) -> bool:
#     STOP = {"and", "&", "/", "the", "with", "for", "in", "of", "a", "an"}
#     cv_lower = cv_text.lower()
#     words = [w.strip(".,()[]") for w in skill.lower().split()
#              if w.strip(".,()[]") not in STOP]
#     return all(word in cv_lower for word in words if word)

# def filter_skills_to_cv(skills: list[str], cv_text: str) -> list[str]:
#     return [s for s in skills if skill_exists_in_cv(s, cv_text)]


# # ═══════════════════════════════════════════════════════════════════════════════
# # GROQ CALLER  — logs everything, raises clear errors
# # ═══════════════════════════════════════════════════════════════════════════════

# async def call_groq(prompt: str, api_key: str, label: str = "groq") -> str:
#     if not api_key:
#         raise HTTPException(status_code=500, detail="API key is not configured. Check your .env file.")

#     print(f"[{label}] Sending {len(prompt)} chars to Groq model={GROQ_MODEL}")

#     headers = {
#         "Authorization": f"Bearer {api_key}",
#         "Content-Type": "application/json",
#     }
#     payload = {
#         "model": GROQ_MODEL,
#         "messages": [{"role": "user", "content": prompt}],
#         "temperature": 0.1,
#         "max_tokens": 4096,
#     }
#     try:
#         async with httpx.AsyncClient(timeout=120.0) as client:
#             response = await client.post(GROQ_API_URL, headers=headers, json=payload)

#         print(f"[{label}] Groq HTTP status: {response.status_code}")

#         if response.status_code == 401:
#             raise HTTPException(status_code=401,
#                 detail="Invalid Groq API key. Check your .env file.")
#         if response.status_code == 429:
#             retry_after = response.headers.get("retry-after", "")
#             wait = f"{retry_after}s" if retry_after else "20-30s"
#             raise HTTPException(status_code=429,
#                 detail=f"Groq rate limit. Wait {wait} and try again.")
#         if response.status_code == 413:
#             raise HTTPException(status_code=413,
#                 detail="Input too large for Groq. Please use a shorter CV.")
#         if response.status_code != 200:
#             body = response.text[:400]
#             print(f"[{label}] Groq error body: {body}")
#             raise HTTPException(status_code=response.status_code,
#                 detail=f"Groq API error ({response.status_code}): {body}")

#         data = response.json()
#         content = data["choices"][0]["message"]["content"].strip()
#         print(f"[{label}] Groq returned {len(content)} chars")
#         if not content:
#             raise HTTPException(status_code=500, detail="Groq returned an empty response.")
#         return content

#     except httpx.TimeoutException:
#         raise HTTPException(status_code=504, detail="Groq timed out (>120s). Try again.")
#     except httpx.ConnectError:
#         raise HTTPException(status_code=503, detail="Cannot reach Groq API. Check internet connection.")
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"[{label}] Unexpected error: {e}")
#         raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# # ═══════════════════════════════════════════════════════════════════════════════
# # JSON PARSER  — tolerant, with detailed logging
# # ═══════════════════════════════════════════════════════════════════════════════

# def parse_json_response(raw: str) -> dict:
#     raw = raw.strip()
#     # Strip markdown fences
#     raw = re.sub(r"^```(?:json)?\s*", "", raw)
#     raw = re.sub(r"\s*```$", "", raw)
#     raw = raw.strip()
#     try:
#         return json.loads(raw)
#     except json.JSONDecodeError:
#         pass
#     s, e = raw.find("{"), raw.rfind("}") + 1
#     if s != -1 and e > s:
#         try:
#             return json.loads(raw[s:e])
#         except json.JSONDecodeError:
#             pass
#     raise HTTPException(status_code=500, detail="AI returned an unexpected format. Please try again.")


# def parse_json_array(raw: str, label: str = "sm") -> list:
#     """
#     Parse a JSON array from Groq response.
#     Handles: markdown fences, leading text, truncated arrays, trailing commas.
#     """
#     original = raw
#     raw = raw.strip()

#     # ── Strip markdown fences ─────────────────────────────────────────────────
#     raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
#     raw = re.sub(r"\s*```\s*$", "", raw)
#     raw = raw.strip()

#     # ── Attempt 1: direct parse ───────────────────────────────────────────────
#     try:
#         result = json.loads(raw)
#         if isinstance(result, list):
#             print(f"[{label}] Parsed directly: {len(result)} items")
#             return result
#     except json.JSONDecodeError:
#         pass

#     # ── Attempt 2: find outermost [ ... ] ────────────────────────────────────
#     start = raw.find("[")
#     if start != -1:
#         # Walk backwards from end to find matching ]
#         end = raw.rfind("]")
#         if end > start:
#             candidate = raw[start:end + 1]
#             try:
#                 result = json.loads(candidate)
#                 if isinstance(result, list):
#                     print(f"[{label}] Parsed via bracket extraction: {len(result)} items")
#                     return result
#             except json.JSONDecodeError:
#                 pass

#         # ── Attempt 3: repair truncated JSON ─────────────────────────────────
#         # The array may be cut off mid-object; extract complete objects manually
#         array_text = raw[start:]
#         items = []
#         depth = 0
#         obj_start = None

#         for i, ch in enumerate(array_text):
#             if ch == "{":
#                 if depth == 0:
#                     obj_start = i
#                 depth += 1
#             elif ch == "}":
#                 depth -= 1
#                 if depth == 0 and obj_start is not None:
#                     obj_str = array_text[obj_start:i + 1]
#                     # Fix trailing commas inside objects
#                     obj_str = re.sub(r",\s*([}\]])", r"\1", obj_str)
#                     try:
#                         obj = json.loads(obj_str)
#                         if isinstance(obj, dict) and "requirement" in obj:
#                             items.append(obj)
#                     except json.JSONDecodeError:
#                         pass
#                     obj_start = None

#         if items:
#             print(f"[{label}] Repaired truncated array: {len(items)} items extracted")
#             return items

#     # ── Log and raise ─────────────────────────────────────────────────────────
#     print(f"[{label}] ALL PARSE ATTEMPTS FAILED")
#     print(f"[{label}] Full response ({len(original)} chars):\n{original[:2000]}")
#     raise HTTPException(
#         status_code=500,
#         detail=(
#             "AI returned an unexpected format for the skill matrix. "
#             f"Response started with: {original[:150]!r}"
#         )
#     )


# # ═══════════════════════════════════════════════════════════════════════════════
# # SIZZLING PROMPT & ENDPOINT
# # ═══════════════════════════════════════════════════════════════════════════════

# def build_sizzling_prompt(cv: str, jd: str) -> str:
#     return f"""You are a senior technical recruiter. Analyze the CV and Job Description below.

# RULES:
# - Every skill you list MUST appear word-for-word in the CV.
# - Every sentence fact MUST come directly from the CV.
# - Do NOT invent, infer, or assume anything.

# TASK 1 - Extract: candidate_name, designation, years_experience
# TASK 2 - Write 3 sizzling sentences (CV facts only):
#   S1: Start with name. "[Name] is a [title] with [X]+ years in [domain]..."
#   S2: Start with "Proficient in" or "Skilled in"
#   S3: Start with "Demonstrated" or "Adept at"
# TASK 3 - List EXACTLY 15 skills that appear literally in the CV text.

# Return ONLY this JSON (no markdown):
# {{
#   "candidate_name": "Full Name",
#   "designation": "Job Title",
#   "years_experience": "X+",
#   "top_sentences": ["S1", "S2", "S3"],
#   "skills": ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13","s14","s15"]
# }}

# CV:
# {cv}

# JD:
# {jd}

# JSON:"""


# @app.post("/api/generate-sizzling", response_model=SizzlingResponse)
# async def generate_sizzling(request: GenerateSizzlingRequest):
#     cv = request.cv_text.strip()
#     jd = request.jd_text.strip()
#     if not cv:
#         raise HTTPException(status_code=400, detail="CV text is required.")
#     if not jd:
#         raise HTTPException(status_code=400, detail="Job description text is required.")
#     if len(cv) > 40_000:
#         raise HTTPException(status_code=413, detail="CV text too long (>40,000 chars).")
#     if len(jd) > 10_000:
#         raise HTTPException(status_code=413, detail="Job description too long (>10,000 chars).")

#     raw = await call_groq(build_sizzling_prompt(cv, jd), GROQ_API_KEY, label="sizzling")
#     parsed = parse_json_response(raw)

#     raw_skills: list[str] = (parsed.get("skills", []) or [])[:15]
#     verified_skills = filter_skills_to_cv(raw_skills, cv)
#     dropped = [s for s in raw_skills if s not in verified_skills]
#     if dropped:
#         print(f"[SKILL FILTER] Dropped: {dropped}")

#     return SizzlingResponse(
#         candidate_name=str(parsed.get("candidate_name", "")).strip().strip('"'),
#         top_sentences=(parsed.get("top_sentences", []) or [])[:3],
#         skills=verified_skills,
#     )


# # ═══════════════════════════════════════════════════════════════════════════════
# # FILE TEXT EXTRACTION  (.docx / .doc / .pdf / .txt)
# # ═══════════════════════════════════════════════════════════════════════════════

# def _read_docx(path: str) -> str:
#     """Read a true .docx file — paragraphs + table cells."""
#     from docx import Document as D
#     doc = D(path)
#     parts = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
#     for table in doc.tables:
#         for row in table.rows:
#             for cell in row.cells:
#                 t = cell.text.strip()
#                 if t and t not in parts:
#                     parts.append(t)
#     return "\n".join(parts)


# def _read_doc_binary(path: str) -> str:
#     """
#     Read an old binary .doc (OLE compound) file.
#     Tries 3 strategies in order:
#       1. python-docx  (handles .doc files that are actually .docx renamed)
#       2. olefile      (true OLE binary stream extraction)
#       3. Byte scan    (ASCII printable run extraction — last resort)
#     """
#     # Strategy 1 — maybe it's just a renamed .docx
#     try:
#         text = _read_docx(path)
#         if text.strip():
#             print(f"[DOC] Strategy 1 (python-docx) OK: {len(text)} chars")
#             return text
#     except Exception as e:
#         print(f"[DOC] Strategy 1 failed: {e}")

#     # Strategy 2 — true OLE binary
#     try:
#         import olefile
#         with olefile.OleFileIO(path) as ole:
#             if ole.exists("WordDocument"):
#                 raw_bytes = ole.openstream("WordDocument").read()
#                 # Decode as UTF-16LE (Word internal encoding)
#                 try:
#                     text = raw_bytes.decode("utf-16-le", errors="ignore")
#                 except Exception:
#                     text = raw_bytes.decode("latin-1", errors="ignore")
#                 # Keep only printable characters
#                 cleaned = re.sub(r"[^\x20-\x7E\n\r\t\u00C0-\u024F]", " ", text)
#                 lines = [
#                     ln.strip() for ln in cleaned.splitlines()
#                     if len(ln.strip()) > 4
#                     and sum(1 for c in ln if c.isalpha()) / max(len(ln), 1) > 0.4
#                 ]
#                 text = "\n".join(lines)
#                 if text.strip():
#                     print(f"[DOC] Strategy 2 (olefile) OK: {len(text)} chars")
#                     return text
#     except ImportError:
#         print("[DOC] olefile not installed — skipping strategy 2")
#     except Exception as e:
#         print(f"[DOC] Strategy 2 failed: {e}")

#     # Strategy 3 — brute force printable bytes
#     try:
#         with open(path, "rb") as f:
#             data = f.read()
#         runs = re.findall(rb"[ -~\t\r\n]{5,}", data)
#         lines = [
#             r.decode("ascii", errors="ignore").strip()
#             for r in runs
#             if len(r) > 5
#         ]
#         text = "\n".join(l for l in lines if l)
#         if text.strip():
#             print(f"[DOC] Strategy 3 (byte scan) OK: {len(text)} chars")
#             return text
#     except Exception as e:
#         print(f"[DOC] Strategy 3 failed: {e}")

#     raise HTTPException(
#         status_code=500,
#         detail=(
#             "Cannot read this .doc file (old Word 97-2003 binary format). "
#             "Please open it in Word and save as .docx, then re-upload."
#         )
#     )


# def extract_file_text(path: str) -> str:
#     ext = Path(path).suffix.lower()
#     print(f"[EXTRACT] {ext} → {path}")

#     if ext == ".txt":
#         with open(path, "r", encoding="utf-8", errors="ignore") as f:
#             return f.read().strip()

#     if ext == ".docx":
#         try:
#             return _read_docx(path)
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Failed to read DOCX: {e}")

#     if ext == ".doc":
#         return _read_doc_binary(path)

#     if ext == ".pdf":
#         try:
#             pages = []
#             with pdfplumber.open(path) as pdf:
#                 for page in pdf.pages:
#                     t = page.extract_text()
#                     if t:
#                         pages.append(t)
#             return "\n".join(pages).strip()
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Failed to read PDF: {e}")

#     raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")


# # ═══════════════════════════════════════════════════════════════════════════════
# # SKILL MATRIX ROW EXTRACTION
# # ═══════════════════════════════════════════════════════════════════════════════

# def extract_skill_matrix_rows(path: str) -> list[str]:
#     ext = Path(path).suffix.lower()

#     # For true .docx, read the table directly — most accurate
#     if ext == ".docx":
#         try:
#             from docx import Document as D
#             doc = D(path)
#             rows_found = []

#             for table in doc.tables:
#                 if not table.rows:
#                     continue
#                 first_cell = table.rows[0].cells[0].text.strip().lower()
#                 is_header_row = any(
#                     kw in first_cell
#                     for kw in ("requirement", "skill", "criteria", "competenc", "explain")
#                 )
#                 for i, row in enumerate(table.rows):
#                     if i == 0 and is_header_row:
#                         continue
#                     cell_text = row.cells[0].text.strip()
#                     cell_text = re.sub(r"\*\*(.+?)\*\*", r"\1", cell_text)
#                     if cell_text:
#                         rows_found.append(cell_text)
#                 if rows_found:
#                     break

#             if rows_found:
#                 print(f"[SM-ROWS] {len(rows_found)} rows from DOCX table")
#                 return rows_found
#         except Exception as e:
#             print(f"[SM-ROWS] DOCX table read failed: {e}")

#     # For .doc and all others, extract text then parse lines
#     plain = extract_file_text(path)
#     rows = _parse_plain_text_rows(plain)
#     print(f"[SM-ROWS] {len(rows)} rows from plain text ({ext})")
#     return rows


# def _parse_plain_text_rows(text: str) -> list[str]:
#     SKIP = {
#         "requirements", "requirement",
#         "explain how the candidate meets the requirement",
#         "how the candidate meets the requirement",
#         "skill", "criteria", "competency", "",
#     }
#     rows = []
#     for line in text.splitlines():
#         line = line.strip()
#         if not line:
#             continue
#         # Pipe table
#         if line.startswith("|"):
#             if "---" in line:
#                 continue
#             parts = [p.strip() for p in line.strip("|").split("|")]
#             cell = re.sub(r"\*\*(.+?)\*\*", r"\1", parts[0]).strip() if parts else ""
#             if cell.lower() not in SKIP and cell:
#                 rows.append(cell)
#             continue
#         # Bullet
#         m = re.match(r"^[-•*]\s+(.+)$", line)
#         if m:
#             rows.append(m.group(1).strip())
#             continue
#         # Numbered
#         m = re.match(r"^\d+[.)]\s+(.+)$", line)
#         if m:
#             rows.append(m.group(1).strip())
#             continue
#         # Plain line
#         if len(line) > 10:
#             rows.append(line)
#     return rows


# # ═══════════════════════════════════════════════════════════════════════════════
# # SECTION HEADER DETECTOR
# # ═══════════════════════════════════════════════════════════════════════════════

# SECTION_KEYWORDS = {
#     "must have", "nice to have", "individual quality", "should have",
#     "required", "preferred", "mandatory", "desirable", "good to have",
# }

# def is_section_header(text: str) -> bool:
#     t = text.strip().lower().rstrip(":")
#     return t in SECTION_KEYWORDS or (len(text.strip()) < 50 and text.strip().endswith(":"))


# # ═══════════════════════════════════════════════════════════════════════════════
# # SKILL MATRIX PROMPT
# # ═══════════════════════════════════════════════════════════════════════════════

# def build_skill_matrix_prompt(requirements: list[str], cv_text: str) -> str:
#     # Limit CV to 6000 chars to stay well within token limits
#     cv_trimmed = cv_text[:6000]
#     if len(cv_text) > 6000:
#         print(f"[SM-PROMPT] CV trimmed from {len(cv_text)} to 6000 chars")

#     req_block = "\n".join(f"{i+1}. {r}" for i, r in enumerate(requirements))

#     return f"""You are a recruiter filling a Skill Matrix. For each numbered requirement below, write how the candidate meets it based ONLY on the CV provided.

# STRICT RULES:
# - Output ONLY a valid JSON array, nothing else — no explanation, no markdown fences
# - Every object must have keys "requirement" (copy exactly) and "answer"
# - For section headers like "Must have:" output an empty string "" for answer
# - Base every answer only on the CV — if not supported write "Limited evidence in CV."
# - Keep answers to 2-3 sentences, professional third-person tone
# - Use the candidate's name from the CV naturally

# REQUIREMENTS:
# {req_block}

# CV:
# {cv_trimmed}

# Output the JSON array now:"""


# # ═══════════════════════════════════════════════════════════════════════════════
# # SKILL MATRIX DOCX BUILDER  (pure python-docx)
# # ═══════════════════════════════════════════════════════════════════════════════

# def build_skill_matrix_docx(rows: list[dict], output_path: str):
#     from docx import Document as D
#     from docx.shared import Pt, Cm
#     from docx.enum.text import WD_ALIGN_PARAGRAPH
#     from docx.enum.table import WD_ALIGN_VERTICAL
#     from docx.oxml.ns import qn
#     from docx.oxml import OxmlElement

#     def set_bg(cell, hex_color: str):
#         tc = cell._tc
#         tcPr = tc.get_or_add_tcPr()
#         for old in tcPr.findall(qn("w:shd")):
#             tcPr.remove(old)
#         shd = OxmlElement("w:shd")
#         shd.set(qn("w:val"), "clear")
#         shd.set(qn("w:color"), "auto")
#         shd.set(qn("w:fill"), hex_color)
#         tcPr.append(shd)

#     def set_borders(cell):
#         tc = cell._tc
#         tcPr = tc.get_or_add_tcPr()
#         for old in tcPr.findall(qn("w:tcBorders")):
#             tcPr.remove(old)
#         b = OxmlElement("w:tcBorders")
#         for side in ("top", "left", "bottom", "right"):
#             el = OxmlElement(f"w:{side}")
#             el.set(qn("w:val"), "single")
#             el.set(qn("w:sz"), "4")
#             el.set(qn("w:space"), "0")
#             el.set(qn("w:color"), "595959")
#             b.append(el)
#         tcPr.append(b)

#     def set_width(cell, twips: int):
#         tc = cell._tc
#         tcPr = tc.get_or_add_tcPr()
#         for old in tcPr.findall(qn("w:tcW")):
#             tcPr.remove(old)
#         w = OxmlElement("w:tcW")
#         w.set(qn("w:w"), str(twips))
#         w.set(qn("w:type"), "dxa")
#         tcPr.append(w)

#     def write_cell(cell, text: str, bold=False, size=10,
#                    align=WD_ALIGN_PARAGRAPH.LEFT):
#         cell.text = ""
#         p = cell.paragraphs[0]
#         p.alignment = align
#         p.paragraph_format.space_after  = Pt(0)
#         p.paragraph_format.space_before = Pt(0)
#         run = p.add_run(text or "")
#         run.bold = bold
#         run.font.name = "Arial"
#         run.font.size = Pt(size)

#     doc = D()
#     sec = doc.sections[0]
#     sec.page_width    = Cm(29.7)
#     sec.page_height   = Cm(21.0)
#     sec.left_margin   = Cm(1.5)
#     sec.right_margin  = Cm(1.5)
#     sec.top_margin    = Cm(1.5)
#     sec.bottom_margin = Cm(1.5)

#     COL1, COL2 = 4252, 10886   # twips (landscape A4 @ 1.5cm margins)

#     table = doc.add_table(rows=1, cols=2)
#     table.style = "Table Grid"

#     # Header
#     hdr = table.rows[0].cells
#     write_cell(hdr[0], "Requirements",
#                bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
#     write_cell(hdr[1], "Explain how the candidate meets the requirement",
#                bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
#     for c in hdr:
#         set_bg(c, "DEEAF6")
#         set_borders(c)
#         c.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
#     set_width(hdr[0], COL1)
#     set_width(hdr[1], COL2)

#     # Data rows
#     for rd in rows:
#         is_hdr = rd.get("is_header", False)
#         bg     = "F2F2F2" if is_hdr else "FFFFFF"
#         nr     = table.add_row().cells
#         write_cell(nr[0], rd.get("requirement", ""), bold=is_hdr, size=10)
#         write_cell(nr[1], rd.get("answer", ""),      bold=False,  size=10)
#         for c, b in [(nr[0], bg), (nr[1], "FFFFFF")]:
#             set_bg(c, b)
#             set_borders(c)
#             c.vertical_alignment = WD_ALIGN_VERTICAL.TOP
#         set_width(nr[0], COL1)
#         set_width(nr[1], COL2)

#     doc.save(output_path)
#     print(f"[SM-DOCX] Saved → {output_path}")


# # ═══════════════════════════════════════════════════════════════════════════════
# # SKILL MATRIX ENDPOINT
# # ═══════════════════════════════════════════════════════════════════════════════

# @app.post("/api/generate-skill-matrix")
# async def generate_skill_matrix(
#     skill_matrix: UploadFile = File(...),
#     cv: UploadFile = File(...),
# ):
#     for upload, label in [(skill_matrix, "Skill Matrix"), (cv, "CV")]:
#         name = (upload.filename or "").lower()
#         if not any(name.endswith(e) for e in (".docx", ".doc", ".txt", ".pdf")):
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"{label} must be .docx, .doc, .txt, or .pdf."
#             )

#     tmp_dir = tempfile.mkdtemp()
#     try:
#         sm_ext = Path(skill_matrix.filename or "sm.docx").suffix.lower()
#         cv_ext = Path(cv.filename or "cv.docx").suffix.lower()
#         sm_path = os.path.join(tmp_dir, f"skill_matrix{sm_ext}")
#         cv_path = os.path.join(tmp_dir, f"cv{cv_ext}")

#         sm_bytes = await skill_matrix.read()
#         cv_bytes = await cv.read()

#         with open(sm_path, "wb") as f: f.write(sm_bytes)
#         with open(cv_path, "wb") as f: f.write(cv_bytes)

#         print(f"[SM] SM file: {sm_path} ({len(sm_bytes)} bytes)")
#         print(f"[SM] CV file: {cv_path} ({len(cv_bytes)} bytes)")

#         # ── Extract rows from skill matrix ────────────────────────────────────
#         sm_rows = extract_skill_matrix_rows(sm_path)
#         print(f"[SM] Extracted {len(sm_rows)} requirement rows")

#         if not sm_rows:
#             raise HTTPException(
#                 status_code=400,
#                 detail=(
#                     "No requirement rows found in the Skill Matrix. "
#                     "The file should have a 2-column table (Requirements | Answers). "
#                     "If uploading a .doc file, please resave it as .docx in Microsoft Word first."
#                 )
#             )

#         # ── Extract CV text ───────────────────────────────────────────────────
#         cv_text = extract_file_text(cv_path)
#         print(f"[SM] CV text: {len(cv_text)} chars")

#         if not cv_text.strip():
#             raise HTTPException(
#                 status_code=400,
#                 detail="Could not extract text from CV. Try uploading as .docx or .txt."
#             )

#         # ── Call Groq ─────────────────────────────────────────────────────────
#         api_key = get_sm_key()
#         prompt  = build_skill_matrix_prompt(sm_rows, cv_text)
#         raw     = await call_groq(prompt, api_key, label="skill-matrix")

#         # ── Parse response ────────────────────────────────────────────────────
#         ai_rows = parse_json_array(raw, label="skill-matrix")

#         if not ai_rows:
#             raise HTTPException(
#                 status_code=500,
#                 detail="AI returned an empty skill matrix. Please try again."
#             )

#         # ── Extract candidate name ────────────────────────────────────────────
#         candidate_name = "Candidate"
#         for line in cv_text.splitlines():
#             line = line.strip()
#             if re.match(r"^[A-Z][a-z]+(?: [A-Z][a-z]+){1,3}$", line):
#                 candidate_name = line
#                 break
#         if candidate_name == "Candidate":
#             m = re.search(r"^([A-Z][a-z]+(?: [A-Z][a-z]+)+)", cv_text, re.MULTILINE)
#             if m:
#                 candidate_name = m.group(1).strip()
#         print(f"[SM] Candidate: {candidate_name}")

#         # ── Build final rows ──────────────────────────────────────────────────
#         final_rows = []
#         for item in ai_rows:
#             if not isinstance(item, dict):
#                 continue
#             req = str(item.get("requirement", "")).strip()
#             ans = str(item.get("answer", "")).strip()
#             final_rows.append({
#                 "requirement": req,
#                 "answer":      ans,
#                 "is_header":   is_section_header(req),
#             })

#         # ── Generate DOCX ─────────────────────────────────────────────────────
#         safe      = re.sub(r"[^\w\s-]", "", candidate_name).strip().replace(" ", "_")
#         fname     = f"Skill_Matrix_{safe}.docx"
#         out_path  = os.path.join(tmp_dir, fname)
#         build_skill_matrix_docx(final_rows, out_path)

#         # Copy to persistent dir (FileResponse needs file alive after return)
#         pdir  = tempfile.mkdtemp(prefix="sm_out_")
#         ppath = os.path.join(pdir, fname)
#         shutil.copy2(out_path, ppath)

#         return FileResponse(
#             path=ppath,
#             media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
#             filename=fname,
#         )

#     finally:
#         shutil.rmtree(tmp_dir, ignore_errors=True)


# # ═══════════════════════════════════════════════════════════════════════════════
# # HEALTH CHECK
# # ═══════════════════════════════════════════════════════════════════════════════

# @app.get("/api/health")
# async def health():
#     sm_key_src = "GROQ_SM_API_KEY" if GROQ_SM_API_KEY else ("GROQ_API_KEY (fallback)" if GROQ_API_KEY else "MISSING")
#     return {
#         "status": "ok",
#         "groq_configured":    bool(GROQ_API_KEY),
#         "groq_sm_configured": bool(GROQ_SM_API_KEY),
#         "groq_sm_key_source": sm_key_src,
#         "model": GROQ_MODEL,
#     }

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import httpx
import os
import json
import re
import tempfile
import shutil
import pdfplumber
from pathlib import Path
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

GROQ_API_KEY    = os.getenv("GROQ_API_KEY", "").strip()
GROQ_SM_API_KEY = os.getenv("GROQ_SM_API_KEY", "").strip()
GROQ_API_URL    = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL      = "llama-3.3-70b-versatile"

def get_sm_key() -> str:
    key = GROQ_SM_API_KEY or GROQ_API_KEY
    if not key:
        raise HTTPException(status_code=500, detail="No Groq API key configured.")
    return key

print(f"[STARTUP] GROQ_API_KEY    : {'SET' if GROQ_API_KEY else 'MISSING'}")
print(f"[STARTUP] GROQ_SM_API_KEY : {'SET' if GROQ_SM_API_KEY else 'MISSING (will use fallback)'}")


# ═══════════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class GenerateSizzlingRequest(BaseModel):
    cv_text: str
    jd_text: str

class SizzlingResponse(BaseModel):
    candidate_name: str
    top_sentences: list[str]
    skills: list[str]


# ═══════════════════════════════════════════════════════════════════════════════
# SKILL FILTER
# ═══════════════════════════════════════════════════════════════════════════════

def skill_exists_in_cv(skill: str, cv_text: str) -> bool:
    STOP = {"and", "&", "/", "the", "with", "for", "in", "of", "a", "an"}
    cv_lower = cv_text.lower()
    words = [w.strip(".,()[]") for w in skill.lower().split()
             if w.strip(".,()[]") not in STOP]
    return all(word in cv_lower for word in words if word)

def filter_skills_to_cv(skills: list[str], cv_text: str) -> list[str]:
    return [s for s in skills if skill_exists_in_cv(s, cv_text)]


# ═══════════════════════════════════════════════════════════════════════════════
# GROQ CALLER
# ═══════════════════════════════════════════════════════════════════════════════

async def call_groq(prompt: str, api_key: str, label: str = "groq") -> str:
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured.")
    print(f"[{label}] → Groq  model={GROQ_MODEL}  prompt={len(prompt)} chars")
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 4096,
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(GROQ_API_URL, headers=headers, json=payload)
        print(f"[{label}] ← Groq  status={resp.status_code}")
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid Groq API key.")
        if resp.status_code == 429:
            w = resp.headers.get("retry-after", "20-30")
            raise HTTPException(status_code=429, detail=f"Rate limit. Wait {w}s.")
        if resp.status_code == 413:
            raise HTTPException(status_code=413, detail="Input too large for Groq.")
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code,
                detail=f"Groq error ({resp.status_code}): {resp.text[:300]}")
        content = resp.json()["choices"][0]["message"]["content"].strip()
        print(f"[{label}] ← {len(content)} chars returned")
        if not content:
            raise HTTPException(status_code=500, detail="Groq returned empty response.")
        return content
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Groq timed out.")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Cannot reach Groq API.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# JSON PARSERS
# ═══════════════════════════════════════════════════════════════════════════════

def _strip_fences(raw: str) -> str:
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    raw = re.sub(r"\s*```\s*$", "", raw)
    return raw.strip()

def parse_json_response(raw: str) -> dict:
    raw = _strip_fences(raw)
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
    raise HTTPException(status_code=500, detail="AI returned unexpected format.")

def parse_json_array(raw: str, label: str = "sm") -> list:
    """Robust JSON array parser — handles fences, truncation, trailing commas."""
    original = raw
    raw = _strip_fences(raw)

    # Attempt 1: direct parse
    try:
        result = json.loads(raw)
        if isinstance(result, list):
            print(f"[{label}] parsed directly: {len(result)} items")
            return result
    except json.JSONDecodeError:
        pass

    # Attempt 2: find [ ... ]
    s = raw.find("[")
    if s != -1:
        e = raw.rfind("]")
        if e > s:
            try:
                result = json.loads(raw[s:e+1])
                if isinstance(result, list):
                    print(f"[{label}] parsed via bracket search: {len(result)} items")
                    return result
            except json.JSONDecodeError:
                pass

        # Attempt 3: extract complete objects char-by-char (handles truncation)
        arr = raw[s:]
        items, depth, obj_start = [], 0, None
        for i, ch in enumerate(arr):
            if ch == "{":
                if depth == 0:
                    obj_start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and obj_start is not None:
                    fragment = arr[obj_start:i+1]
                    fragment = re.sub(r",\s*([}\]])", r"\1", fragment)
                    try:
                        obj = json.loads(fragment)
                        if isinstance(obj, dict) and "requirement" in obj:
                            items.append(obj)
                    except json.JSONDecodeError:
                        pass
                    obj_start = None
        if items:
            print(f"[{label}] repaired {len(items)} items from truncated array")
            return items

    print(f"[{label}] PARSE FAILED. First 500 chars:\n{original[:500]}")
    raise HTTPException(status_code=500,
        detail=f"AI format error. Starts with: {original[:120]!r}")


# ═══════════════════════════════════════════════════════════════════════════════
# SIZZLING
# ═══════════════════════════════════════════════════════════════════════════════

def build_sizzling_prompt(cv: str, jd: str) -> str:
    return f"""Act as a senior recruiter. You will receive a candidate CV and a Job Description (JD).
Perform ALL tasks and return a single valid JSON object. No markdown, no extra text, JSON only.

TASK 1 — Extract from CV:
- candidate_name: The candidate's full name
- designation: Their current or most recent job title/role (e.g., "Full Stack Developer", "Test Manager", "Data Engineer")
- years_experience: Total years of professional experience (e.g., "4+", "10+", "15+")

TASK 2 — top_sentences: Generate exactly 3 sentences matching CV to JD.

SENTENCE 1 FORMAT (MANDATORY):
"[Candidate Name] is a [Designation] with [X]+ years of experience in [key skills/domains from CV that match JD], with hands-on expertise in [specific tools/technologies from CV]."

SENTENCE 2 FORMAT:
Start with "Proficient in" or "Skilled in" — describe specific technical capabilities, tools, and methodologies from the CV that match JD requirements.

SENTENCE 3 FORMAT:
Start with "Demonstrated" or "Adept at" — describe accomplishments, domain experience, or measurable achievements from the CV relevant to JD.

Rules for all sentences:
- Each sentence MUST be 2-3 lines long with specific details.
- Use ONLY information that EXISTS in the CV. Do not invent anything.
- Focus on skills/experience matching the JD requirements.

TASK 3 — skills: Extract exactly 15 skills from the CV most relevant to the JD.
Rules:
- ALL skills must exist word-for-word in the CV. Do not invent any skill.
- Prioritize skills mentioned in the JD that also appear in the CV.
- Short phrases only (1-4 words each).

Return ONLY this JSON (no markdown, no extra text):
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

CV:
{cv}

JD:
{jd}

JSON:"""


@app.post("/api/generate-sizzling", response_model=SizzlingResponse)
async def generate_sizzling(request: GenerateSizzlingRequest):
    cv = request.cv_text.strip()
    jd = request.jd_text.strip()
    if not cv:
        raise HTTPException(status_code=400, detail="CV text is required.")
    if not jd:
        raise HTTPException(status_code=400, detail="Job description is required.")
    if len(cv) > 40_000:
        raise HTTPException(status_code=413, detail="CV too long (>40,000 chars).")
    if len(jd) > 10_000:
        raise HTTPException(status_code=413, detail="JD too long (>10,000 chars).")

    raw = await call_groq(build_sizzling_prompt(cv, jd), GROQ_API_KEY, label="sizzling")
    parsed = parse_json_response(raw)
    raw_skills: list[str] = (parsed.get("skills", []) or [])[:15]
    verified = filter_skills_to_cv(raw_skills, cv)
    dropped = [s for s in raw_skills if s not in verified]
    if dropped:
        print(f"[sizzling] Dropped hallucinated skills: {dropped}")
    return SizzlingResponse(
        candidate_name=str(parsed.get("candidate_name", "")).strip().strip('"'),
        top_sentences=(parsed.get("top_sentences", []) or [])[:3],
        skills=verified,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# FILE TEXT EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

# Patterns that signal OLE/ZIP metadata garbage — stop parsing when hit
_OLE_GARBAGE_PATTERNS = re.compile(
    r"\[Content_Types\]|_rels/|theme/theme|\.xmlPK|"
    r"<\?xml|<a:clrMap|Normal\.dotm|CompObj|Root Entry|"
    r"SummaryInformation|DocumentSummary|WordDocument stream|"
    r"Microsoft Office Word|KSOProduct|ContentTypeId|"
    r"eyJoZGlk|0x0101|Word\.Document\.",
    re.IGNORECASE
)

# Lines that are clearly OLE file-system junk
_JUNK_LINE_PATTERNS = re.compile(
    r"^\[Content_Types\]|^_rels/|^theme/|\.xmlPK$|"
    r"^<\?xml|^<a:|Normal\.dotm|^Root Entry$|^CompObj$|"
    r"^WordDocument$|^1Table$|^0Table$|^Data$|"
    r"^SummaryInformation|^DocumentSummary|"
    r"Microsoft Office Word|^KSO|^ContentType|"
    r"^eyJ|^0x01|Word\.Document\.|^\d{4}-\d{2}\.",
    re.IGNORECASE
)


def _is_garbage_line(line: str) -> bool:
    """Return True if a line is OLE/ZIP metadata, not real document text."""
    line = line.strip()
    if not line:
        return True
    if _JUNK_LINE_PATTERNS.search(line):
        return True
    # Long base64 strings
    if re.match(r'^[A-Za-z0-9+/=]{40,}$', line):
        return True
    # Hex strings
    if re.match(r'^[0-9A-Fa-f]{20,}$', line):
        return True
    # XML fragments
    if line.startswith("<") and ("xmlns" in line or "://" in line):
        return True
    return False


def _clean_doc_text(text: str) -> str:
    """
    Remove OLE/ZIP artifact lines from extracted .doc text.
    Stops at the first garbage sentinel and filters remaining junk lines.
    """
    lines = text.splitlines()
    clean = []
    for line in lines:
        # Hard stop at OLE metadata sentinels
        if _OLE_GARBAGE_PATTERNS.search(line):
            print(f"[DOC-CLEAN] Stopped at OLE sentinel: {line[:60]!r}")
            break
        if not _is_garbage_line(line):
            clean.append(line)
    return "\n".join(clean).strip()


def _read_docx(path: str) -> str:
    """Read a true .docx — paragraphs then table cells."""
    from docx import Document as D
    doc = D(path)
    seen, parts = set(), []
    for p in doc.paragraphs:
        t = p.text.strip()
        if t and t not in seen:
            seen.add(t)
            parts.append(t)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                t = cell.text.strip()
                if t and t not in seen:
                    seen.add(t)
                    parts.append(t)
    return "\n".join(parts)


def _read_doc_binary(path: str) -> str:
    """
    Extract text from an old OLE binary .doc file.
    Strategy order:
      1. python-docx  (catches mis-named .docx)
      2. UTF-16LE scan of raw bytes  (real OLE content)
      3. ASCII byte scan (last resort)
    All results pass through _clean_doc_text() to strip OLE garbage.
    """
    # Strategy 1 — maybe it's a renamed .docx
    try:
        text = _read_docx(path)
        if text.strip():
            print(f"[DOC] S1 (python-docx): {len(text)} chars")
            return _clean_doc_text(text)
    except Exception as e:
        print(f"[DOC] S1 failed: {e}")

    # Strategy 2 — UTF-16LE scan (Word stores text as UTF-16LE internally)
    try:
        with open(path, "rb") as f:
            data = f.read()

        chunks, i = [], 0
        while i < len(data) - 1:
            word = int.from_bytes(data[i:i+2], "little")
            if 32 <= word <= 126 or word in (9, 10, 13):
                run = []
                j = i
                while j < len(data) - 1:
                    w = int.from_bytes(data[j:j+2], "little")
                    if 32 <= w <= 126 or w in (9, 10, 13, 160):
                        run.append(chr(w))
                        j += 2
                    else:
                        break
                if len(run) >= 5:
                    chunk = "".join(run).strip()
                    # Only keep chunks that look like real text (>40% alpha)
                    alpha = sum(1 for c in chunk if c.isalpha())
                    if chunk and alpha / max(len(chunk), 1) > 0.35:
                        chunks.append(chunk)
                i = j if j > i else i + 2
            else:
                i += 2

        text = "\n".join(chunks)
        cleaned = _clean_doc_text(text)
        if cleaned.strip():
            print(f"[DOC] S2 (UTF-16LE scan): {len(cleaned)} chars")
            return cleaned
    except Exception as e:
        print(f"[DOC] S2 failed: {e}")

    # Strategy 3 — ASCII byte scan
    try:
        with open(path, "rb") as f:
            data = f.read()
        runs = re.findall(rb"[ -~]{6,}", data)
        lines = []
        for r in runs:
            s = r.decode("ascii", errors="ignore").strip()
            words = re.findall(r"[a-zA-Z]{3,}", s)
            if len(words) >= 2 and len(s) > 8:
                lines.append(s)
        text = "\n".join(lines)
        cleaned = _clean_doc_text(text)
        if cleaned.strip():
            print(f"[DOC] S3 (ASCII scan): {len(cleaned)} chars")
            return cleaned
    except Exception as e:
        print(f"[DOC] S3 failed: {e}")

    raise HTTPException(
        status_code=500,
        detail=(
            "Cannot read this .doc file. Please open it in Word, "
            "save as .docx (File → Save As → .docx), then re-upload."
        )
    )


def extract_file_text(path: str) -> str:
    ext = Path(path).suffix.lower()
    print(f"[EXTRACT] {ext}  path={path}")

    if ext == ".txt":
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()

    if ext == ".docx":
        try:
            return _read_docx(path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read DOCX: {e}")

    if ext == ".doc":
        return _read_doc_binary(path)

    if ext == ".pdf":
        try:
            pages = []
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        pages.append(t)
            return "\n".join(pages).strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read PDF: {e}")

    raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")


# ═══════════════════════════════════════════════════════════════════════════════
# SKILL MATRIX ROW EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

# Lines that are column headers — never send to AI as requirements
_HEADER_SKIP = {
    "requirements", "requirement",
    "explain how the candidate meets the requirement",
    "how the candidate meets the requirement",
    "skill", "skills", "criteria", "competency", "competencies",
    "communication",  # single-word personal quality headings handled elsewhere
}

# Patterns that mean a line is definitely OLE junk (for row filtering)
_ROW_JUNK = re.compile(
    r"\[Content_Types\]|_rels/|\.xmlPK|<\?xml|<a:|Normal\.dotm|"
    r"eyJ[A-Za-z0-9]|^0x01|Word\.Document|KSOProduct|ContentType",
    re.IGNORECASE
)


def _is_valid_requirement(text: str) -> bool:
    """Return True if the text is a real requirement, not a header or junk."""
    t = text.strip()
    if not t or len(t) < 5:
        return False
    if t.lower() in _HEADER_SKIP:
        return False
    if _ROW_JUNK.search(t):
        return False
    # Reject base64 / hex strings
    if re.match(r'^[A-Za-z0-9+/=]{30,}$', t):
        return False
    if re.match(r'^[0-9A-Fa-f]{16,}$', t):
        return False
    # Must contain at least one real word (>=3 alpha chars)
    if not re.search(r'[a-zA-Z]{3,}', t):
        return False
    return True


def extract_skill_matrix_rows(path: str) -> list[str]:
    """
    Extract requirement rows (left column) from the skill matrix file.
    For .docx: reads table cells directly (most accurate).
    For .doc / .txt / .pdf: extracts text then parses lines.
    """
    ext = Path(path).suffix.lower()

    # ── True .docx: read table directly ──────────────────────────────────────
    if ext == ".docx":
        try:
            from docx import Document as D
            doc = D(path)
            rows_found = []
            for table in doc.tables:
                if not table.rows:
                    continue
                first_cell = table.rows[0].cells[0].text.strip().lower()
                skip_header = any(
                    kw in first_cell
                    for kw in ("requirement", "skill", "criteria", "competenc", "explain")
                )
                for i, row in enumerate(table.rows):
                    if i == 0 and skip_header:
                        continue
                    cell = row.cells[0].text.strip()
                    cell = re.sub(r"\*\*(.+?)\*\*", r"\1", cell)
                    if _is_valid_requirement(cell):
                        rows_found.append(cell)
                if rows_found:
                    break
            if rows_found:
                print(f"[SM-ROWS] {len(rows_found)} rows from DOCX table")
                return rows_found
        except Exception as e:
            print(f"[SM-ROWS] DOCX table read failed: {e}")

    # ── .doc / .txt / .pdf: extract text → parse lines ───────────────────────
    plain = extract_file_text(path)
    rows = _parse_plain_text_rows(plain)
    print(f"[SM-ROWS] {len(rows)} rows from plain text ({ext})")
    return rows


def _parse_plain_text_rows(text: str) -> list[str]:
    """
    Parse requirement rows from plain text.
    Stops at the first OLE garbage sentinel line.
    Handles: pipe tables, bullets, numbered lists, plain lines.
    """
    rows = []
    for line in text.splitlines():
        raw_line = line
        line = line.strip()

        # Hard stop at OLE/XML sentinels
        if _OLE_GARBAGE_PATTERNS.search(line):
            print(f"[PARSE-ROWS] Stopped at OLE sentinel: {line[:60]!r}")
            break

        if not line or not _is_valid_requirement(line):
            continue

        # Pipe table (markdown)
        if line.startswith("|"):
            if "---" in line:
                continue
            parts = [p.strip() for p in line.strip("|").split("|")]
            cell = re.sub(r"\*\*(.+?)\*\*", r"\1", parts[0]).strip() if parts else ""
            if _is_valid_requirement(cell):
                rows.append(cell)
            continue

        # Bullet list
        m = re.match(r"^[-•*]\s+(.+)$", line)
        if m:
            candidate = m.group(1).strip()
            if _is_valid_requirement(candidate):
                rows.append(candidate)
            continue

        # Numbered list  e.g. "1. Good experience in..."
        m = re.match(r"^\d+[.)]\s+(.+)$", line)
        if m:
            candidate = m.group(1).strip()
            if _is_valid_requirement(candidate):
                rows.append(candidate)
            continue

        # Plain line
        if len(line) > 10 and _is_valid_requirement(line):
            rows.append(line)

    return rows


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION HEADER DETECTOR
# ═══════════════════════════════════════════════════════════════════════════════

SECTION_KEYWORDS = {
    "must have", "nice to have", "individual quality", "should have",
    "required", "preferred", "mandatory", "desirable", "good to have",
}

def is_section_header(text: str) -> bool:
    t = text.strip().lower().rstrip(":")
    return t in SECTION_KEYWORDS or (len(text.strip()) < 50 and text.strip().endswith(":"))


# ═══════════════════════════════════════════════════════════════════════════════
# SKILL MATRIX PROMPT
# Uses your exact recruiter prompt style:
#   - Strong opening words (Experienced, Proficient, Skilled, etc.)
#   - NO candidate name in answers
#   - Keywords strictly from the CV
#   - Professional table format
# ═══════════════════════════════════════════════════════════════════════════════

def build_skill_matrix_prompt(requirements: list[str], cv_text: str) -> str:
    cv_trimmed = cv_text[:7000]
    if len(cv_text) > 7000:
        print(f"[SM-PROMPT] CV trimmed {len(cv_text)} → 7000 chars")

    # Send requirements as a clean numbered list (no confusing quotes)
    req_lines = "\n".join(f"{i+1}. {r}" for i, r in enumerate(requirements))

    return f"""You are a senior recruiter filling in a Skill Matrix. For each requirement, write how the candidate meets it using ONLY information from the CV provided.

CRITICAL RULES — follow every one exactly:
1. Return ONLY a valid JSON array. No markdown fences, no text before or after the array.
2. Each array item: {{"requirement": "<copy requirement text exactly>", "answer": "<your answer>"}}
3. For section header rows (e.g. "Must have:", "Nice to have:", "Individual quality:") set answer to "".
4. NEVER mention the candidate by name anywhere in any answer.
5. Start every non-empty answer with one of these strong words: Experienced, Proficient, Skilled, Adept, Demonstrated, Proven, Accomplished, Competent, Versed, Specialised.
6. Every keyword, tool, technology, and achievement in the answer MUST come from the CV — do not invent or infer anything.
7. If the CV does not support a requirement, write exactly: "Limited evidence in CV."
8. Keep each answer to 2-3 sentences. Professional, confident, third-person tone.
9. The "requirement" value must be copied EXACTLY from the numbered list below (without the number prefix).

REQUIREMENTS (fill answers for each):
{req_lines}

CANDIDATE CV (your only evidence source):
{cv_trimmed}

Output the JSON array now (starting with [ ):"""


# ═══════════════════════════════════════════════════════════════════════════════
# SKILL MATRIX DOCX BUILDER
# ═══════════════════════════════════════════════════════════════════════════════

def build_skill_matrix_docx(rows: list[dict], output_path: str):
    from docx import Document as D
    from docx.shared import Pt, Cm
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_ALIGN_VERTICAL
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    def set_bg(cell, hex_color: str):
        tc = cell._tc
        tcPr = tc.get_or_add_tcPr()
        for old in tcPr.findall(qn("w:shd")):
            tcPr.remove(old)
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), hex_color)
        tcPr.append(shd)

    def set_borders(cell):
        tc = cell._tc
        tcPr = tc.get_or_add_tcPr()
        for old in tcPr.findall(qn("w:tcBorders")):
            tcPr.remove(old)
        b = OxmlElement("w:tcBorders")
        for side in ("top", "left", "bottom", "right"):
            el = OxmlElement(f"w:{side}")
            el.set(qn("w:val"), "single")
            el.set(qn("w:sz"), "4")
            el.set(qn("w:space"), "0")
            el.set(qn("w:color"), "595959")
            b.append(el)
        tcPr.append(b)

    def set_width(cell, twips: int):
        tc = cell._tc
        tcPr = tc.get_or_add_tcPr()
        for old in tcPr.findall(qn("w:tcW")):
            tcPr.remove(old)
        w = OxmlElement("w:tcW")
        w.set(qn("w:w"), str(twips))
        w.set(qn("w:type"), "dxa")
        tcPr.append(w)

    def write_cell(cell, text: str, bold=False, size=10,
                   align=WD_ALIGN_PARAGRAPH.LEFT):
        cell.text = ""
        p = cell.paragraphs[0]
        p.alignment = align
        p.paragraph_format.space_after  = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        run = p.add_run(text or "")
        run.bold = bold
        run.font.name = "Arial"
        run.font.size = Pt(size)

    doc = D()
    sec = doc.sections[0]
    # Landscape A4
    sec.page_width    = Cm(29.7)
    sec.page_height   = Cm(21.0)
    sec.left_margin   = Cm(1.5)
    sec.right_margin  = Cm(1.5)
    sec.top_margin    = Cm(1.5)
    sec.bottom_margin = Cm(1.5)

    COL1, COL2 = 4252, 10886  # twips — landscape A4 @ 1.5 cm margins

    table = doc.add_table(rows=1, cols=2)
    table.style = "Table Grid"

    # Header row
    hdr = table.rows[0].cells
    write_cell(hdr[0], "Requirements",
               bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    write_cell(hdr[1], "Explain how the candidate meets the requirement",
               bold=True, size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    for c in hdr:
        set_bg(c, "DEEAF6")
        set_borders(c)
        c.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    set_width(hdr[0], COL1)
    set_width(hdr[1], COL2)

    # Data rows
    for rd in rows:
        is_hdr = rd.get("is_header", False)
        nr     = table.add_row().cells
        write_cell(nr[0], rd.get("requirement", ""), bold=is_hdr, size=10)
        write_cell(nr[1], rd.get("answer", ""),      bold=False,  size=10)
        for c, bg in [(nr[0], "F2F2F2" if is_hdr else "FFFFFF"),
                      (nr[1], "FFFFFF")]:
            set_bg(c, bg)
            set_borders(c)
            c.vertical_alignment = WD_ALIGN_VERTICAL.TOP
        set_width(nr[0], COL1)
        set_width(nr[1], COL2)

    doc.save(output_path)
    print(f"[SM-DOCX] Saved → {output_path}")


# ═══════════════════════════════════════════════════════════════════════════════
# SKILL MATRIX ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/generate-skill-matrix")
async def generate_skill_matrix(
    skill_matrix: UploadFile = File(...),
    cv: UploadFile = File(...),
):
    for upload, label in [(skill_matrix, "Skill Matrix"), (cv, "CV")]:
        name = (upload.filename or "").lower()
        if not any(name.endswith(e) for e in (".docx", ".doc", ".txt", ".pdf")):
            raise HTTPException(status_code=400,
                detail=f"{label} must be .docx, .doc, .txt, or .pdf.")

    tmp_dir = tempfile.mkdtemp()
    try:
        sm_ext  = Path(skill_matrix.filename or "sm.docx").suffix.lower()
        cv_ext  = Path(cv.filename or "cv.docx").suffix.lower()
        sm_path = os.path.join(tmp_dir, f"skill_matrix{sm_ext}")
        cv_path = os.path.join(tmp_dir, f"cv{cv_ext}")

        sm_bytes = await skill_matrix.read()
        cv_bytes = await cv.read()
        with open(sm_path, "wb") as f: f.write(sm_bytes)
        with open(cv_path, "wb") as f: f.write(cv_bytes)
        print(f"[SM] SM={len(sm_bytes)}B  CV={len(cv_bytes)}B")

        # ── Extract skill matrix rows ─────────────────────────────────────────
        sm_rows = extract_skill_matrix_rows(sm_path)
        print(f"[SM] {len(sm_rows)} requirement rows: {sm_rows}")

        if not sm_rows:
            raise HTTPException(status_code=400,
                detail=(
                    "No requirement rows found in the Skill Matrix. "
                    "Ensure it has a 2-column table with requirements in the left column, "
                    "or requirements as bullet points / plain lines. "
                    "If it's a .doc file, resave as .docx in Word first."
                ))

        # ── Extract CV text ───────────────────────────────────────────────────
        cv_text = extract_file_text(cv_path)
        print(f"[SM] CV text: {len(cv_text)} chars")
        if not cv_text.strip():
            raise HTTPException(status_code=400,
                detail="Could not extract text from CV. Try .docx or .txt format.")

        # ── AI fill ───────────────────────────────────────────────────────────
        prompt  = build_skill_matrix_prompt(sm_rows, cv_text)
        raw     = await call_groq(prompt, get_sm_key(), label="skill-matrix")
        ai_rows = parse_json_array(raw, label="skill-matrix")

        if not ai_rows:
            raise HTTPException(status_code=500,
                detail="AI returned an empty skill matrix. Please try again.")

        print(f"[SM] AI filled {len(ai_rows)} rows")

        # ── Candidate name (for filename only) ────────────────────────────────
        candidate_name = "Candidate"
        for line in cv_text.splitlines():
            line = line.strip()
            if re.match(r"^[A-Z][a-z]+(?: [A-Z][a-z]+){1,3}$", line):
                candidate_name = line
                break
        if candidate_name == "Candidate":
            m = re.search(r"^([A-Z][a-z]+(?: [A-Z][a-z]+)+)", cv_text, re.MULTILINE)
            if m:
                candidate_name = m.group(1).strip()
        print(f"[SM] Candidate (filename): {candidate_name}")

        # ── Build final rows ──────────────────────────────────────────────────
        final_rows = []
        for item in ai_rows:
            if not isinstance(item, dict):
                continue
            req = str(item.get("requirement", "")).strip()
            ans = str(item.get("answer", "")).strip()
            # Remove any candidate name that snuck through
            # (belt-and-suspenders — prompt already forbids it)
            if candidate_name and candidate_name != "Candidate":
                ans = ans.replace(candidate_name, "The candidate")
            final_rows.append({
                "requirement": req,
                "answer":      ans,
                "is_header":   is_section_header(req),
            })

        # ── Build DOCX ────────────────────────────────────────────────────────
        safe  = re.sub(r"[^\w\s-]", "", candidate_name).strip().replace(" ", "_")
        fname = f"Skill_Matrix_{safe}.docx"
        out   = os.path.join(tmp_dir, fname)
        build_skill_matrix_docx(final_rows, out)

        pdir  = tempfile.mkdtemp(prefix="sm_out_")
        ppath = os.path.join(pdir, fname)
        shutil.copy2(out, ppath)

        return FileResponse(
            path=ppath,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=fname,
        )

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "groq_configured":    bool(GROQ_API_KEY),
        "groq_sm_configured": bool(GROQ_SM_API_KEY),
        "groq_sm_source":     "GROQ_SM_API_KEY" if GROQ_SM_API_KEY else "GROQ_API_KEY (fallback)",
        "model":              GROQ_MODEL,
    }