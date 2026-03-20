import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { leaveService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "../intern/Pages.css";

const LeaveApproval = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await leaveService.getTeam();
      setLeaves(data);
    } catch (e) {}
    setLoading(false);
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");
  const pending = leaves.filter((l) => l.status === "Pending");
  const approved = leaves.filter((l) => l.status === "Approved");
  const rejected = leaves.filter((l) => l.status === "Rejected");
  const reviewed = leaves.filter((l) => l.status !== "Pending");
  const total = leaves.length;

  const summaryItems = [
    {
      key: "pending",
      label: "Pending",
      count: pending.length,
      percent: total ? Math.round((pending.length / total) * 100) : 0,
      dotClass: "leave-dot pending",
      fillClass: "leave-fill pending",
    },
    {
      key: "approved",
      label: "Approved",
      count: approved.length,
      percent: total ? Math.round((approved.length / total) * 100) : 0,
      dotClass: "leave-dot approved",
      fillClass: "leave-fill approved",
    },
    {
      key: "rejected",
      label: "Rejected",
      count: rejected.length,
      percent: total ? Math.round((rejected.length / total) * 100) : 0,
      dotClass: "leave-dot rejected",
      fillClass: "leave-fill rejected",
    },
  ];

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/teamlead/members" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/teamlead/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/teamlead/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        <NavLink to="/teamlead/analytics" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Analytics</NavLink>
      </div>

      <div className="page-header page-header-center">
        <h1>Team Leave Requests</h1>
        <p>View team leave requests. Only admins can approve or reject.</p>
      </div>

      <div className="page-card leave-summary-card">
        <div className="leave-summary-head">
          <div>
            <h2>Leave Summary</h2>
            <p className="leave-summary-caption">Quick view of leave requests across your team.</p>
          </div>
          <span className="leave-summary-badge">{total} total requests</span>
        </div>

        <div className="leave-summary-stats">
          <div className="leave-summary-stat total">
            <span className="leave-summary-stat-label">Total Requests</span>
            <strong>{total}</strong>
            <small>{reviewed.length} reviewed</small>
          </div>
          {summaryItems.map((item) => (
            <div key={`stat-${item.key}`} className={`leave-summary-stat ${item.key}`}>
              <span className="leave-summary-stat-label">{item.label}</span>
              <strong>{item.count}</strong>
              <small>{item.percent}% of all requests</small>
            </div>
          ))}
        </div>

        <div className="leave-distribution-list">
          {summaryItems.map((item) => (
            <div key={item.key} className={`leave-distribution-card ${item.key}`}>
              <div className="leave-distribution-top">
                <div className="leave-summary-label">
                  <span className={item.dotClass} />
                  <span>{item.label}</span>
                </div>
                <div className="leave-distribution-values">
                  <strong>{item.count}</strong>
                  <span>{item.percent}%</span>
                </div>
              </div>
              <div className="leave-track">
                <div className={item.fillClass} style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", marginBottom: 12 }}>
        Pending Requests ({pending.length})
      </h2>

      {loading && <div className="page-card"><div className="empty-state">Loading...</div></div>}
      {!loading && pending.length === 0 && <div className="page-card"><div className="empty-state">No pending requests</div></div>}

      {!loading && pending.map((l) => (
        <div key={l._id} className="page-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>{l.user?.name}</div>
              <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{l.leaveType} | {fmtDate(l.startDate)} - {fmtDate(l.endDate)} ({l.totalDays} days)</div>
              <div style={{ fontSize: 13, color: "var(--text-soft)", marginTop: 6 }}>{l.reason}</div>
            </div>
            <Badge status={l.status} />
          </div>
        </div>
      ))}

      <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", margin: "20px 0 12px" }}>
        Reviewed ({reviewed.length})
      </h2>

      {reviewed.length > 0 && (
        <div className="page-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Note</th><th>Reviewed By</th></tr></thead>
              <tbody>
                {reviewed.map((l) => (
                  <tr key={l._id}>
                    <td style={{ color: "var(--text-main)", fontWeight: 700 }}>{l.user?.name}</td>
                    <td>{l.leaveType}</td>
                    <td>{fmtDate(l.startDate)} - {fmtDate(l.endDate)}</td>
                    <td>{l.totalDays}</td>
                    <td><Badge status={l.status} /></td>
                    <td>{l.reviewNote || "-"}</td>
                    <td>{l.reviewedBy?.name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;
