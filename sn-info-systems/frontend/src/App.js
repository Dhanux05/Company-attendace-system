import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TwoFactorVerify from "./pages/TwoFactorVerify";
import AccountSettings from "./pages/AccountSettings";
import Notifications from "./pages/Notifications";
import Layout from "./components/layout/Layout";
import AdminPortalLayout from "./components/adminPortal/AdminPortalLayout";

// Intern pages
import InternDashboard from "./pages/intern/Dashboard";
import MarkAttendance from "./pages/intern/MarkAttendance";
import LeaveApplication from "./pages/intern/LeaveApplication";
import AttendanceHistory from "./pages/intern/AttendanceHistory";
import LeaveHistory from "./pages/intern/LeaveHistory";

// Teamlead pages
import TeamAttendance from "./pages/teamlead/TeamAttendance";
import LeaveApproval from "./pages/teamlead/LeaveApproval";
import TeamMembers from "./pages/teamlead/TeamMembers";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageTeams from "./pages/admin/ManageTeams";
import FullAttendance from "./pages/admin/FullAttendance";
import AdminPortalDashboard from "./pages/admin/AdminPortalDashboard";
import AdminLeaveManagement from "./pages/admin/AdminLeaveManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import Reports from "./pages/admin/Reports";

const HOME_BY_ROLE = {
  admin: "/admin/dashboard",
  teamlead: "/intern/dashboard",
  intern: "/intern/dashboard",
};

const getHomePath = (user) => {
  if (!user) return "/login";
  return HOME_BY_ROLE[user.role] || "/login";
};

const ProtectedRoute = ({ children, roles }) => {
  const { user, authReady } = useAuth();
  if (!authReady) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={getHomePath(user)} replace />;
  return children;
};

const HomeRedirect = () => {
  const { user, authReady } = useAuth();
  if (!authReady) return null;
  return <Navigate to={getHomePath(user)} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/2fa" element={<TwoFactorVerify />} />

          {/* Intern Routes */}
          <Route
            path="/intern"
            element={
              <ProtectedRoute roles={["intern", "teamlead", "admin"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<InternDashboard />} />
            <Route path="attendance" element={<MarkAttendance />} />
            <Route path="leave" element={<LeaveApplication />} />
            <Route path="attendance-history" element={<AttendanceHistory />} />
            <Route path="leave-history" element={<LeaveHistory />} />
            <Route path="account-settings" element={<AccountSettings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Teamlead Routes */}
          <Route
            path="/teamlead"
            element={
              <ProtectedRoute roles={["teamlead", "admin"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="members" element={<TeamMembers />} />
            <Route path="attendance" element={<TeamAttendance />} />
            <Route path="leaves" element={<LeaveApproval />} />
            <Route path="analytics" element={<Navigate to="/intern/dashboard" replace />} />
            <Route path="account-settings" element={<AccountSettings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Existing Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="teams" element={<ManageTeams />} />
            <Route path="leaves" element={<AdminLeaveManagement />} />
            <Route path="attendance" element={<FullAttendance />} />
            <Route path="analytics" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="account-settings" element={<AccountSettings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Separate Admin Portal */}
          <Route
            path="/admin-portal"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminPortalLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminPortalDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="teams" element={<ManageTeams />} />
            <Route path="leaves" element={<AdminLeaveManagement />} />
            <Route path="attendance" element={<FullAttendance />} />
            <Route path="analytics" element={<Navigate to="/admin-portal/dashboard" replace />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="account-settings" element={<AccountSettings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

