import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiUsers, FiCheckCircle, FiClock } from "react-icons/fi";
import { attendanceService, leaveService } from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import "../intern/Pages.css";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"];
const AXIS_TICK = { fontSize: 11, fill: "#5f6773" };
const TOOLTIP_STYLE = {
  background: "#ffffff",
  border: "1px solid #d7d0c3",
  borderRadius: "8px",
  color: "#23272f",
  boxShadow: "0 8px 18px rgba(47, 52, 63, 0.12)",
};

const TeamAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService.getAnalytics().then(({ data }) => { setAnalytics(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="page-loading">Loading...</div></div>;
  if (!analytics) return <div className="page"><div className="empty-state">No data</div></div>;

  const pieData = Object.entries(analytics.stats || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/teamlead/members" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/teamlead/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/teamlead/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        <NavLink to="/teamlead/analytics" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Analytics</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Team Analytics</h1>
        <p>This month's team performance overview</p>
      </div>

      <div className="stats-grid">
        {[
          { label: "Total Members", value: analytics.totalUsers, icon: FiUsers },
          { label: "Present", value: analytics.stats?.Present || 0, icon: FiCheckCircle },
          { label: "Late", value: analytics.stats?.Late || 0, icon: FiClock },
          { label: "Avg Hours/Day", value: `${analytics.avgHours}h`, icon: FiClock },
        ].map(s => (
          <div key={s.label} className="today-card info-card">
            <div className="today-icon"><s.icon /></div>
            <div><div className="today-label">{s.label}</div><div className="today-value">{s.value}</div></div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dash-section">
          <h2 className="analytics-section-title">Daily Attendance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.daily}>
              <XAxis dataKey="date" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="present" fill="#10b981" name="Present" radius={[8,8,0,0]} />
              <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-section">
          <h2 className="analytics-section-title">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalytics;
