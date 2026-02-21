import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiUsers, FiCalendar, FiClock, FiClipboard } from "react-icons/fi";
import { attendanceService, leaveService } from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";
import "../intern/Pages.css";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];
const AXIS_TICK = { fontSize: 11, fill: "#5f6773" };
const TOOLTIP_STYLE = {
  background: "#ffffff",
  border: "1px solid #d7d0c3",
  borderRadius: "8px",
  color: "#23272f",
  boxShadow: "0 8px 18px rgba(47, 52, 63, 0.12)",
};

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([attendanceService.getAnalytics(), leaveService.getStats()])
      .then(([att, lv]) => { setAnalytics(att.data); setLeaveStats(lv.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="page-loading">Loading...</div></div>;
  if (!analytics) return null;

  const pieData = Object.entries(analytics.stats || {}).map(([name, value]) => ({ name, value }));
  const leaveData = leaveStats ? [
    { name: "Pending", value: leaveStats.pending },
    { name: "Approved", value: leaveStats.approved },
    { name: "Rejected", value: leaveStats.rejected },
  ] : [];

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/admin-portal/users" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/admin-portal/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/admin-portal/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        <NavLink to="/admin-portal/analytics" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Analytics</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Analytics Dashboard</h1>
        <p>Comprehensive attendance and leave insights</p>
      </div>
      
      <div className="stats-grid">
        {[
          { label: "Total Interns", value: analytics.totalUsers, icon: FiUsers },
          { label: "Total Records", value: analytics.totalRecords, icon: FiCalendar },
          { label: "Avg Hours/Day", value: `${analytics.avgHours}h`, icon: FiClock },
          { label: "Total Leaves", value: leaveStats?.total || 0, icon: FiClipboard },
        ].map(s => (
          <div key={s.label} className="today-card info-card">
            <div className="today-icon"><s.icon /></div>
            <div><div className="today-value">{s.value}</div><div className="today-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="dash-section">
          <h2 className="analytics-section-title">Daily Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.daily}>
              <CartesianGrid strokeDasharray="2 4" stroke="#d7d0c3" />
              <XAxis dataKey="date" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#2f343f" }} />
              <Bar dataKey="present" fill="#10b981" name="Present" radius={[8,8,0,0]} />
              <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-section">
          <h2 className="analytics-section-title">Attendance Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name, value}) => `${name}: ${value}`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dash-section">
          <h2 className="analytics-section-title">Leave Statistics</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={leaveData}>
              <XAxis dataKey="name" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[8,8,0,0]}>
                {leaveData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-section">
          <h2 className="analytics-section-title">Leave Summary</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {leaveData.map((l, i) => (
              <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS[i] }} />
                <span style={{ flex: 1, color: "#4b5565", fontSize: 14, fontWeight: 600 }}>{l.name}</span>
                <span style={{ fontWeight: 700, color: "#1f2937" }}>{l.value}</span>
                <span style={{ color: "#5f6773", fontSize: 12 }}>
                  {leaveStats?.total ? `${Math.round(l.value / leaveStats.total * 100)}%` : "0%"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
