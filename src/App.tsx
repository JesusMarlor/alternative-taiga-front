import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { LoginPage } from './pages/LoginPage';
import { InvitationPage } from './pages/InvitationPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectLayout } from './components/layout/ProjectLayout';
import { KanbanPage } from './pages/KanbanPage';
import { ScrumPage } from './pages/ScrumPage';
import { EpicsPage } from './pages/EpicsPage';
import { IssuesPage } from './pages/IssuesPage';
import { WikiPageModule } from './pages/WikiPage';
import { TeamPage } from './pages/TeamPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export function App() {
  const { initTheme } = useThemeStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invitation/:token" element={<InvitationPage />} />
        <Route path="/invitations/:token" element={<InvitationPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />

        {/* Project workspace routes */}
        <Route
          path="/project/:slug"
          element={
            <ProtectedRoute>
              <ProjectLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="kanban" replace />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="scrum" element={<ScrumPage />} />
          <Route path="epics" element={<EpicsPage />} />
          <Route path="issues" element={<IssuesPage />} />
          <Route path="wiki" element={<WikiPageModule />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<ProjectSettingsPage />} />
          <Route path="admin/project-profile/details" element={<ProjectSettingsPage />} />
          <Route path="admin/*" element={<ProjectSettingsPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

