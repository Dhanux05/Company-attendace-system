import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { attendanceService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "../intern/Pages.css";

const TeamAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split("T")[0]);

  useEffect(() => { load(); }, [date]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await attendanceService.getTeam({ date });
      setRecords(data);
    } catch (e) {
      setRecords([]);
      setError(e.response?.data?.message || "Unable to load team attendance");
    }
    setLoading(false);
  };

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/teamlead/members" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/teamlead/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/teamlead/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        <NavLink to="/teamlead/analytics" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Analytics</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Team Attendance</h1>
        <p>Monitor your team's attendance</p>
      </div>
      <div className="filter-bar">
        <label>Date:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div className="page-card">
        {loading ? <div className="empty-state">Loading...</div> : error ? (
          <div className="empty-state">{error}</div>
        ) : records.length === 0 ? (
          <div className="empty-state">No records for this date</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Login</th><th>Logout</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r._id}>
                    <td style={{ color: "var(--text-main)", fontWeight: 700 }}>{r.user?.name}</td>
                    <td>{r.user?.email}</td>
                    <td>{fmtTime(r.loginTime)}</td>
                    <td>{fmtTime(r.logoutTime)}</td>
                    <td>{r.totalHours > 0 ? `${r.totalHours}h` : "—"}</td>
                    <td><Badge status={r.status} /></td>
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

export default TeamAttendance;

