import React, { useMemo, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiUsers, FiBriefcase, FiClipboard, FiCheckCircle, FiClock, FiUser, FiMapPin } from "react-icons/fi";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { userService, attendanceService, leaveService } from "../../services/api";
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

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, teams: 0, leaves: 0, present: 0 });
  const [leaveStats, setLeaveStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({});
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
        setAttendanceStats(analytics.data.stats || {});
        setLeaveStats(leaves.data);
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
        <h2>Quick Navigation</h2>
        <div className="actions-grid">
          {[
            { to: "/admin/users", icon: FiUser, label: "Manage Users" },
            { to: "/admin/teams", icon: FiBriefcase, label: "Manage Teams" },
            { to: "/admin/leaves", icon: FiClipboard, label: "Leave Approvals" },
            { to: "/admin/attendance", icon: FiMapPin, label: "View Attendance" },
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

