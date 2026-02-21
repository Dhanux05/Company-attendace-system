import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiCheckCircle, FiClock, FiSun, FiMinus } from "react-icons/fi";
import { attendanceService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "../intern/Pages.css";

const FullAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split("T")[0]);

  useEffect(() => { load(); }, [date]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceService.getAll({ date });
      setRecords(data);
    } catch (e) {}
    setLoading(false);
  };

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
  const stats = { Present: 0, Late: 0, "Half Day": 0 };
  records.forEach(r => { if (stats[r.status] !== undefined) stats[r.status]++; });

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/admin-portal/users" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/admin-portal/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/admin-portal/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        <NavLink to="/admin-portal/analytics" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Analytics</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Full Attendance View</h1>
        <p>All employees attendance records</p>
      </div>
      <div className="filter-bar">
        <label>Date:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <span style={{ color: "#64748b", fontSize: 13 }}>{records.length} records</span>
      </div>
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="today-card info-card">
            <div className="today-icon">{k === "Present" ? <FiCheckCircle /> : k === "Late" ? <FiClock /> : <FiSun />}</div>
            <div><div className="today-value">{v}</div><div className="today-label">{k}</div></div>
          </div>
        ))}
      </div>
      <div className="page-card">
        {loading ? <div className="empty-state">Loading...</div> : records.length === 0 ? (
          <div className="empty-state">No records for this date</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Login</th><th>Logout</th><th>Hours</th><th>Status</th><th>Face</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r._id}>
                    <td style={{ color: "#23272f", fontWeight: 700 }}>{r.user?.name}</td>
                    <td>{r.user?.email}</td>
                    <td><Badge status={r.user?.role} /></td>
                    <td>{fmtTime(r.loginTime)}</td>
                    <td>{fmtTime(r.logoutTime)}</td>
                    <td>{r.totalHours > 0 ? `${r.totalHours}h` : "—"}</td>
                    <td><Badge status={r.status} /></td>
                    <td>{r.faceVerifiedLogin ? <FiCheckCircle /> : <FiMinus />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullAttendance;
