# 🚀 Naukri AI Pro — Enterprise Career & Recruiter Platform

A full-featured, production-ready career and recruiter portal built with **React 19, TypeScript, Tailwind CSS, Node.js, Express, and MongoDB**, featuring AI-powered Resume Parsing, ATS Score Analytics, Job Matching, PDF/DOCX Resume Generation, and Recruiter ATS Pipeline Management.

---

## 📁 Production Directory Structure

```
Job-recuiter/
├── backend/                       # 🟢 Node.js / Express REST API (TypeScript)
│   ├── .env                       # Backend Environment Variables
│   ├── .env.example               # Backend Environment Template
│   ├── package.json               # Backend Dependencies & Scripts
│   ├── tsconfig.json              # TypeScript Configuration
│   ├── data/                      # Resilient Local Persistence Store (data/store.json)
│   ├── uploads/                   # Uploaded Resumes (PDF, DOCX, TXT)
│   └── src/
│       ├── middleware/
│       │   └── auth.ts            # JWT Authentication & Role Guards (Candidate/Recruiter)
│       ├── routes/
│       │   ├── auth.ts            # Signup, Login, Demo 1-Click Login, Profile
│       │   ├── resumes.ts         # Multi-format Resume Upload, Parsing & ATS Feedback
│       │   ├── jobs.ts            # Job Postings CRUD, Search, AI Recommendations
│       │   ├── applications.ts    # 1-Click Apply, Pipeline Status Advancement
│       │   ├── candidates.ts      # Recruiter Talent Pool Sourcing
│       │   └── extras.ts          # Saved Jobs, Notifications, Platform Metrics
│       ├── services/
│       │   ├── matchEngine.ts     # AI Skill Overlap & Semantic Match Score Engine
│       │   ├── resumeParser.ts    # PDF / DOCX / Text Entity Extraction Parser
│       │   └── store.ts           # Resilient Data Layer & Pre-seeded Sample Data
│       └── index.ts               # Server Entry Point, CORS, Static Serving & DB Connection
│
├── frontend/                      # 🔵 React 19 + Vite + Tailwind CSS (TypeScript)
│   ├── .env                       # Frontend Environment Variables
│   ├── .env.example               # Frontend Environment Template
│   ├── package.json               # Frontend Dependencies & Scripts
│   ├── tsconfig.json              # TypeScript Bundler Config
│   ├── vite.config.ts             # Vite + Tailwind v4 + API Proxy Config
│   ├── index.html                 # HTML Shell
│   └── src/
│       ├── components/
│       │   ├── Navbar.tsx         # Header with Role Switcher & Notifications
│       │   ├── AuthModal.tsx      # Sign In / Sign Up & Demo Login Modal
│       │   ├── JobCard.tsx        # Rich Job Card with Match Gauge & Badges
│       │   ├── JobDetailsModal.tsx# Deep Job Drawer with Responsibilities & Perks
│       │   ├── ResumeStudio.tsx   # AI Parser, ATS Scorer, PDF & DOCX Exporter
│       │   ├── CandidateApplications.tsx # Visual Hiring Pipeline Stepper
│       │   ├── PostJobModal.tsx   # Recruiter Job Publishing Modal
│       │   ├── RecruiterPipeline.tsx # Recruiter ATS Pipeline & 1-Click Status Controls
│       │   └── TalentSearch.tsx   # Candidate Talent Search Engine
│       ├── context/
│       │   └── AuthContext.tsx    # Auth State, JWT Session & Demo Swapper
│       ├── services/
│       │   └── api.ts             # Central API Client
│       ├── types.ts               # TypeScript Data Interfaces
│       ├── App.tsx                # Main App Orchestrator & View Controller
│       ├── main.tsx               # React DOM Root
│       └── index.css              # Dark-mode Glassmorphic Styling System
│
├── package.json                   # 📦 Monorepo Coordinator (Concurrent Dev Runner)
└── README.md                      # Comprehensive Architecture & Setup Guide
```

---

## 🔑 Environment Variables Guide

### 1. Backend (`backend/.env`)

| Variable | Default Value | Description & How to Get |
|---|---|---|
| `PORT` | `5000` | Port for the Express server to listen on. |
| `NODE_ENV` | `development` | Set to `development` locally or `production` when deployed. |
| `CLIENT_URL` | `http://localhost:5173` | The frontend client URL for CORS origin validation. |
| `JWT_SECRET` | `your_secret_key_here` | Secret key used to sign and verify JSON Web Tokens. <br/>**How to generate**: In terminal, run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` | Token expiration time (e.g. `7d`, `24h`, `30d`). |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/job_recruiter_db` | **MongoDB Database Connection String**.<br/>• **Local**: If you have MongoDB installed, use `mongodb://127.0.0.1:27017/job_recruiter_db`<br/>• **Cloud (Free)**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), create a free cluster, click *Connect* ➔ *Drivers*, copy connection string, replace `<password>` with database user password.<br/>*(Note: If MongoDB is not running, the platform automatically falls back to `backend/data/store.json` so it will never crash!)* |
| `UPLOAD_DIR` | `uploads` | Folder where uploaded resumes are stored. |
| `MAX_FILE_SIZE_MB` | `10` | Maximum resume file upload size in Megabytes. |

---

### 2. Frontend (`frontend/.env`)

| Variable | Default Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | The base URL of the backend REST API. |
| `VITE_APP_NAME` | `Naukri AI Pro` | The brand title displayed in header and tabs. |
| `VITE_ENV` | `development` | Environment mode (`development` or `production`). |

---

## ⚡ Quick Start (Running Locally)

### Option 1: Run Both Backend & Frontend with One Command
From the root project directory:
```bash
# 1. Install root, backend, and frontend dependencies
npm run install:all

# 2. Start both backend and frontend simultaneously
npm run dev
```

### Option 2: Run Separately in Two Terminals

**Terminal 1 (Backend)**:
```bash
cd backend
npm run dev
# -> Server running on http://localhost:5000
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
# -> App running on http://localhost:5173 (or 5174)
```

---

## 👥 Demo Credentials (1-Click Switchers)

You can click **"Demo Candidate"** or **"Demo Recruiter"** at the top of the header bar, or log in with:

| Role | Email | Password | Included Features |
|---|---|---|---|
| **Candidate / Job Seeker** | `candidate@demo.com` | `password123` | Upload/parse resumes, AI Match score, 1-Click apply, ATS Scorer, Multi-template preview, **PDF & DOCX Export**, Application pipeline tracker |
| **Recruiter / Employer** | `recruiter@demo.com` | `password123` | Post openings with skills/perks, ATS Candidate Pipeline, 1-Click status advancement (Shortlist, Interview, Hire, Reject), Talent Pool Sourcing |
