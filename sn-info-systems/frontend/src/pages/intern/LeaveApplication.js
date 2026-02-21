import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FiCalendar } from "react-icons/fi";
import { leaveService } from "../../services/api";
import "./Pages.css";

const TYPES = ["Sick Leave", "Casual Leave", "Emergency Leave", "Personal Leave", "Other"];

const LeaveApplication = () => {
  const [form, setForm] = useState({ leaveType: "", startDate: "", endDate: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setMessage({ type: "error", text: "End date must be after start date" }); return;
    }
    setLoading(true);
    try {
      await leaveService.apply(form);
      setMessage({ type: "success", text: "Leave application submitted successfully!" });
      setForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
    } catch (e) {
      setMessage({ type: "error", text: e.response?.data?.message || "Failed to submit leave" });
    }
    setLoading(false);
  };

  const days = form.startDate && form.endDate
    ? Math.max(0, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000*60*60*24)) + 1)
    : 0;

  return (
    <div className="page leave-apply-page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/intern/dashboard" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Dashboard</NavLink>
        <NavLink to="/intern/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/intern/leave" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leave</NavLink>
        <NavLink to="/intern/attendance-history" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance History</NavLink>
        <NavLink to="/intern/leave-history" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leave History</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Apply for Leave</h1>
        <p>Submit your leave request for approval</p>
      </div>
      {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      <div className="leave-apply-wrap">
      <div className="page-card leave-apply-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Leave Type</label>
            <select value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})} required>
              <option value="">Select leave type</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required min={form.startDate || new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          {days > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              <FiCalendar style={{ marginRight: 8, verticalAlign: "text-bottom" }} />
              Total {days} day{days !== 1 ? "s" : ""} of leave
            </div>
          )}
          <div className="form-group">
            <label>Reason</label>
            <textarea
              rows={4} placeholder="Please provide a detailed reason for your leave..."
              value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required
              style={{ resize: "vertical" }}
            />
          </div>
          <button type="submit" className="btn-primary leave-submit-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit Leave Request"}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
};

export default LeaveApplication;
