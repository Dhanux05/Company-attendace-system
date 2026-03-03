import React, { useMemo, useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FiCheckCircle,
  FiCircle,
  FiClock,
  FiMapPin,
  FiClipboard,
  FiCalendar,
  FiFileText,
  FiArrowRight,
  FiUsers,
} from "react-icons/fi";
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
import { useAuth } from "../../context/AuthContext";
import { attendanceService, leaveService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "./Pages.css";
import "../admin/AnalyticsDashboard.css";

const STATUS_COLORS = {
  Present: "#10b981",
  Late: "#f59e0b",
  "Half Day": "#3b82f6",
  Absent: "#ef4444",
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

const InternDashboard = () => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [teamAnalytics, setTeamAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const analyticsRequest = user?.role === "teamlead" ? attendanceService.getAnalytics() : Promise.resolve({ data: null });
        const [today, history, leaves, analytics] = await Promise.all([
          attendanceService.getToday(),
          attendanceService.getMy(),
          leaveService.getMy(),
          analyticsRequest,
        ]);
        setTodayRecord(today.data);
        setRecentAttendance(history.data.slice(0, 5));
        setRecentLeaves(leaves.data.slice(0, 3));
        setTeamAnalytics(analytics.data || null);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [user?.role]);

  const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-");
  const isTeamLead = user?.role === "teamlead";

  const statusData = useMemo(() => {
    const stats = teamAnalytics?.stats || {};
    return ["Present", "Late", "Half Day", "Absent"].map((key) => ({
      name: key,
      value: Number(stats[key] || 0),
      color: STATUS_COLORS[key],
    }));
  }, [teamAnalytics]);

  const totalStatus = statusData.reduce((sum, item) => sum + item.value, 0);
  const hasTrendData = Array.isArray(teamAnalytics?.daily) && teamAnalytics.daily.length > 0;

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/intern/dashboard" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Dashboard</NavLink>
        <NavLink to="/intern/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/intern/leave" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leave</NavLink>
        <NavLink to="/intern/attendance-history" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance History</NavLink>
        <NavLink to="/intern/leave-history" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leave History</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p>Here is your attendance summary for today</p>
      </div>

      <div className="stats-grid">
        <div className={`today-card ${todayRecord?.loginTime ? "logged-in" : "not-logged"}`}>
          <div className="today-icon">{todayRecord?.loginTime ? <FiCheckCircle /> : <FiCircle />}</div>
          <div>
            <div className="today-label">Today Status</div>
            <div className="today-value">
              {todayRecord?.logoutTime ? "Completed" : todayRecord?.loginTime ? "Active" : "Not Logged In"}
            </div>
            {todayRecord?.status && <Badge status={todayRecord.status} />}
          </div>
        </div>
        <div className="today-card info-card">
          <div className="today-icon"><FiClock /></div>
          <div>
            <div className="today-label">Login Time</div>
            <div className="today-value">{fmtTime(todayRecord?.loginTime)}</div>
          </div>
        </div>
        <div className="today-card info-card">
          <div className="today-icon"><FiClock /></div>
          <div>
            <div className="today-label">Logout Time</div>
            <div className="today-value">{fmtTime(todayRecord?.logoutTime)}</div>
          </div>
        </div>
        <div className="today-card info-card">
          <div className="today-icon"><FiClock /></div>
          <div>
            <div className="today-label">Hours Today</div>
            <div className="today-value">{todayRecord?.totalHours > 0 ? `${todayRecord.totalHours}h` : "-"}</div>
          </div>
        </div>
      </div>

      {isTeamLead && teamAnalytics && (
        <>
          <div className="analytics-mid-heading">Team Analytics</div>
          <div className="analytics-panels" style={{ marginTop: 20 }}>
            <section className="analytics-panel panel-trend">
              <div className="panel-head">
                <h2 className="analytics-section-title">Daily Attendance Trend</h2>
                <span className="panel-badge">Present vs Late</span>
              </div>
              {!hasTrendData ? (
                <div className="empty-state" style={{ minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  No team attendance trend yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={teamAnalytics.daily || []} margin={{ left: 6, right: 12, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tlPresentFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.42} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="tlLateFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.38} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 5" stroke="rgba(148, 163, 184, 0.24)" />
                    <XAxis dataKey="date" tick={AXIS_TICK} />
                    <YAxis tick={AXIS_TICK} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                    <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" fill="url(#tlPresentFill)" strokeWidth={2.2} />
                    <Area type="monotone" dataKey="late" name="Late" stroke="#f59e0b" fill="url(#tlLateFill)" strokeWidth={2.2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </section>

            <section className="analytics-panel">
              <div className="panel-head">
                <h2 className="analytics-section-title">Status Breakdown</h2>
                <span className="panel-badge">Pie Graph</span>
              </div>
              <div className="donut-wrap">
                <div className="donut-chart-shell">
                  {totalStatus > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
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
                  ) : (
                    <div className="empty-state" style={{ minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      No status data yet
                    </div>
                  )}
                  <div className="donut-center">
                    <div className="donut-center-value">{totalStatus}</div>
                    <div className="donut-center-label">Total</div>
                  </div>
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

            <section className="analytics-panel">
              <div className="panel-head">
                <h2 className="analytics-section-title">Team Summary</h2>
                <span className="panel-badge">Highlights</span>
              </div>
              <div className="stats-grid" style={{ marginBottom: 0, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div className="today-card info-card">
                  <div className="today-icon"><FiUsers /></div>
                  <div>
                    <div className="today-value">{teamAnalytics.totalUsers || 0}</div>
                    <div className="today-label">Total Members</div>
                  </div>
                </div>
                <div className="today-card info-card">
                  <div className="today-icon"><FiClock /></div>
                  <div>
                    <div className="today-value">{teamAnalytics.avgHours || 0}h</div>
                    <div className="today-label">Avg Hours/Day</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/intern/attendance" className="action-btn action-primary">
            <FiMapPin className="action-icon" /> Mark Attendance
          </Link>
          <Link to="/intern/leave" className="action-btn action-secondary">
            <FiClipboard className="action-icon" /> Apply Leave
          </Link>
          <Link to="/intern/attendance-history" className="action-btn action-secondary">
            <FiCalendar className="action-icon" /> View History
          </Link>
          <Link to="/intern/leave-history" className="action-btn action-secondary">
            <FiFileText className="action-icon" /> Leave Status
          </Link>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dash-section">
          <div className="section-header">
            <h2>Recent Attendance</h2>
            <Link to="/intern/attendance-history" className="see-all">See all <FiArrowRight /></Link>
          </div>
          {recentAttendance.length === 0 ? (
            <div className="empty-state">No attendance records yet</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Login</th><th>Logout</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {recentAttendance.map((r) => (
                  <tr key={r._id}>
                    <td>{r.date}</td>
                    <td>{fmtTime(r.loginTime)}</td>
                    <td>{fmtTime(r.logoutTime)}</td>
                    <td>{r.totalHours > 0 ? `${r.totalHours}h` : "-"}</td>
                    <td><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash-section">
          <div className="section-header">
            <h2>Recent Leaves</h2>
            <Link to="/intern/leave-history" className="see-all">See all <FiArrowRight /></Link>
          </div>
          {recentLeaves.length === 0 ? (
            <div className="empty-state">No leave applications yet</div>
          ) : (
            <div className="leave-list">
              {recentLeaves.map((l) => (
                <div key={l._id} className="leave-item">
                  <div className="leave-info">
                    <span className="leave-type">{l.leaveType}</span>
                    <span className="leave-dates">{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</span>
                  </div>
                  <Badge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternDashboard;
