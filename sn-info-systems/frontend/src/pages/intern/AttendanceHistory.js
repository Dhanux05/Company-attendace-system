import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiCalendar, FiCheckCircle, FiXCircle, FiBarChart2 } from "react-icons/fi";
import { attendanceService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "./Pages.css";

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(now.getFullYear()));

  useEffect(() => { load(); }, [month, year]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceService.getMy({ month, year });
      setRecords(data);
    } catch (e) {}
    setLoading(false);
  };

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
  const present = records.filter(r => r.status === "Present" || r.status === "Late").length;
  const total = records.length;

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
        <h1>Attendance History</h1>
        <p>View your attendance records</p>
      </div>
      <div className="filter-bar">
        <label>Month:</label>
        <select value={month} onChange={e => setMonth(e.target.value)}>
          {Array.from({length:12}, (_,i) => (
            <option key={i+1} value={String(i+1).padStart(2,"0")}>
              {new Date(2024,i).toLocaleString("default",{month:"long"})}
            </option>
          ))}
        </select>
        <label>Year:</label>
        <select value={year} onChange={e => setYear(e.target.value)}>
          {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: "Total Days", value: total, icon: FiCalendar, color: "blue" },
          { label: "Present", value: present, icon: FiCheckCircle, color: "green" },
          { label: "Absent", value: total - present, icon: FiXCircle, color: "red" },
          { label: "Attendance %", value: total ? `${Math.round(present/total*100)}%` : "0%", icon: FiBarChart2, color: "purple" },
        ].map(s => (
          <div key={s.label} className="today-card info-card">
            <div className="today-icon"><s.icon /></div>
            <div><div className="today-label">{s.label}</div><div className="today-value">{s.value}</div></div>
          </div>
        ))}
      </div>

      <div className="page-card">
        {loading ? <div className="empty-state">Loading...</div> : records.length === 0 ? (
          <div className="empty-state">No records for this month</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Login</th><th>Logout</th><th>Total Hours</th><th>Status</th></tr></thead>
              <tbody>
                {records.map(r => (
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
