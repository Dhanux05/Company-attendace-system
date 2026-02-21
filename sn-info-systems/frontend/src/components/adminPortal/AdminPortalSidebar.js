import React, { useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { FiHome, FiUsers, FiBriefcase, FiClipboard, FiCalendar, FiBarChart2, FiUser, FiLogOut } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/api";
import CompanyLogo from "../common/CompanyLogo";
import "./AdminPortalSidebar.css";

const links = [
  { to: "/admin-portal/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/admin-portal/users", label: "Users", icon: FiUsers },
  { to: "/admin-portal/teams", label: "Teams", icon: FiBriefcase },
  { to: "/admin-portal/leaves", label: "Leaves", icon: FiClipboard },
  { to: "/admin-portal/attendance", label: "Attendance", icon: FiCalendar },
  { to: "/admin-portal/analytics", label: "Analytics", icon: FiBarChart2 },
];

const AdminPortalSidebar = ({ open, onNavigate }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

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
            <label htmlFor="adminSidebarProfileName">Name</label>
            <input
              id="adminSidebarProfileName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />

            <div className="form-section-title">Change Password</div>
            <label htmlFor="adminSidebarCurrentPassword">Current Password</label>
            <input
              id="adminSidebarCurrentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />
            <label htmlFor="adminSidebarNewPassword">New Password</label>
            <input
              id="adminSidebarNewPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <label htmlFor="adminSidebarConfirmPassword">Confirm Password</label>
            <input
              id="adminSidebarConfirmPassword"
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
      <aside className={`admin-portal-sidebar ${open ? "open" : "collapsed"}`}>
        <div className="admin-portal-brand">
          <CompanyLogo size="sm" compact={!open} animate />
          {open && (
            <div className="admin-portal-brand-text">
              <span className="admin-portal-title">Admin Portal</span>
              <span className="admin-portal-subtitle">SN Info Systems</span>
            </div>
          )}
        </div>

        <nav className="admin-portal-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onNavigate}
              className={({ isActive }) => `admin-portal-link ${isActive ? "active" : ""}`}
            >
              <span className="admin-portal-link-icon"><link.icon /></span>
              {open && <span className="admin-portal-link-label">{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-portal-footer">
          <button type="button" className="admin-portal-user admin-portal-link" onClick={openEditProfile}>
            <span className="admin-portal-link-icon"><FiUser /></span>
            {open && (
              <div className="admin-portal-user-text">
                <span className="admin-portal-user-name">{user?.name}</span>
                <span className="admin-portal-user-role">{user?.role}</span>
              </div>
            )}
          </button>
          <button
            className="admin-portal-link admin-portal-logout"
            onClick={() => {
              logout();
              onNavigate?.();
              navigate("/login");
            }}
          >
            <span className="admin-portal-link-icon"><FiLogOut /></span>
            {open && <span className="admin-portal-link-label">Logout</span>}
          </button>
        </div>
      </aside>
      {profileModal}
    </>
  );
};

export default AdminPortalSidebar;
