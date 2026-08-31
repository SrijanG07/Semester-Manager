import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SubjectsList from "./pages/subjects/SubjectsList";
import SubjectDetail from "./pages/subjects/SubjectDetail";
import StudyTracker from "./pages/study/StudyTracker";
import Deadlines from "./pages/deadlines/Deadlines";
import TopicsPage from "./pages/subjects/TopicsPage";
import Analytics from "./pages/analytics/Analytics";
import Settings from "./pages/Settings";
import GpaCalculator from "./pages/GpaCalculator";
import Timetable from "./pages/Timetable";
import Achievements from "./pages/Achievements";
import Notes from "./pages/Notes";
import ExamPrep from "./pages/ExamPrep";
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
                    <Routes>
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
                    </Routes>
                    <FloatingStudyTimer />
                    <CommandPalette />
                </BrowserRouter>
            </AuthProvider>
        </TooltipProvider>
    </ThemeProvider>
);

export default App;
