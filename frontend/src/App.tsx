import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SubjectsList = lazy(() => import("./pages/subjects/SubjectsList"));
const SubjectDetail = lazy(() => import("./pages/subjects/SubjectDetail"));
const StudyTracker = lazy(() => import("./pages/study/StudyTracker"));
const Deadlines = lazy(() => import("./pages/deadlines/Deadlines"));
const TopicsPage = lazy(() => import("./pages/subjects/TopicsPage"));
const Analytics = lazy(() => import("./pages/analytics/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const GpaCalculator = lazy(() => import("./pages/GpaCalculator"));
const Timetable = lazy(() => import("./pages/Timetable"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Notes = lazy(() => import("./pages/Notes"));
const ExamPrep = lazy(() => import("./pages/ExamPrep"));
import ProtectedRoute from "./components/ProtectedRoute";
import FloatingStudyTimer from "./components/study/FloatingStudyTimer";
import CommandPalette from "./components/layout/CommandPalette";

const App = () => (
    <ThemeProvider defaultTheme="system">
        <TooltipProvider>
            <AuthProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <Suspense fallback={<div className="p-8 text-muted-foreground" role="status">Loading workspace…</div>}><Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/subjects" element={<ProtectedRoute><SubjectsList /></ProtectedRoute>} />
                        <Route path="/subjects/:id" element={<ProtectedRoute><SubjectDetail /></ProtectedRoute>} />
                        <Route path="/subjects/:id/topics" element={<ProtectedRoute><TopicsPage /></ProtectedRoute>} />
                        <Route path="/study" element={<ProtectedRoute><StudyTracker /></ProtectedRoute>} />
                        <Route path="/deadlines" element={<ProtectedRoute><Deadlines /></ProtectedRoute>} />
                        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        <Route path="/gpa" element={<ProtectedRoute><GpaCalculator /></ProtectedRoute>} />
                        <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
                        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                        <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
                        <Route path="/exam-prep" element={<ProtectedRoute><ExamPrep /></ProtectedRoute>} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></Suspense>
                    <FloatingStudyTimer />
                    <CommandPalette />
                </BrowserRouter>
            </AuthProvider>
        </TooltipProvider>
    </ThemeProvider>
);

export default App;
