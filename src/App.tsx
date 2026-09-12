import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/DashboardPage';
import { FacultyPage } from './pages/admin/FacultyPage';
import { EventsPage } from './pages/admin/EventsPage';
import { TasksPage } from './pages/admin/TasksPage';
import { AnnouncementsPage } from './pages/admin/AnnouncementsPage';
import { QueriesPage } from './pages/admin/QueriesPage';
import { FormsPage } from './pages/admin/FormsPage';
import { FeedbackPage } from './pages/admin/FeedbackPage';
import { StudentLeaderboardPage } from './pages/admin/StudentLeaderboardPage';
import { StaffLeaderboardPage } from './pages/admin/StaffLeaderboardPage';

// Faculty Pages
import { FacultyDashboardPage } from './pages/faculty/FacultyDashboardPage';
import { MyTasksPage } from './pages/faculty/MyTasksPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { LeaderboardTasksPage } from './pages/student/LeaderboardTasksPage';

// Public Pages
import { PublicDynamicFormPage } from './pages/public/PublicDynamicFormPage';
import { PublicFeedbackFormPage } from './pages/public/PublicFeedbackFormPage';
import { LandingPage } from './pages/public/LandingPage';

// Shared Pages
import { DutyChartsPage } from './pages/shared/DutyChartsPage';
import { CoreCommitteesPage } from './pages/shared/CoreCommitteesPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Landing & Dedicated Authentication Portals */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/student/login" element={<LoginPage />} />
          <Route path="/faculty/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/forms/:slug" element={<PublicDynamicFormPage />} />
          <Route path="/feedback/:id" element={<PublicFeedbackFormPage />} />


          {/* DSW Admin Portal */}
          <Route path="/admin" element={<AppLayout allowedRoles={['super_admin']} pageTitle="DSW Administration Portal" />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="faculty" element={<FacultyPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="duty-charts" element={<DutyChartsPage />} />
            <Route path="committees" element={<CoreCommitteesPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="queries" element={<QueriesPage />} />
            <Route path="forms" element={<FormsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="leaderboard/students" element={<StudentLeaderboardPage />} />
            <Route path="leaderboard/staff" element={<StaffLeaderboardPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Faculty Portal */}
          <Route path="/faculty" element={<AppLayout allowedRoles={['faculty']} pageTitle="Faculty Workstation Portal" />}>
            <Route path="dashboard" element={<FacultyDashboardPage />} />
            <Route path="tasks" element={<MyTasksPage />} />
            <Route path="duty-charts" element={<DutyChartsPage />} />
            <Route path="committees" element={<CoreCommitteesPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="queries" element={<QueriesPage />} />
            <Route path="leaderboard" element={<StaffLeaderboardPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Student Portal */}
          <Route path="/student" element={<AppLayout allowedRoles={['student']} pageTitle="Student Welfare Portal" />}>
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="committees" element={<CoreCommitteesPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="queries" element={<QueriesPage />} />
            <Route path="leaderboard-tasks" element={<LeaderboardTasksPage />} />
            <Route path="leaderboard" element={<StudentLeaderboardPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Root Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
