import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { TasksPage } from "@/pages/TasksPage";
import { ChecklistPage } from "@/pages/ChecklistPage";
import { TimerPage } from "@/pages/TimerPage";
import { ChatPage } from "@/pages/ChatPage";
import { RoadmapPage } from "@/pages/RoadmapPage";
import { NotesPage } from "@/pages/NotesPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { Skeleton } from "@/components/ui/skeleton";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-full max-w-sm px-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse mx-auto" />
          <p className="text-xs text-muted-foreground">Loading DuoMate...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <SignupPage />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Main Clean Workspace */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="checklist" element={<ChecklistPage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="roadmap" element={<RoadmapPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Backward-compat redirects */}
        <Route path="tasks/mine" element={<Navigate to="/tasks" replace />} />
        <Route path="tasks/partner" element={<Navigate to="/tasks" replace />} />
        <Route path="tasks/shared" element={<Navigate to="/tasks" replace />} />
        <Route path="study-together" element={<Navigate to="/timer" replace />} />
        <Route path="gate" element={<Navigate to="/roadmap" replace />} />
        <Route path="vlsi" element={<Navigate to="/roadmap" replace />} />
        <Route path="activity" element={<Navigate to="/" replace />} />
        <Route path="analytics" element={<Navigate to="/" replace />} />
        <Route path="resources" element={<Navigate to="/tasks" replace />} />
        <Route path="reports" element={<Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
