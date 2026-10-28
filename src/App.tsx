import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';

import { Sidebar } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';

import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { Employees } from './pages/Employees.js';
import { AttendancePage } from './pages/Attendance.js';
import { Leaves } from './pages/Leaves.js';
import { AnnouncementsPage } from './pages/Announcements.js';
import { TrainingPage } from './pages/Training.js';
import { ReportsPage } from './pages/Reports.js';
import { ProfilePage } from './pages/Profile.js';
import { NotFound } from './pages/NotFound.js';

// Route Guard for authenticated sessions
const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-400 border-t-white rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold tracking-tight">StaffSync HRMS</h2>
        <p className="text-xs text-slate-400 mt-1">Initializing secure session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onMobileMenuToggle={() => setMobileOpen(true)}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Role-based route guard
const RoleGuard: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({
  allowedRoles,
  children
}) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Login Route Guard: if logged in, bounce to dashboard
const PublicLoginRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public authentication */}
            <Route path="/login" element={<PublicLoginRoute />} />

            {/* Authenticated Workspace */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route
                path="/reports"
                element={
                  <RoleGuard allowedRoles={['HR', 'Manager']}>
                    <ReportsPage />
                  </RoleGuard>
                }
              />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Redirection and 404 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
