import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { attendanceService, auditService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "../intern/Pages.css";

const TeamAttendance = () => {
  const [records, setRecords] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split("T")[0]);

  useEffect(() => { load(); }, [date]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [teamData, timelineData] = await Promise.all([
        attendanceService.getTeam({ date }),
        auditService.getTodayTimeline(),
      ]);
      setRecords(teamData.data);
      setTimeline(timelineData.data || []);
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

      <div className="page-card" style={{ marginTop: 16 }}>
        <div className="section-header">
          <h2>Today's Actions Timeline</h2>
        </div>
        {!timeline.length ? (
          <div className="empty-state">No actions logged today</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {timeline.slice(0, 10).map((item) => (
              <div key={item._id} style={{ border: "1px solid rgba(148,163,184,0.24)", borderRadius: 10, padding: 10, background: "rgba(15,23,42,0.4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
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

export default TeamAttendance;

