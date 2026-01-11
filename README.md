# 📚 Academic Manager - Full-Stack MERN Application

A comprehensive academic tracking system built with React, TypeScript, Express, and MongoDB. Manage your semester with ease: track subjects, study sessions, deadlines, attendance, and analyze your performance.

![Status](https://img.shields.io/badge/Status-Active-success)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Node](https://img.shields.io/badge/Node-18+-339933)

## 🎯 Project Overview

Academic Manager helps students track academic performance, manage study sessions, organize resources, monitor deadlines, and analyze weak areas across multiple subjects.

### ✨ Key Features

- **Authentication System** - JWT-based secure login/register
- **Subject Management** - Full CRUD with color coding
- **Grading System** - Weighted calculations (validates 100% total)
- **Performance Tracking** - Real-time score calculation with class average comparison
- **Study Tracker** - Live timer with session logging and analytics
- **Deadline Management** - Auto-calculated priority (overdue/urgent/soon/later)
- **Topic Management** - Status tracking with weak topics detection
- **Attendance Tracking** - Percentage calculator with "classes needed" algorithm
- **Dashboard Analytics** - Real-time stats and quick actions

## 🛠️ Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** + **shadcn/ui** for styling
- **React Router v7** for routing
- **Axios** for API calls
- **React Hot Toast** for notifications
- **date-fns** for date manipulation

### Backend
- **Node.js** with **Express 5**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Cloudinary** for file uploads

## 📁 Project Structure

```
academic-manager/
├── backend/              # Express API server
│   ├── src/
│   │   ├── config/      # Database and Cloudinary config
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Auth middleware
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   ├── utils/       # Utility functions
│   │   └── server.ts    # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context providers
│   │   ├── lib/         # Utilities
│   │   ├── pages/       # Page components
│   │   └── main.tsx     # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── package.json         # Root package.json with scripts
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **MongoDB** installed locally or MongoDB Atlas account
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd academic-manager
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup Backend Environment**
   
   Create `backend/.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/academic-manager
   # OR use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/academic-manager
   
   JWT_SECRET=your-super-secret-jwt-key-change-this
   
   # Cloudinary (optional - for file uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Setup Frontend Environment**
   
   Create `frontend/.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Application

**Development mode (both frontend and backend):**
```bash
npm run dev
```

**Or run individually:**
```bash
# Backend only (runs on http://localhost:5000)
npm run dev:backend

# Frontend only (runs on http://localhost:5173)
npm run dev:frontend
```

**Production build:**
```bash
npm run build
npm start
```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run both frontend and backend in development mode |
| `npm run dev:backend` | Run backend only |
| `npm run dev:frontend` | Run frontend only |
| `npm run build` | Build both frontend and backend for production |
| `npm run start` | Start backend in production mode |
| `npm run install:all` | Install dependencies for root, backend, and frontend |
| `npm run clean` | Remove all node_modules and build folders |

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Grading
- `GET /api/subjects/:id/grading` - Get grading components
- `POST /api/subjects/:id/grading` - Add grading component
- `PUT /api/grading/:id` - Update component
- `DELETE /api/grading/:id` - Delete component

### Study Sessions
- `GET /api/study/sessions` - Get all sessions
- `POST /api/study/sessions` - Create session
- `GET /api/study/analytics` - Get study analytics

### Deadlines
- `GET /api/deadlines` - Get all deadlines
- `POST /api/deadlines` - Create deadline
- `PUT /api/deadlines/:id` - Update deadline
- `DELETE /api/deadlines/:id` - Delete deadline

### Topics
- `GET /api/subjects/:id/topics` - Get subject topics
- `POST /api/subjects/:id/topics` - Create topic
- `PUT /api/topics/:id` - Update topic
- `DELETE /api/topics/:id` - Delete topic

### Attendance
- `GET /api/attendance/:subjectId` - Get attendance
- `POST /api/attendance/:subjectId` - Mark attendance
- `GET /api/attendance/:subjectId/stats` - Get stats

## 📊 Database Models

- **User** - Authentication and profile
- **Subject** - Course information with color coding
- **GradingComponent** - Weighted grade components (exams, assignments, etc.)
- **Score** - Individual scores for grading components
- **StudySession** - Track study time per subject
- **Deadline** - Assignments and exam deadlines
- **Topic** - Subject topics with mastery status
- **Attendance** - Class attendance records
- **Resource** - Study materials and notes (Cloudinary integration)

## 🎨 Features in Detail

### Dashboard
- Overview of all subjects with current grades
- Study time statistics
- Upcoming deadlines
- Quick actions for common tasks

### Subject Management
- Create subjects with custom colors
- Define weighted grading components
- Track current grade vs class average
- Visual progress indicators

### Study Tracker
- Live timer for study sessions
- Subject-specific time tracking
- Weekly/monthly analytics
- Study goal tracking

### Deadline Manager
- Priority-based categorization
- Automatic overdue detection
- Calendar integration
- Completion tracking

### Topic Mastery
- Three-tier status system (Weak/Moderate/Strong)
- Visual weak topic identification
- Progress tracking per subject
- Revision planning

### Attendance
- Percentage calculator
- "Classes needed" for target percentage
- Subject-wise tracking
- Attendance history

## 🔒 Security

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- CORS configuration
- Environment variable management

## 🚀 Deployment

### Backend Deployment (e.g., Railway, Render)
1. Set environment variables on hosting platform
2. Run `npm run build:backend`
3. Start with `npm start`

### Frontend Deployment (e.g., Vercel, Netlify)
1. Set `VITE_API_URL` to production backend URL
2. Run `npm run build:frontend`
3. Deploy `frontend/dist` folder

## 📄 License

ISC

## 👤 Author

Your Name

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!
