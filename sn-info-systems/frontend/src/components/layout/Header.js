import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/api";
import "./Header.css";

const Header = ({ onMenuClick }) => {
  const { user, logout, updateUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const menuRef = useRef(null);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    setName(user?.name || "");
  }, [user]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const openEditProfile = () => {
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setName(user?.name || "");
    setEditOpen(true);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
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
            <label htmlFor="profileName">Name</label>
            <input
              id="profileName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />

            <div className="form-section-title">Change Password</div>
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
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
      <header className="header">
        <button className="menu-btn" onClick={onMenuClick} type="button">&#9776;</button>
        <div className="header-center">
          <span className="header-date">{dateStr}</span>
        </div>
        <div className="header-right">
          <div className="header-time">{timeStr}</div>
          <div className="header-profile-menu" ref={menuRef}>
            <button
              className="header-user profile-trigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              type="button"
            >
              <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
              </div>
            </button>
            {menuOpen && (
              <div className="profile-dropdown">
                <button type="button" onClick={openEditProfile} className="profile-action">Edit Profile</button>
                <button type="button" onClick={handleLogout} className="profile-action danger">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>
      {profileModal}
    </>
  );
};

export default Header;
