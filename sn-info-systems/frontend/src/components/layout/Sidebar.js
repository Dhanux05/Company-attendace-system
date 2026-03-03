import React from "react";
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
  FiBell,
  FiFileText,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
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
  notifications: FiBell,
  reports: FiFileText,
  audit: FiShield,
};

const navConfig = {
  intern: [
    { to: "/intern/dashboard", label: "Dashboard", icon: ICONS.dashboard },
    { to: "/intern/attendance", label: "Mark Attendance", icon: ICONS.attendance },
    { to: "/intern/leave", label: "Apply Leave", icon: ICONS.leave },
    { to: "/intern/attendance-history", label: "My Attendance", icon: ICONS.history },
    { to: "/intern/leave-history", label: "My Leaves", icon: ICONS.approve },
    { to: "/intern/notifications", label: "Notifications", icon: ICONS.notifications },
  ],
  teamlead: [
    { to: "/intern/dashboard", label: "My Dashboard", icon: ICONS.dashboard },
    { to: "/intern/attendance", label: "Mark Attendance", icon: ICONS.attendance },
    { to: "/teamlead/members", label: "Team Members", icon: ICONS.team },
    { to: "/teamlead/attendance", label: "Team Attendance", icon: ICONS.team },
    { to: "/teamlead/leaves", label: "Leave Approvals", icon: ICONS.approve },
    { to: "/teamlead/notifications", label: "Notifications", icon: ICONS.notifications },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: ICONS.dashboard },
    { to: "/admin/users", label: "Manage Users", icon: ICONS.users },
    { to: "/admin/teams", label: "Manage Teams", icon: ICONS.teams },
    { to: "/admin/leaves", label: "Leave Approvals", icon: ICONS.approve },
    { to: "/admin/attendance", label: "All Attendance", icon: ICONS.attendance },
    { to: "/admin/audit", label: "Audit Logs", icon: ICONS.audit },
    { to: "/admin/reports", label: "Reports", icon: ICONS.reports },
    { to: "/admin/notifications", label: "Notifications", icon: ICONS.notifications },
  ],
};

const Sidebar = ({ open, onNavigate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navConfig[user?.role] || navConfig.intern;

  const openAccountSettings = () => {
    const target = user?.role === "admin" ? "/admin/account-settings" : user?.role === "teamlead" ? "/teamlead/account-settings" : "/intern/account-settings";
    onNavigate?.();
    navigate(target);
  };

  return (
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
        <button type="button" className="nav-item user-item" onClick={openAccountSettings}>
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
  );
};

export default Sidebar;
