import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import "./Header.css";

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const getAccountSettingsPath = () => {
    const path = location.pathname;
    if (path.startsWith("/admin-portal")) return "/admin-portal/account-settings";
    if (path.startsWith("/admin")) return "/admin/account-settings";
    if (path.startsWith("/teamlead")) return "/teamlead/account-settings";
    return "/intern/account-settings";
  };

  const getNotificationsPath = () => {
    const path = location.pathname;
    if (path.startsWith("/admin-portal")) return "/admin-portal/notifications";
    if (path.startsWith("/admin")) return "/admin/notifications";
    if (path.startsWith("/teamlead")) return "/teamlead/notifications";
    return "/intern/notifications";
  };

  const openAccountSettings = () => {
    navigate(getAccountSettingsPath());
    setMenuOpen(false);
  };

  const openNotifications = () => {
    navigate(getNotificationsPath());
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="header">
      <button className="menu-btn" onClick={onMenuClick} type="button">&#9776;</button>
      <div className="header-center">
        <span className="header-date">{dateStr}</span>
      </div>
      <div className="header-right">
        <div className="header-time">{timeStr}</div>
        <button className="header-notification-btn" type="button" onClick={openNotifications} aria-label="Open notifications">
          <FiBell />
        </button>
        <div className="header-profile-menu" ref={menuRef}>
          <button
            className="header-user profile-trigger"
            onClick={() => setMenuOpen((prev) => !prev)}
            type="button"
          >
            <div className="user-avatar">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="user-avatar-image" />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
            </div>
          </button>
          {menuOpen && (
            <div className="profile-dropdown">
              <button type="button" onClick={openAccountSettings} className="profile-action">Account Settings</button>
              <button type="button" onClick={handleLogout} className="profile-action danger">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
