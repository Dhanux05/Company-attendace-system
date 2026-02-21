import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { leaveService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "../intern/Pages.css";

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected"];

const AdminLeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const params = statusFilter === "All" ? undefined : { status: statusFilter };
      const { data } = await leaveService.getAll(params);
      setLeaves(data);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return leaves.filter((leave) => {
      if (!term) return true;
      return (
        leave.user?.name?.toLowerCase().includes(term) ||
        leave.user?.email?.toLowerCase().includes(term) ||
        leave.leaveType?.toLowerCase().includes(term)
      );
    });
  }, [leaves, search]);

  const pendingCount = leaves.filter((leave) => leave.status === "Pending").length;

  const handleReview = async (leaveId, status) => {
    setReviewingId(leaveId);
    try {
      const note = reviewNotes[leaveId] || "";
      const { data } = await leaveService.review(leaveId, { status, reviewNote: note });
      setLeaves((prev) => prev.map((leave) => (leave._id === leaveId ? data : leave)));
      setReviewNotes((prev) => ({ ...prev, [leaveId]: "" }));
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update leave");
    } finally {
      setReviewingId(null);
    }
  };

  const fmtDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/admin-portal/users" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/admin-portal/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/admin-portal/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        <NavLink to="/admin-portal/analytics" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Analytics</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Manage Leave Requests</h1>
        <p>Approve or reject leave requests across all teams</p>
      </div>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          placeholder="Search by user name, email, or leave type"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 300 }}
        />
        <span style={{ color: "var(--text-soft)", fontSize: 13 }}>
          {filtered.length} requests ({pendingCount} pending)
        </span>
      </div>

      <div className="page-card">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No leave requests found</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((leave) => {
                  const isPending = leave.status === "Pending";
                  const isBusy = reviewingId === leave._id;

                  return (
                    <tr key={leave._id}>
                      <td style={{ color: "var(--text-main)", fontWeight: 700 }}>{leave.user?.name || "-"}</td>
                      <td>{leave.user?.email || "-"}</td>
                      <td>{leave.leaveType}</td>
                      <td>
                        {fmtDate(leave.startDate)} to {fmtDate(leave.endDate)}
                      </td>
                      <td>{leave.totalDays}</td>
                      <td>
                        <Badge status={leave.status} />
                      </td>
                      <td>
                        {isPending ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <input
                              placeholder="Optional note"
                              value={reviewNotes[leave._id] || ""}
                              onChange={(e) =>
                                setReviewNotes((prev) => ({
                                  ...prev,
                                  [leave._id]: e.target.value,
                                }))
                              }
                              style={{
                                background: "#0f1117",
                                border: "1px solid #1e2140",
                                borderRadius: 6,
                                padding: "6px 10px",
                                color: "var(--text-main)",
                                fontSize: 12,
                              }}
                            />
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleReview(leave._id, "Approved")}
                                disabled={isBusy}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleReview(leave._id, "Rejected")}
                                disabled={isBusy}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: "var(--text-soft)", fontSize: 12 }}>
                            {leave.reviewNote || "Reviewed"}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeaveManagement;

