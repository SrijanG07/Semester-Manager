<div align="center">

# 🎓 AcademiQ

### AI-Powered Academic Semester Management System

A full-stack web application that helps students take control of their academic life — track grades, manage study sessions, organize resources, monitor deadlines, and leverage AI to supercharge learning.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](https://opensource.org/licenses/ISC)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Architecture](#-architecture) · [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 🔭 Overview

**AcademiQ** is a comprehensive academic management platform designed for students who want to stay on top of their semester. It combines traditional academic tracking (grades, attendance, deadlines) with modern AI capabilities — upload your study material as PDFs and let Gemini AI generate summaries, ELI5 explanations, quizzes, and flashcards with spaced repetition.

### Why AcademiQ?

| Problem | Solution |
|---------|----------|
| Grades scattered across platforms | Centralized weighted grading system with real-time score calculation |
| No visibility into study habits | Live study timer with weekly/monthly analytics and subject distribution charts |
| Missed deadlines | Auto-prioritized deadline manager with overdue/urgent/soon/later categories |
| Passive note-reading | AI generates quizzes and flashcards from your own study material |
| Attendance confusion | Percentage calculator with "how many classes needed to hit X%" algorithm |

---

## ✨ Features

### 📊 Dashboard & Analytics
- **Real-time overview** of subjects, scores, study hours, and upcoming deadlines
- **Study time charts** — visualize daily/weekly study patterns
- **Subject distribution** — see where your time goes with interactive pie charts
- **Alerts panel** — surface overdue deadlines and low attendance warnings

### 📚 Subject Management
- Create subjects with **custom color coding** for visual organization
- **Weighted grading components** — define exams, assignments, quizzes with percentage weights (validated to sum to 100%)
- Track **current grade vs. class average** with visual progress indicators
- Manage **topics** with three-tier mastery status: `Weak` → `Moderate` → `Strong`

### ⏱️ Study Tracker
- **Live floating timer** — persists across pages, never lose your session
- Subject-specific time logging with notes
- Weekly and monthly **study analytics** with breakdowns
- Study goal tracking and habit monitoring

### 📅 Deadline Manager
- **Smart priority system** — auto-categorizes into `Overdue` / `Urgent` / `Soon` / `Later`
- Completion tracking with visual indicators
- Subject-linked deadline organization

### 📋 Attendance Tracking
- Mark attendance per class or **bulk sync** total counts
- **Percentage calculator** with target percentage support
- **"Classes needed" algorithm** — tells you exactly how many more classes to attend to reach your target %

### 🤖 AI-Powered Learning (Gemini 2.5 Flash)
- **PDF Analysis** — upload study material and get instant AI-generated content
- **Smart Summaries** — structured summaries with TL;DR, key concepts, definitions, and formulas
- **ELI5 Explanations** — beginner-friendly breakdowns with analogies and real-world examples
- **Auto-generated Quizzes** — multiple-choice quizzes at Easy/Medium/Hard difficulty with explanations
- **Flashcard Generation** — AI creates spaced-repetition flashcards from your material
- **Quiz Attempt History** — track scores across attempts to measure improvement
- **Spaced Repetition** — flashcard review system with `Again` / `Good` / `Easy` intervals

### 📁 Resource Management
- Upload study materials (PDFs, notes) via **Supabase Storage**
- Organize resources per subject
- Direct integration with AI features for uploaded content

### 🔐 Authentication & Security
- JWT-based secure authentication
- Password hashing with bcryptjs
- Protected API routes with auth middleware
- CORS configuration for safe cross-origin requests

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite 7** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **shadcn/ui** (Radix primitives) | Accessible UI components |
| **React Router v7** | Client-side routing |
| **TanStack React Query** | Server state management |
| **Recharts** | Data visualization & charts |
| **React Hook Form** | Form handling |
| **Lucide React** | Icon library |
| **Axios** | HTTP client |
| **date-fns** | Date utilities |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | Runtime |
| **Express 5** | Web framework |
| **MongoDB** + **Mongoose 9** | Database & ODM |
| **JWT** (jsonwebtoken) | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Google Generative AI** (Gemini 2.5 Flash) | AI content generation |
| **Supabase** | File storage (PDF uploads) |
| **Multer** | File upload middleware |
| **express-validator** | Request validation |

---

## 🏗️ Architecture

```
academiq/
├── backend/                    # Express REST API
│   ├── src/
│   │   ├── config/            # Database & Supabase configuration
│   │   ├── controllers/       # Route handlers
│   │   │   ├── aiController.js        # AI generation, quizzes, flashcards
│   │   │   ├── authController.js      # Login, register, session
│   │   │   ├── attendanceController.js
│   │   │   ├── deadlineController.js
│   │   │   ├── gradingController.js
│   │   │   ├── resourceController.js
│   │   │   ├── studyController.js
│   │   │   ├── subjectController.js
│   │   │   └── topicController.js
│   │   ├── lib/
│   │   │   └── ai/            # AI provider abstraction
│   │   │       ├── gemini.js          # Gemini API client (text + PDF)
│   │   │       └── prompts.js         # Centralized prompt templates
│   │   ├── middleware/        # Auth middleware (JWT verification)
│   │   ├── models/            # Mongoose schemas (13 models)
│   │   ├── routes/            # API route definitions
│   │   └── server.js          # Entry point
│   ├── vercel.json            # Backend deployment config
│   └── package.json
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/            # AI feature UIs (quiz, flashcards, outputs)
│   │   │   ├── dashboard/     # Dashboard widgets & charts
│   │   │   ├── layout/        # App shell & navigation
│   │   │   ├── study/         # Floating study timer
│   │   │   ├── subjects/      # Subject cards, grading, topics
│   │   │   └── ui/            # shadcn/ui base components
│   │   ├── context/           # Auth context provider
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Route-level page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx / Register.tsx
│   │   │   ├── analytics/     # Analytics page
│   │   │   ├── deadlines/     # Deadline management
│   │   │   ├── study/         # Study tracker
│   │   │   └── subjects/      # Subject list, detail, topics
│   │   ├── utils/             # API client & helpers
│   │   └── App.tsx            # Router configuration
│   ├── vercel.json            # Frontend deployment config
│   └── package.json
│
├── package.json                # Monorepo root (workspaces + scripts)
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **MongoDB** — local install or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- **Supabase** account — for file storage ([supabase.com](https://supabase.com))
- **Google AI API Key** — for Gemini features ([ai.google.dev](https://ai.google.dev/))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/academiq.git
cd academiq

# 2. Install all dependencies (root + backend + frontend)
npm run install:all

# 3. Configure environment variables (see below)

# 4. Start development servers
npm run dev
```

This launches both the backend (`http://localhost:5000`) and frontend (`http://localhost:5173`) concurrently.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/academiq
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/academiq

# Authentication
JWT_SECRET=your-secure-random-secret-key

# Supabase (File Storage)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI (Google Gemini)
GEMINI_API_KEY=your-gemini-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

> **⚠️ Important:** Never commit `.env` files. They are already included in `.gitignore`.

---

## 📝 Available Scripts

Run from the **project root**:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend & backend in development mode |
| `npm run dev:backend` | Start backend only (port 5000) |
| `npm run dev:frontend` | Start frontend only (port 5173) |
| `npm run build` | Build both for production |
| `npm run build:backend` | Build backend only |
| `npm run build:frontend` | Build frontend only |
| `npm start` | Start backend in production mode |
| `npm run install:all` | Install dependencies for root, backend, and frontend |
| `npm run clean` | Remove all `node_modules` and build artifacts |

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/auth/me` | Get current user profile 🔒 |

### Subjects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subjects` | List all subjects 🔒 |
| `POST` | `/api/subjects` | Create a new subject 🔒 |
| `PUT` | `/api/subjects/:id` | Update subject details 🔒 |
| `DELETE` | `/api/subjects/:id` | Delete a subject 🔒 |

### Grading

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subjects/:id/grading` | Get grading components for a subject 🔒 |
| `POST` | `/api/subjects/:id/grading` | Add a grading component 🔒 |
| `PUT` | `/api/grading/:id` | Update a grading component 🔒 |
| `DELETE` | `/api/grading/:id` | Delete a grading component 🔒 |

### Study Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/study-sessions` | Get all study sessions 🔒 |
| `POST` | `/api/study-sessions` | Log a study session 🔒 |
| `GET` | `/api/study-sessions/stats` | Get study analytics 🔒 |

### Deadlines

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/deadlines` | List all deadlines 🔒 |
| `POST` | `/api/deadlines` | Create a deadline 🔒 |
| `PUT` | `/api/deadlines/:id` | Update a deadline 🔒 |
| `DELETE` | `/api/deadlines/:id` | Delete a deadline 🔒 |

### Topics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subjects/:id/topics` | Get topics for a subject 🔒 |
| `POST` | `/api/subjects/:id/topics` | Create a topic 🔒 |
| `PUT` | `/api/topics/:id` | Update topic mastery status 🔒 |
| `DELETE` | `/api/topics/:id` | Delete a topic 🔒 |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subjects/:id/attendance` | Get attendance records 🔒 |
| `POST` | `/api/subjects/:id/attendance` | Mark single attendance 🔒 |
| `POST` | `/api/subjects/attendance/sync` | Bulk sync attendance count 🔒 |
| `GET` | `/api/subjects/:id/attendance/stats` | Get attendance statistics 🔒 |

### Resources

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subjects/:id/resources` | List resources for a subject 🔒 |
| `POST` | `/api/subjects/:id/resources` | Upload a resource (PDF) 🔒 |
| `DELETE` | `/api/subjects/:id/resources/:resourceId` | Delete a resource 🔒 |

### AI Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/generate` | Generate summary or explanation from PDF 🔒 |
| `GET` | `/api/ai/outputs/:resourceId` | Get AI outputs for a resource 🔒 |
| `GET` | `/api/ai/output/:id` | Get a single AI output 🔒 |
| `GET` | `/api/ai/subject/:subjectId` | Get all AI outputs for a subject 🔒 |
| `POST` | `/api/ai/quiz` | Generate quiz from summary/explanation 🔒 |
| `POST` | `/api/ai/flashcards` | Generate flashcards from summary/explanation 🔒 |
| `POST` | `/api/ai/quiz-attempt` | Save a quiz attempt result 🔒 |
| `GET` | `/api/ai/quiz-attempts/:quizId` | Get quiz attempt history 🔒 |
| `POST` | `/api/ai/flashcard-progress` | Update flashcard review progress 🔒 |
| `GET` | `/api/ai/flashcard-progress/:outputId` | Get flashcard progress for a set 🔒 |
| `GET` | `/api/ai/flashcards-due` | Get count of flashcards due for review 🔒 |

> 🔒 = Requires authentication

---

## 🗄️ Database Schema

The application uses **13 Mongoose models**:

| Model | Description |
|-------|-------------|
| `User` | Authentication, profile, and hashed password |
| `Subject` | Course name, color code, and user reference |
| `GradingComponent` | Weighted grade components (exams, assignments, etc.) |
| `Score` | Individual scores linked to grading components |
| `StudySession` | Duration, subject, notes, and timestamps |
| `Deadline` | Due dates with type, subject, and completion status |
| `Topic` | Subject topics with mastery status (`weak`/`moderate`/`strong`) |
| `Attendance` | Class attendance records per subject |
| `Resource` | Uploaded study materials with Supabase file URLs |
| `AiOutput` | AI-generated content (summaries, explanations, quizzes, flashcards) |
| `QuizAttempt` | Quiz scores, answers, and timestamps |
| `FlashcardProgress` | Spaced repetition state (interval, ease, due date) |
| `RevisionPlan` | AI-generated revision schedules |

---

## 🚀 Deployment

The project is configured for **Vercel** deployment (both frontend and backend include `vercel.json`).

### Backend (Vercel / Railway / Render)

1. Set all environment variables on your hosting platform
2. Set the build command: `npm run build:backend` (if applicable)
3. Set the start command: `npm start`
4. Ensure MongoDB Atlas connection string is used in production

### Frontend (Vercel / Netlify)

1. Set `VITE_API_URL` to your production backend URL
2. Set the build command: `npm run build:frontend`
3. Set the output directory: `frontend/dist`
4. Enable SPA fallback (rewrite all routes to `index.html`)

### Quick Deploy Checklist

- [ ] MongoDB Atlas cluster created and connection string ready
- [ ] Supabase project created with storage bucket configured
- [ ] Gemini API key obtained from [Google AI Studio](https://ai.google.dev/)
- [ ] JWT_SECRET set to a strong random value
- [ ] CORS `FRONTEND_URL` updated to production frontend URL
- [ ] All environment variables configured on hosting platform

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Srijan Gupta**

- GitHub: [@your-username](https://github.com/your-username)

---

<div align="center">

### ⭐ Star this repo if it helped you!

Made with ❤️ for students, by a student.

</div>
