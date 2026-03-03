import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { attendanceService, leaveService, auditService } from "../../services/api";
import { getTeams, getUsers } from "../../services/adminDataStore";
import "../intern/Pages.css";
import "./AnalyticsDashboard.css";

const STATUS_COLORS = {
  Present: "#10b981",
  Late: "#f59e0b",
  "Half Day": "#3b82f6",
  Absent: "#ef4444",
};

const LEAVE_COLORS = {
  Pending: "#0ea5e9",
  Approved: "#10b981",
  Rejected: "#ef4444",
};

const TOOLTIP_STYLE = {
  background: "rgba(9, 16, 31, 0.96)",
  border: "1px solid rgba(159, 180, 213, 0.35)",
  borderRadius: "10px",
  color: "#f8fafc",
  boxShadow: "0 18px 36px rgba(5, 9, 18, 0.48)",
};
const TOOLTIP_LABEL_STYLE = { color: "#f8fafc", fontWeight: 700 };
const TOOLTIP_ITEM_STYLE = { color: "#e2e8f0", fontWeight: 600 };

const renderSliceLabel = ({ value, x, y, percent }) => {
  if (!value || percent < 0.08) return null;
  return (
    <text x={x} y={y} fill="#f8fafc" fontSize={12} fontWeight={700} textAnchor="middle" dominantBaseline="central">
      {`${value}`}
    </text>
  );
};

const CustomDonutCenter = ({ title, value }) => (
  <div className="donut-center">
    <div className="donut-center-value">{value}</div>
    <div className="donut-center-label">{title}</div>
  </div>
);

const actions = [
  { to: "/admin-portal/users", label: "Manage Users", icon: "Users" },
  { to: "/admin-portal/teams", label: "Manage Teams", icon: "Teams" },
  { to: "/admin-portal/leaves", label: "Approve Leaves", icon: "Leaves" },
  { to: "/admin-portal/attendance", label: "Attendance", icon: "Attend" },
  { to: "/admin-portal/audit", label: "Audit Logs", icon: "Audit" },
  { to: "/admin-portal/reports", label: "Reports", icon: "Reports" },
  { to: "/admin-portal/notifications", label: "Notifications", icon: "Bell" },
];

const AdminPortalDashboard = () => {
  const [stats, setStats] = useState({ users: 0, teams: 0, leaves: 0, present: 0 });
  const [timeline, setTimeline] = useState([]);
  const [leaveStats, setLeaveStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, teams, leaves, analytics, todayTimeline] = await Promise.all([
          getUsers(),
          getTeams(),
          leaveService.getStats(),
          attendanceService.getAnalytics(),
          auditService.getTodayTimeline(),
        ]);

        setStats({
          users: users.filter((u) => u.isActive).length,
          teams: teams.length,
          leaves: leaves.data.pending,
          present: analytics.data.stats?.Present || 0,
          late: analytics.data.stats?.Late || 0,
          totalInterns: users.filter((u) => u.role === "intern" && u.isActive).length,
        });
        setAttendanceStats(analytics.data.stats || {});
        setLeaveStats(leaves.data);
        setTimeline(todayTimeline.data || []);
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

  const statusData = useMemo(() => {
    const ordered = ["Present", "Late", "Half Day", "Absent"];
    return ordered.map((key) => ({
      name: key,
      value: Number(attendanceStats[key] || 0),
      color: STATUS_COLORS[key],
    }));
  }, [attendanceStats]);

  const leaveData = useMemo(() => {
    if (!leaveStats) return [];
    return [
      { name: "Pending", value: Number(leaveStats.pending || 0), color: LEAVE_COLORS.Pending },
      { name: "Approved", value: Number(leaveStats.approved || 0), color: LEAVE_COLORS.Approved },
      { name: "Rejected", value: Number(leaveStats.rejected || 0), color: LEAVE_COLORS.Rejected },
    ];
  }, [leaveStats]);

  const statusTotal = statusData.reduce((sum, item) => sum + item.value, 0);
  const leaveTotal = leaveData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/admin-portal/users" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/admin-portal/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/admin-portal/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
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

      <div className="analytics-mid-heading">Analytics</div>
      <div className="analytics-panels" style={{ marginTop: 20 }}>
        <section className="analytics-panel panel-donut">
          <div className="panel-head">
            <h2 className="analytics-section-title">Attendance Status Breakdown</h2>
            <span className="panel-badge">Pie Graph</span>
          </div>
          <div className="donut-wrap">
            <div className="donut-chart-shell">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={2}
                    label={renderSliceLabel}
                    labelLine={false}
                  >
                    {statusData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <CustomDonutCenter title="Total" value={statusTotal} />
            </div>
            <div className="donut-legend-list">
              {statusData.map((item) => (
                <div key={item.name} className="legend-row">
                  <span className="legend-dot" style={{ background: item.color }} />
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="analytics-panel panel-donut">
          <div className="panel-head">
            <h2 className="analytics-section-title">Leave Distribution</h2>
            <span className="panel-badge">Pie Graph</span>
          </div>
          <div className="donut-wrap">
            <div className="donut-chart-shell">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={leaveData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={2}
                    label={renderSliceLabel}
                    labelLine={false}
                  >
                    {leaveData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <CustomDonutCenter title="Leaves" value={leaveTotal} />
            </div>
            <div className="donut-legend-list">
              {leaveData.map((item) => (
                <div key={item.name} className="legend-row">
                  <span className="legend-dot" style={{ background: item.color }} />
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="analytics-panel panel-summary">
          <div className="panel-head">
            <h2 className="analytics-section-title">Leave Summary</h2>
            <span className="panel-badge">Bar Graph</span>
          </div>
          <div className="summary-bars">
            {leaveData.map((item) => {
              const pct = leaveTotal ? Math.round((item.value / leaveTotal) * 100) : 0;
              return (
                <div key={item.name} className="summary-row">
                  <div className="summary-row-top">
                    <div className="summary-title-wrap">
                      <span className="legend-dot" style={{ background: item.color }} />
                      <span className="summary-title">{item.name}</span>
                    </div>
                    <div className="summary-metrics">
                      <span className="summary-count">{item.value}</span>
                      <span className="summary-pct">{pct}%</span>
                    </div>
                  </div>
                  <div className="summary-track">
                    <div className="summary-fill" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

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

      <div className="page-card" style={{ marginTop: 20 }}>
        <div className="section-header">
          <h2>Today's Actions Timeline</h2>
        </div>
        {!timeline.length ? (
          <div className="empty-state">No actions logged today</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {timeline.slice(0, 12).map((item) => (
              <div key={item._id} style={{ border: "1px solid rgba(148,163,184,0.24)", borderRadius: 10, padding: 10, background: "rgba(15,23,42,0.4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ color: "#f8fafc", fontWeight: 700 }}>{item.module} / {item.action}</div>
                  <div style={{ color: "#94a3b8", fontSize: 11 }}>{new Date(item.createdAt).toLocaleTimeString()}</div>
                </div>
                <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4 }}>{item.message || "Action recorded"}</div>
                <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>By {item.actor?.name || "Unknown"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortalDashboard;
