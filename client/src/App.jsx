import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/Toaster';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import AuditorLayout from './layouts/AuditorLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminBuildings from './pages/admin/Buildings';
import AdminRooms from './pages/admin/Rooms';
import AdminChecklists from './pages/admin/Checklists';
import AdminAssignments from './pages/admin/Assignments';
import AdminReports from './pages/admin/Reports';

import AuditorDashboard from './pages/auditor/Dashboard';
import AuditorAuditHistory from './pages/auditor/AuditHistory';
import AuditorAuditSession from './pages/auditor/AuditSession';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <TooltipProvider delayDuration={150}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

          {/* Admin Dashboard Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="buildings" element={<AdminBuildings />} />
            <Route path="rooms" element={<AdminRooms />} />
            <Route path="checklists" element={<AdminChecklists />} />
            <Route path="assignments" element={<AdminAssignments />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>

          {/* Auditor Workspace Protected Routes */}
          <Route
            path="/auditor"
            element={
              <ProtectedRoute allowedRoles={['Auditor']}>
                <AuditorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AuditorDashboard />} />
            <Route path="history" element={<AuditorAuditHistory />} />
            <Route path="audits/:id" element={<AuditorAuditSession />} />
          </Route>

          {/* Fallback Redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
