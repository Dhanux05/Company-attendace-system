import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiUsers, FiBriefcase, FiClipboard, FiCheckCircle, FiClock, FiUser, FiBarChart2, FiMapPin } from "react-icons/fi";
import { userService, attendanceService, leaveService } from "../../services/api";
import "../intern/Pages.css";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, teams: 0, leaves: 0, present: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, teams, leaves, analytics] = await Promise.all([
          userService.getAll(),
          userService.getTeams(),
          leaveService.getStats(),
          attendanceService.getAnalytics(),
        ]);
        setStats({
          users: users.data.filter(u => u.isActive).length,
          teams: teams.data.length,
          leaves: leaves.data.pending,
          present: analytics.data.stats?.Present || 0,
          late: analytics.data.stats?.Late || 0,
          totalInterns: users.data.filter(u => u.role === "intern" && u.isActive).length,
        });
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: "Active Users", value: stats.users, icon: FiUser, color: "blue" },
    { label: "Teams", value: stats.teams, icon: FiBriefcase, color: "purple" },
    { label: "Pending Leaves", value: stats.leaves, icon: FiClipboard, color: "yellow" },
    { label: "Present Today", value: stats.present, icon: FiCheckCircle, color: "green" },
    { label: "Total Interns", value: stats.totalInterns, icon: FiUsers, color: "blue" },
    { label: "Late Today", value: stats.late || 0, icon: FiClock, color: "yellow" },
  ];

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/admin-portal/users" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/admin-portal/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/admin-portal/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        <NavLink to="/admin-portal/analytics" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Analytics</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Admin Dashboard</h1>
        <p>System overview and management</p>
      </div>
      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {cards.map(c => (
            <div key={c.label} className={`today-card card-${c.color}`}>
              <div className="today-icon"><c.icon /></div>
              <div><div className="today-value">{c.value}</div><div className="today-label">{c.label}</div></div>
            </div>
          ))}
        </div>
      )}
      <div className="quick-actions" style={{ marginTop: 24 }}>
        <h2>Quick Navigation</h2>
        <div className="actions-grid">
          {[
            { to: "/admin/users", icon: FiUser, label: "Manage Users" },
            { to: "/admin/teams", icon: FiBriefcase, label: "Manage Teams" },
            { to: "/admin/leaves", icon: FiClipboard, label: "Leave Approvals" },
            { to: "/admin/attendance", icon: FiMapPin, label: "View Attendance" },
            { to: "/admin/analytics", icon: FiBarChart2, label: "Analytics" },
          ].map(a => (
            <a key={a.to} href={a.to} className="action-btn action-secondary">
              <a.icon className="action-icon" /> {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

