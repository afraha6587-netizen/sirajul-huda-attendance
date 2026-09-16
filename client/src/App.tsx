import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AcademicProvider } from './context/AcademicContext';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

import { Login } from './pages/Login';
import { PublicStudentPortal } from './pages/PublicStudentPortal';
import { Dashboard } from './pages/Dashboard';
import { Classes } from './pages/Classes';
import { Students } from './pages/Students';
import { Subjects } from './pages/Subjects';
import { Teachers } from './pages/Teachers';
import { ClassSubjectAssignments } from './pages/ClassSubjectAssignments';
import { MarkAttendance } from './pages/MarkAttendance';
import { MarkDailyAttendance } from './pages/MarkDailyAttendance';
import { SyllabusLogPage } from './pages/SyllabusLogPage';
import { HolidaysPage } from './pages/HolidaysPage';
import { AcademicYearsPage } from './pages/AcademicYearsPage';
import { MonthlyReport } from './pages/MonthlyReport';
import { StudentsAtRisk } from './pages/StudentsAtRisk';
import { ImportExport } from './pages/ImportExport';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { DatabaseViewerPage } from './pages/DatabaseViewerPage';

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
        <div className="flex-1 overflow-x-hidden flex flex-col pb-16 md:pb-0">{children}</div>
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
        </Router>
      </AcademicProvider>
    </AuthProvider>
  );
};
