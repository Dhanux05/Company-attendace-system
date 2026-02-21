import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { leaveService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "./Pages.css";

const LeaveHistory = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaveService.getMy().then(({ data }) => { setLeaves(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : "—";

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
        <h1>Leave History</h1>
        <p>Track status of your leave applications</p>
      </div>
      <div className="page-card">
        {loading ? <div className="empty-state">Loading...</div> : leaves.length === 0 ? (
          <div className="empty-state">No leave applications yet</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Reviewed By</th></tr></thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l._id}>
                    <td style={{ color: "#2f343f", fontWeight: 700 }}>{l.leaveType}</td>
                    <td>{fmtDate(l.startDate)}</td>
                    <td>{fmtDate(l.endDate)}</td>
                    <td>{l.totalDays}</td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.reason}</td>
                    <td><Badge status={l.status} /></td>
                    <td>{l.reviewedBy?.name || "—"}</td>
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

export default LeaveHistory;
