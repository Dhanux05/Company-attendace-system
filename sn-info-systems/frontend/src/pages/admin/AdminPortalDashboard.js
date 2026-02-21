import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { userService, attendanceService, leaveService } from "../../services/api";
import "../intern/Pages.css";

const actions = [
  { to: "/admin-portal/users", label: "Manage Users", icon: "Users" },
  { to: "/admin-portal/teams", label: "Manage Teams", icon: "Teams" },
  { to: "/admin-portal/leaves", label: "Approve Leaves", icon: "Leaves" },
  { to: "/admin-portal/attendance", label: "Attendance", icon: "Attend" },
  { to: "/admin-portal/analytics", label: "Analytics", icon: "Stats" },
];

const AdminPortalDashboard = () => {
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
          users: users.data.filter((u) => u.isActive).length,
          teams: teams.data.length,
          leaves: leaves.data.pending,
          present: analytics.data.stats?.Present || 0,
          late: analytics.data.stats?.Late || 0,
          totalInterns: users.data.filter((u) => u.role === "intern" && u.isActive).length,
        });
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const cards = [
    { label: "Active Users", value: stats.users },
    { label: "Teams", value: stats.teams },
    { label: "Pending Leaves", value: stats.leaves },
    { label: "Present Today", value: stats.present },
    { label: "Total Interns", value: stats.totalInterns || 0 },
    { label: "Late Today", value: stats.late || 0 },
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
        <h1>Admin Portal</h1>
        <p>Dedicated control center for administration</p>
      </div>

      {loading ? (
        <div className="page-loading">Loading...</div>
      ) : (
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {cards.map((card) => (
            <div key={card.label} className="today-card info-card">
              <div>
                <div className="today-value">{card.value}</div>
                <div className="today-label">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="quick-actions" style={{ marginTop: 24 }}>
        <h2>Portal Actions</h2>
        <div className="actions-grid">
          {actions.map((action) => (
            <a key={action.to} href={action.to} className="action-btn action-secondary">
              <span>{action.icon}</span>
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPortalDashboard;
