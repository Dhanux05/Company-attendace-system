import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiCheck, FiX } from "react-icons/fi";
import { leaveService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "../intern/Pages.css";

const LeaveApproval = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try { const { data } = await leaveService.getTeam(); setLeaves(data); }
    catch (e) {}
    setLoading(false);
  };

  const handleReview = async (id, status) => {
    setReviewing(id);
    try {
      const { data } = await leaveService.review(id, { status, reviewNote: note });
      setLeaves(prev => prev.map(l => l._id === id ? data : l));
      setNote("");
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
    setReviewing(null);
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : "—";
  const pending = leaves.filter(l => l.status === "Pending");
  const reviewed = leaves.filter(l => l.status !== "Pending");

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/teamlead/members" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/teamlead/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/teamlead/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        <NavLink to="/teamlead/analytics" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Analytics</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Leave Approvals</h1>
        <p>Review and approve/reject leave requests</p>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", marginBottom: 12 }}>
        Pending Requests ({pending.length})
      </h2>
      {pending.length === 0 && <div className="page-card"><div className="empty-state">No pending requests</div></div>}
      {pending.map(l => (
        <div key={l._id} className="page-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>{l.user?.name}</div>
              <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{l.leaveType} · {fmtDate(l.startDate)} – {fmtDate(l.endDate)} ({l.totalDays} days)</div>
              <div style={{ fontSize: 13, color: "var(--text-soft)", marginTop: 6 }}>{l.reason}</div>
            </div>
            <Badge status={l.status} />
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              placeholder="Optional review note..."
              style={{ flex: "1 1 220px", background: "#ffffff", border: "1px solid #cfc4b1", borderRadius: 8, padding: "8px 10px", color: "var(--text-main)", fontSize: 13, minWidth: 0, maxWidth: "100%" }}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button className="btn btn-success btn-sm" onClick={() => handleReview(l._id, "Approved")} disabled={reviewing === l._id}><FiCheck style={{ marginRight: 4 }} />Approve</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleReview(l._id, "Rejected")} disabled={reviewing === l._id}><FiX style={{ marginRight: 4 }} />Reject</button>
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
              <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Note</th></tr></thead>
              <tbody>
                {reviewed.map(l => (
                  <tr key={l._id}>
                    <td style={{ color: "var(--text-main)", fontWeight: 700 }}>{l.user?.name}</td>
                    <td>{l.leaveType}</td>
                    <td>{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</td>
                    <td>{l.totalDays}</td>
                    <td><Badge status={l.status} /></td>
                    <td>{l.reviewNote || "—"}</td>
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

