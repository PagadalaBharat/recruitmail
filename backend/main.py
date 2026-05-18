from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Recruiter Email Generator API")

# ── CORS: supports local dev + production Vercel URL ──────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"


class GenerateSizzlingRequest(BaseModel):
    cv_text: str
    jd_text: str


class SizzlingResponse(BaseModel):
    candidate_name: str
    top_sentences: list[str]
    skills: list[str]


async def call_groq(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(GROQ_API_URL, headers=headers, json=payload)
        if response.status_code == 429:
            raise HTTPException(status_code=429, detail="Rate limit reached. Please wait 20-30 seconds and try again.")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"Groq API error: {response.text}")
        return response.json()["choices"][0]["message"]["content"].strip()


@app.post("/api/generate-sizzling", response_model=SizzlingResponse)
async def generate_sizzling(request: GenerateSizzlingRequest):
    cv = request.cv_text.strip()
    jd = request.jd_text.strip()
    if not cv or not jd:
        raise HTTPException(status_code=400, detail="CV and JD text are required")

    prompt = f"""Act as a senior recruiter. You will receive a candidate CV and a Job Description (JD).
Perform ALL three tasks and return a single valid JSON object. No markdown, no extra text, JSON only.

TASK 1 - candidate_name: Extract ONLY the candidate's full name from the CV.

TASK 2 - top_sentences: Generate exactly 3 sentences from the CV that best match the JD.
Rules:
- Each sentence MUST start with: Experienced, Proficient, Skilled, Adept, or Demonstrated.
- Use ONLY information from the CV. Do not invent anything.
- Each sentence must be 2-3 lines long with specific tools, domains and measurable experience.

TASK 3 - skills: Extract exactly 15 skills from the CV most relevant to the JD.
Rules:
- ALL skills must exist in the CV. Do not invent any skill.
- Short phrases only (1-4 words each).

Return ONLY this JSON:
{{
  "candidate_name": "Full Name Here",
  "top_sentences": ["Sentence 1.", "Sentence 2.", "Sentence 3."],
  "skills": ["Skill 1","Skill 2","Skill 3","Skill 4","Skill 5","Skill 6","Skill 7","Skill 8","Skill 9","Skill 10","Skill 11","Skill 12","Skill 13","Skill 14","Skill 15"]
}}

CV:
{cv}

JD:
{jd}

JSON output:"""

    try:
        raw = await call_groq(prompt)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    def parse(raw: str) -> dict:
        raw = raw.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1][4:] if parts[1].startswith("json") else parts[1]
        raw = raw.strip()
        try:
            return json.loads(raw)
        except Exception:
            pass
        s, e = raw.find("{"), raw.rfind("}") + 1
        if s != -1 and e > s:
            try:
                return json.loads(raw[s:e])
            except Exception:
                pass
        raise HTTPException(status_code=500, detail="AI returned unexpected format. Please try again.")

    parsed = parse(raw)
    return SizzlingResponse(
        candidate_name=str(parsed.get("candidate_name", "")).strip().strip('"'),
        top_sentences=(parsed.get("top_sentences", []) or [])[:3],
        skills=(parsed.get("skills", []) or [])[:15],
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "groq_configured": bool(GROQ_API_KEY), "model": GROQ_MODEL}