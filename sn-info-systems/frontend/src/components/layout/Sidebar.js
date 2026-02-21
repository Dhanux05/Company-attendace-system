import React, { useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiCalendar,
  FiClipboard,
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiBarChart2,
  FiBriefcase,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/api";
import CompanyLogo from "../common/CompanyLogo";
import "./Sidebar.css";

const ICONS = {
  dashboard: FiHome,
  attendance: FiCalendar,
  leave: FiClipboard,
  history: FiClock,
  team: FiUsers,
  approve: FiCheckCircle,
  analytics: FiBarChart2,
  users: FiUsers,
  teams: FiBriefcase,
  logout: FiLogOut,
};

const navConfig = {
  intern: [
    { to: "/intern/dashboard", label: "Dashboard", icon: ICONS.dashboard },
    { to: "/intern/attendance", label: "Mark Attendance", icon: ICONS.attendance },
    { to: "/intern/leave", label: "Apply Leave", icon: ICONS.leave },
    { to: "/intern/attendance-history", label: "My Attendance", icon: ICONS.history },
    { to: "/intern/leave-history", label: "My Leaves", icon: ICONS.approve },
  ],
  teamlead: [
    { to: "/intern/dashboard", label: "My Dashboard", icon: ICONS.dashboard },
    { to: "/intern/attendance", label: "Mark Attendance", icon: ICONS.attendance },
    { to: "/teamlead/members", label: "Team Members", icon: ICONS.team },
    { to: "/teamlead/attendance", label: "Team Attendance", icon: ICONS.team },
    { to: "/teamlead/leaves", label: "Leave Approvals", icon: ICONS.approve },
    { to: "/teamlead/analytics", label: "Team Analytics", icon: ICONS.analytics },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: ICONS.dashboard },
    { to: "/admin/users", label: "Manage Users", icon: ICONS.users },
    { to: "/admin/teams", label: "Manage Teams", icon: ICONS.teams },
    { to: "/admin/leaves", label: "Leave Approvals", icon: ICONS.approve },
    { to: "/admin/attendance", label: "All Attendance", icon: ICONS.attendance },
    { to: "/admin/analytics", label: "Analytics", icon: ICONS.analytics },
  ],
};

const Sidebar = ({ open, onNavigate }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const links = navConfig[user?.role] || navConfig.intern;

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const openEditProfile = () => {
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setName(user?.name || "");
    setEditOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmPassword);

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("Fill all password fields to change password.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirm password do not match.");
        return;
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }
    }

    setSaving(true);
    try {
      const { data } = await authService.updateProfile({ name: trimmedName });
      updateUser(data);

      if (wantsPasswordChange) {
        await authService.changePassword({ currentPassword, newPassword });
      }

      setSuccess("Profile updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const profileModal = editOpen && typeof document !== "undefined"
    ? createPortal(
      <div className="profile-modal-backdrop" onClick={() => setEditOpen(false)}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <h3>Edit Profile</h3>
          <form onSubmit={handleSaveProfile}>
            <label htmlFor="sidebarProfileName">Name</label>
            <input
              id="sidebarProfileName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />

            <div className="form-section-title">Change Password</div>
            <label htmlFor="sidebarCurrentPassword">Current Password</label>
            <input
              id="sidebarCurrentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />
            <label htmlFor="sidebarNewPassword">New Password</label>
            <input
              id="sidebarNewPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <label htmlFor="sidebarConfirmPassword">Confirm Password</label>
            <input
              id="sidebarConfirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />

            {error && <div className="profile-form-error">{error}</div>}
            {success && <div className="profile-form-success">{success}</div>}

            <div className="profile-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setEditOpen(false)}>Cancel</button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <>
      <aside className={`sidebar ${open ? "open" : "collapsed"}`}>
        <div className="sidebar-brand">
          <CompanyLogo size="sm" compact={!open} animate />
          {open && (
            <div className="brand-text">
              <span className="brand-title">SN Info Systems</span>
              <span className="brand-sub">Smart Attendance</span>
            </div>
          )}
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onNavigate}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon"><link.icon /></span>
              {open && <span className="nav-label">{link.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="nav-item user-item" onClick={openEditProfile}>
            <span className="nav-icon"><FiUser /></span>
            {open && (
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            )}
          </button>
          <button
            className="nav-item logout-btn"
            onClick={() => {
              logout();
              onNavigate?.();
              navigate("/login");
            }}
          >
            <span className="nav-icon"><FiLogOut /></span>
            {open && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>
      {profileModal}
    </>
  );
};

export default Sidebar;
