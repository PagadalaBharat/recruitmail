# RecruitMail — AI-Powered Recruiter Email Generator

Generate professional candidate submission emails in seconds using AI.  
**Stack:** React + Vite (frontend) · FastAPI + Python (backend) · Groq AI API

---

## 📁 Project Structure

```
recruiter-tool/
├── backend/
│   ├── main.py            ← FastAPI app
│   ├── requirements.txt
│   └── .env               ← You create this (copy from .env.example)
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🔑 Step 1 — Get a FREE Groq API Key

1. Go to **https://console.groq.com**
2. Sign up for a free account
3. Click **"API Keys"** → **"Create API Key"**
4. Copy the key (starts with `gsk_...`)

---

## 🐍 Step 2 — Backend Setup (Python / FastAPI)

### Requirements
- Python 3.10 or higher
- pip

### Install & Run

```bash
# 1. Navigate to backend folder
cd recruiter-tool/backend

# 2. Create a virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your .env file
cp .env.example .env

# 5. Open .env and paste your Groq API key:
#    GROQ_API_KEY=gsk_your_actual_key_here

# 6. Start the backend server
uvicorn main:app --reload --port 8000
```

✅ Backend runs at: **http://localhost:8000**  
📖 API docs at: **http://localhost:8000/docs**

---

## ⚛️ Step 3 — Frontend Setup (React + Vite)

### Requirements
- Node.js v18+ (you have v22.22.3 ✅)
- npm

### Install & Run

```bash
# 1. Open a NEW terminal window (keep backend running)

# 2. Navigate to frontend folder
cd recruiter-tool/frontend

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

✅ Frontend runs at: **http://localhost:3000**

> The Vite proxy automatically forwards `/api/*` calls to the backend on port 8000 — no CORS issues!

---

## 🚀 How to Use

### 1. Fill the Form (Left Column)
- **Greeting & Role**: Hi name, candidate name, role, location
- **Submission Details**: MSP name, requisition ID, bill rates, deadlines, project duration
- **Candidate Details**: Personal info, contact, nationality, interview note

### 2. Paste JD & CV (Right Column)
- **Job Requirements**: Paste the bullet points from the Job Description
- **Full CV Text**: Paste the entire candidate's CV text

### 3. Generate AI Sizzling
- Click **"✨ Generate Sizzling with AI"**
- The AI (via Groq LLaMA 3 70B) will:
  - Extract the candidate's name
  - Generate **3 powerful matching sentences** from the CV vs JD
  - Extract **15 relevant skills**
- All AI results are **editable** — you can tweak them

### 4. Preview & Copy
- Click **"👁 Preview"** tab to see the formatted email
- Click **"📋 Copy as Plain Text"** to copy the full email
- Paste directly into Outlook / Gmail

---

## 🛠 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `GROQ_API_KEY not configured` | Make sure `.env` file exists in `/backend` with your key |
| `Connection refused` on AI button | Check backend is running on port 8000 |
| `npm install` errors | Run `npm install --legacy-peer-deps` |
| AI returns empty skills | Paste more complete CV text — at least 200 words |
| Port 3000 already in use | Change port in `vite.config.js` → `port: 3001` |

---

## 🔄 Running Both Servers (Quick Reference)

**Terminal 1 — Backend:**
```bash
cd recruiter-tool/backend
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd recruiter-tool/frontend
npm run dev
```

Then open: **http://localhost:3000** 🎉

---

## 📦 Build for Production

```bash
# Frontend
cd frontend
npm run build
# Output in /frontend/dist

# Backend — run without --reload
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🤖 AI Prompts Used (Groq / LLaMA 3 70B)

**For 3 Sizzling Sentences:**
> Act as a senior recruiter. From the CV, generate exactly 3 sentences that best match the JD. Each must start with a strong action word (Experienced, Proficient, Skilled...). Only use information from the CV. Output as JSON array.

**For 15 Skills:**
> Act as a senior recruiter. From the CV, extract exactly 15 skills most relevant to the JD. All skills must be from the CV only. Output as JSON array of 15 strings.

Both prompts enforce JSON-only output for reliable parsing.
