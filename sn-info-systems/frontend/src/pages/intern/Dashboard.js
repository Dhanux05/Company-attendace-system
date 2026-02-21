import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiCheckCircle, FiCircle, FiClock, FiMapPin, FiClipboard, FiCalendar, FiFileText, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { attendanceService, leaveService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "./Pages.css";

const InternDashboard = () => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [today, history, leaves] = await Promise.all([
          attendanceService.getToday(),
          attendanceService.getMy(),
          leaveService.getMy(),
        ]);
        setTodayRecord(today.data);
        setRecentAttendance(history.data.slice(0, 5));
        setRecentLeaves(leaves.data.slice(0, 3));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const presentDays = recentAttendance.filter(r => r.status === "Present" || r.status === "Late").length;
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

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
            <div className="today-value">{todayRecord?.totalHours > 0 ? `${todayRecord.totalHours}h` : "—"}</div>
          </div>
        </div>
      </div>

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
                {recentAttendance.map(r => (
                  <tr key={r._id}>
                    <td>{r.date}</td>
                    <td>{fmtTime(r.loginTime)}</td>
                    <td>{fmtTime(r.logoutTime)}</td>
                    <td>{r.totalHours > 0 ? `${r.totalHours}h` : "—"}</td>
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
              {recentLeaves.map(l => (
                <div key={l._id} className="leave-item">
                  <div className="leave-info">
                    <span className="leave-type">{l.leaveType}</span>
                    <span className="leave-dates">{new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}</span>
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
