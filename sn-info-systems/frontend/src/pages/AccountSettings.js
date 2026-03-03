import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/api";
import "./AccountSettings.css";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(user || null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [initialPhoto, setInitialPhoto] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const photoInputRef = useRef(null);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setPhotoPreview(user?.profilePhoto || "");
    setInitialPhoto(user?.profilePhoto || "");
    setProfileData(user || null);
  }, [user]);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { data } = await authService.getMe();
        setProfileData(data);
        setName(data?.name || "");
        setEmail(data?.email || "");
        setPhone(data?.phone || "");
        setInitialPhoto(data?.profilePhoto || "");
      } catch (err) {}
    };
    loadProfileData();
  }, []);

  const triggerPhotoSelect = () => {
    if (photoInputRef.current) photoInputRef.current.click();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPhotoPreview(result);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview("");
    setError("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmPassword);

    if (!trimmedName) {
      setError("Username is required.");
      return;
    }
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
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
      const payload = { name: trimmedName, email: trimmedEmail, phone: phone.trim() };
      if ((photoPreview || "") !== (initialPhoto || "")) {
        payload.profilePhoto = photoPreview || "";
      }
      const { data } = await authService.updateProfile(payload);
      updateUser(data);
      setProfileData((prev) => ({ ...(prev || {}), ...data }));
      setInitialPhoto(data?.profilePhoto || "");

      if (wantsPasswordChange) {
        await authService.changePassword({ currentPassword, newPassword });
      }

      setSuccess("Account settings updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update account settings.");
    } finally {
      setSaving(false);
    }
  };

  const profile = profileData || user || {};
  const userInitial = profile?.name?.charAt(0)?.toUpperCase() || "U";
  const joinDate = profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : "-";
  const teamName =
    typeof profile?.team === "string" ? profile.team : (profile?.team?.name || "-");

  return (
    <div className="account-settings-page">
      <div className="account-settings-topbar">
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
      <div className="account-settings-header">
        <h1>Account Settings</h1>
        <p>Manage your official profile details, profile photo, and password.</p>
      </div>

      <div className="account-settings-grid">
        <aside className="profile-summary-card">
          <div className="profile-summary-top">
            <div className="summary-avatar">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="summary-avatar-image" />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <div className="summary-main">
              <h2>{profile?.name || "User"}</h2>
              <p>{profile?.email || "-"}</p>
              <span className={`summary-role summary-role-${profile?.role}`}>{profile?.role || "member"}</span>
            </div>
          </div>

          <div className="summary-details">
            <div className="summary-item">
              <span className="summary-label">Phone</span>
              <input
                type="text"
                className="summary-inline-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="summary-item">
              <span className="summary-label">Team</span>
              <span className="summary-value">{teamName}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Joined</span>
              <span className="summary-value">{joinDate}</span>
            </div>
          </div>
        </aside>

        <section className="settings-form-card">
          <form onSubmit={handleSave}>
            <div className="section-title">Profile Photo</div>
            <div className="photo-row">
              <div className="summary-avatar small">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="summary-avatar-image" />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              <div className="photo-copy">
                <div className="photo-title">Professional round avatar</div>
                <div className="photo-subtitle">Use a clear front-facing photo for official profile view.</div>
              </div>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden-photo-input"
              onChange={handlePhotoChange}
            />
            <div className="photo-buttons">
              <button type="button" className="btn-outline-dark" onClick={triggerPhotoSelect}>Change Profile Picture</button>
              <button type="button" className="btn-danger-soft" onClick={handleRemovePhoto}>Remove Photo</button>
            </div>

            <div className="section-title spaced">Profile Information</div>
            <label htmlFor="accUsername">Change Username</label>
            <input
              id="accUsername"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter updated username"
            />

            <label htmlFor="accEmail">Official Email</label>
            <input
              id="accEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter updated email"
            />

            <label htmlFor="accPhone">Phone</label>
            <input
              id="accPhone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />

            <div className="section-title spaced">Change Password</div>
            <label htmlFor="accCurrentPassword">Confirm Current Password field</label>
            <input
              id="accCurrentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />
            <label htmlFor="accNewPassword">New Password</label>
            <input
              id="accNewPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <small style={{ color: "#96accd", display: "block", marginTop: 6 }}>
              Password requirements: at least 8 characters, with uppercase, lowercase, number, and special character.
            </small>
            <label htmlFor="accConfirmPassword">Confirm New Password</label>
            <input
              id="accConfirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />

            {error && <div className="account-error">{error}</div>}
            {success && <div className="account-success">{success}</div>}

            <div className="form-actions">
              <button type="submit" className="btn-save-main" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AccountSettings;
