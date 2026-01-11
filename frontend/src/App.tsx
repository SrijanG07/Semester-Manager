import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SubjectsList from "./pages/subjects/SubjectsList";
import SubjectDetail from "./pages/subjects/SubjectDetail";
import StudyTracker from "./pages/study/StudyTracker";
import Deadlines from "./pages/deadlines/Deadlines";
import TopicsPage from "./pages/subjects/TopicsPage";
import Analytics from "./pages/analytics/Analytics";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => (
  <TooltipProvider>
    <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <SubjectsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:id"
            element={
              <ProtectedRoute>
                <SubjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:id/topics"
            element={
              <ProtectedRoute>
                <TopicsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study"
            element={
              <ProtectedRoute>
                <StudyTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deadlines"
            element={
              <ProtectedRoute>
                <Deadlines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </TooltipProvider>
);

export default App;
