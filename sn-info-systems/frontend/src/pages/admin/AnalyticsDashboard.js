import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiUsers, FiCalendar, FiClock, FiClipboard } from "react-icons/fi";
import { attendanceService, leaveService, reportService } from "../../services/api";
import { getActiveUsers, getTeams } from "../../services/adminDataStore";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
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

const AXIS_TICK = { fontSize: 11, fill: "#9fb4d5" };
const TOOLTIP_STYLE = {
  background: "rgba(9, 16, 31, 0.96)",
  border: "1px solid rgba(159, 180, 213, 0.35)",
  borderRadius: "10px",
  color: "#f8fafc",
  boxShadow: "0 18px 36px rgba(5, 9, 18, 0.48)",
};
const TOOLTIP_LABEL_STYLE = { color: "#f8fafc", fontWeight: 700 };
const TOOLTIP_ITEM_STYLE = { color: "#e2e8f0", fontWeight: 600 };

const renderSliceLabel = ({ name, value, x, y, percent }) => {
  if (!value || percent < 0.08) return null;
  return (
    <text x={x} y={y} fill="#f8fafc" fontSize={12} fontWeight={700} textAnchor="middle" dominantBaseline="central">
      {`${name}: ${value}`}
    </text>
  );
};

const CustomDonutCenter = ({ title, value }) => (
  <div className="donut-center">
    <div className="donut-center-value">{value}</div>
    <div className="donut-center-label">{title}</div>
  </div>
);

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    teamId: "",
    userId: "",
    compare: "",
  });
  const [loading, setLoading] = useState(true);

  const loadAnalytics = () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    Promise.all([attendanceService.getAnalytics(params), leaveService.getStats()])
      .then(([att, lv]) => {
        setAnalytics(att.data);
        setLeaveStats(lv.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadTeamsIfNeeded = async () => {
    if (teams.length || loadingTeams) return;
    setLoadingTeams(true);
    try {
      const teamsData = await getTeams();
      setTeams(teamsData || []);
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadUsersIfNeeded = async () => {
    if (users.length || loadingUsers) return;
    setLoadingUsers(true);
    try {
      const usersData = await getActiveUsers();
      setUsers(usersData || []);
    } finally {
      setLoadingUsers(false);
    }
  };

  const statusData = useMemo(() => {
    const stats = analytics?.stats || {};
    const ordered = ["Present", "Late", "Half Day", "Absent"];
    return ordered.map((key) => ({
      name: key,
      value: Number(stats[key] || 0),
      color: STATUS_COLORS[key],
    }));
  }, [analytics]);

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

  if (loading) return <div className="page"><div className="page-loading">Loading...</div></div>;
  if (!analytics) return <div className="page"><div className="empty-state">No analytics data</div></div>;

  const downloadAttendanceCsv = async () => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await reportService.downloadAttendanceCsv(params);
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {}
  };

  return (
    <div className="page analytics-page-official">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/admin-portal/users" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/admin-portal/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/admin-portal/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
      </div>

      <div className="page-header page-header-center">
        <h1>Analytics Dashboard</h1>
        <p>Official attendance and leave intelligence overview</p>
      </div>

      <div className="page-card" style={{ marginBottom: 16 }}>
        <div className="filter-bar">
          <input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} />
          <select
            value={filters.teamId}
            onFocus={loadTeamsIfNeeded}
            onMouseDown={loadTeamsIfNeeded}
            onChange={(e) => setFilters((f) => ({ ...f, teamId: e.target.value }))}
          >
            <option value="">All Teams</option>
            {teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <select
            value={filters.userId}
            onFocus={loadUsersIfNeeded}
            onMouseDown={loadUsersIfNeeded}
            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
          >
            <option value="">All Users</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          <select value={filters.compare} onChange={(e) => setFilters((f) => ({ ...f, compare: e.target.value }))}>
            <option value="">No Compare</option>
            <option value="previous">Compare Previous Period</option>
          </select>
          <button className="btn btn-outline btn-sm" onClick={loadAnalytics}>Apply</button>
          <button className="btn btn-outline btn-sm" onClick={downloadAttendanceCsv}>Download CSV</button>
        </div>
        {analytics.comparison && (
          <div style={{ marginTop: 8, color: "#cbd5e1", fontSize: 13 }}>
            Compare: current {analytics.comparison.currentTotal}, previous {analytics.comparison.previousTotal}, delta {analytics.comparison.delta}
          </div>
        )}
      </div>

      <div className="stats-grid">
        {[
          { label: "Total Interns", value: analytics.totalUsers, icon: FiUsers },
          { label: "Total Records", value: analytics.totalRecords, icon: FiCalendar },
          { label: "Avg Hours/Day", value: `${analytics.avgHours}h`, icon: FiClock },
          { label: "Total Leaves", value: leaveStats?.total || 0, icon: FiClipboard },
        ].map((s) => (
          <div key={s.label} className="today-card info-card">
            <div className="today-icon"><s.icon /></div>
            <div>
              <div className="today-value">{s.value}</div>
              <div className="today-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-panels">
        <section className="analytics-panel panel-trend">
          <div className="panel-head">
            <h2 className="analytics-section-title">Daily Attendance Trend</h2>
            <span className="panel-badge">Present vs Late</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analytics.daily || []} margin={{ left: 6, right: 12, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="lateFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.38} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 5" stroke="rgba(148, 163, 184, 0.24)" />
              <XAxis dataKey="date" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
              <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" fill="url(#presentFill)" strokeWidth={2.2} />
              <Area type="monotone" dataKey="late" name="Late" stroke="#f59e0b" fill="url(#lateFill)" strokeWidth={2.2} />
            </AreaChart>
          </ResponsiveContainer>
        </section>

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
            <span className="panel-badge">Official KPI</span>
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
    </div>
  );
};

export default AnalyticsDashboard;
