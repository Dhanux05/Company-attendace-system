import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiHome, FiUsers, FiBriefcase, FiClipboard, FiCalendar, FiUser, FiLogOut, FiShield, FiFileText, FiBell } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import CompanyLogo from "../common/CompanyLogo";
import "./AdminPortalSidebar.css";

const links = [
  { to: "/admin-portal/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/admin-portal/users", label: "Users", icon: FiUsers },
  { to: "/admin-portal/teams", label: "Teams", icon: FiBriefcase },
  { to: "/admin-portal/leaves", label: "Leaves", icon: FiClipboard },
  { to: "/admin-portal/attendance", label: "Attendance", icon: FiCalendar },
  { to: "/admin-portal/audit", label: "Audit Logs", icon: FiShield },
  { to: "/admin-portal/reports", label: "Reports", icon: FiFileText },
  { to: "/admin-portal/notifications", label: "Notifications", icon: FiBell },
];

const AdminPortalSidebar = ({ open, onNavigate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const openAccountSettings = () => {
    onNavigate?.();
    navigate("/admin-portal/account-settings");
  };

  return (
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
        <button type="button" className="admin-portal-user admin-portal-link" onClick={openAccountSettings}>
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
  );
};

export default AdminPortalSidebar;
