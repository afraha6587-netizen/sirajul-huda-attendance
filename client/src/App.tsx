import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AcademicProvider } from './context/AcademicContext';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

// Dynamic Lazy Loading for Ultra-Fast Initial Startup (Code Splitting)
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const PublicStudentPortal = lazy(() => import('./pages/PublicStudentPortal').then((m) => ({ default: m.PublicStudentPortal })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Classes = lazy(() => import('./pages/Classes').then((m) => ({ default: m.Classes })));
const Students = lazy(() => import('./pages/Students').then((m) => ({ default: m.Students })));
const Subjects = lazy(() => import('./pages/Subjects').then((m) => ({ default: m.Subjects })));
const Teachers = lazy(() => import('./pages/Teachers').then((m) => ({ default: m.Teachers })));
const ClassSubjectAssignments = lazy(() => import('./pages/ClassSubjectAssignments').then((m) => ({ default: m.ClassSubjectAssignments })));
const MarkAttendance = lazy(() => import('./pages/MarkAttendance').then((m) => ({ default: m.MarkAttendance })));
const MarkDailyAttendance = lazy(() => import('./pages/MarkDailyAttendance').then((m) => ({ default: m.MarkDailyAttendance })));
const SyllabusLogPage = lazy(() => import('./pages/SyllabusLogPage').then((m) => ({ default: m.SyllabusLogPage })));
const HolidaysPage = lazy(() => import('./pages/HolidaysPage').then((m) => ({ default: m.HolidaysPage })));
const AcademicYearsPage = lazy(() => import('./pages/AcademicYearsPage').then((m) => ({ default: m.AcademicYearsPage })));
const MonthlyReport = lazy(() => import('./pages/MonthlyReport').then((m) => ({ default: m.MonthlyReport })));
const StudentsAtRisk = lazy(() => import('./pages/StudentsAtRisk').then((m) => ({ default: m.StudentsAtRisk })));
const ImportExport = lazy(() => import('./pages/ImportExport').then((m) => ({ default: m.ImportExport })));
const UsersPage = lazy(() => import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const DatabaseViewerPage = lazy(() => import('./pages/DatabaseViewerPage').then((m) => ({ default: m.DatabaseViewerPage })));

const PageFallback: React.FC = () => (
  <div className="flex-1 min-h-screen flex items-center justify-center p-8 bg-surface-bg">
    <div className="flex items-center gap-3 text-brand-600 font-bold text-xs animate-pulse bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200">
      <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      <span>Opening...</span>
    </div>
  </div>
);

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-brand-400 font-bold text-xs animate-pulse bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Sirajul Huda Attendance System...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-bg">
      <PWAInstallPrompt />
      <div className="flex flex-1 overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 overflow-x-hidden flex flex-col pb-16 md:pb-0">
          <Suspense fallback={<PageFallback />}>
            {children}
          </Suspense>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AcademicProvider>
        <Router>
          <Suspense fallback={<PageFallback />}>
            <Routes>
            {/* Public Unauthenticated Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/portal" element={<PublicStudentPortal />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />

            <Route
              path="/classes"
              element={
                <ProtectedLayout>
                  <Classes />
                </ProtectedLayout>
              }
            />

            <Route
              path="/students"
              element={
                <ProtectedLayout>
                  <Students />
                </ProtectedLayout>
              }
            />

            <Route
              path="/subjects"
              element={
                <ProtectedLayout>
                  <Subjects />
                </ProtectedLayout>
              }
            />

            <Route
              path="/teachers"
              element={
                <ProtectedLayout>
                  <Teachers />
                </ProtectedLayout>
              }
            />

            <Route
              path="/class-assignments"
              element={
                <ProtectedLayout>
                  <ClassSubjectAssignments />
                </ProtectedLayout>
              }
            />

            <Route
              path="/mark-attendance"
              element={
                <ProtectedLayout>
                  <MarkAttendance />
                </ProtectedLayout>
              }
            />

            <Route
              path="/daily-attendance"
              element={
                <ProtectedLayout>
                  <MarkDailyAttendance />
                </ProtectedLayout>
              }
            />

            <Route
              path="/syllabus-log"
              element={
                <ProtectedLayout>
                  <SyllabusLogPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/holidays"
              element={
                <ProtectedLayout>
                  <HolidaysPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/academic-years"
              element={
                <ProtectedLayout>
                  <AcademicYearsPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/monthly-report"
              element={
                <ProtectedLayout>
                  <MonthlyReport />
                </ProtectedLayout>
              }
            />

            <Route
              path="/at-risk"
              element={
                <ProtectedLayout>
                  <StudentsAtRisk />
                </ProtectedLayout>
              }
            />

            <Route
              path="/import-export"
              element={
                <ProtectedLayout>
                  <ImportExport />
                </ProtectedLayout>
              }
            />

            <Route
              path="/database"
              element={
                <ProtectedLayout>
                  <DatabaseViewerPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedLayout>
                  <UsersPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedLayout>
                  <SettingsPage />
                </ProtectedLayout>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
      </AcademicProvider>
    </AuthProvider>
  );
};
