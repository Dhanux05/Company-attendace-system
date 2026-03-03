import React, { useEffect, useState } from "react";
import { auditService } from "../../services/api";
import "../intern/Pages.css";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    module: "",
    action: "",
    startDate: "",
    endDate: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await auditService.getAll(params);
      setLogs(data || []);
    } catch (err) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page">
      <div className="page-header page-header-center">
        <h1>Audit Logs</h1>
        <p>Track profile updates, approvals, and attendance edits</p>
      </div>

      <div className="page-card">
        <div className="filter-bar">
          <input placeholder="Module (auth/leave/attendance/profile)" value={filters.module} onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value }))} />
          <input placeholder="Action" value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} />
          <input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} />
          <button className="btn btn-outline btn-sm" onClick={load}>Apply</button>
        </div>

        {loading ? (
          <div className="page-loading">Loading...</div>
        ) : !logs.length ? (
          <div className="empty-state">No audit logs found.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {logs.map((log) => (
              <div key={log._id} style={{ border: "1px solid rgba(148,163,184,0.25)", borderRadius: 10, padding: 12, background: "rgba(15,23,42,0.4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ color: "#f8fafc", fontWeight: 700 }}>{log.module} / {log.action}</div>
                  <div style={{ color: "#94a3b8", fontSize: 11 }}>{new Date(log.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ marginTop: 5, color: "#cbd5e1", fontSize: 13 }}>{log.message || "No message"}</div>
                <div style={{ marginTop: 6, color: "#94a3b8", fontSize: 12 }}>
                  By: {log.actor?.name || "Unknown"} ({log.actorRole || log.actor?.role || "-"})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
