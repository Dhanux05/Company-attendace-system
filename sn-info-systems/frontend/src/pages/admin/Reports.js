import React, { useEffect, useState } from "react";
import { reportService } from "../../services/api";
import "../intern/Pages.css";

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const Reports = () => {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const { data } = await reportService.getMonthlySummary({ month, year });
      setSummary(data);
    } catch (err) {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleDownload = async (fn, name) => {
    try {
      const { data } = await fn({ month, year });
      downloadBlob(data, name);
    } catch (err) {}
  };

  return (
    <div className="page">
      <div className="page-header page-header-center">
        <h1>Reports</h1>
        <p>Download attendance, leave, and KPI reports</p>
      </div>

      <div className="page-card">
        <div className="filter-bar">
          <input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} />
          <input type="number" min="2020" max="2100" value={year} onChange={(e) => setYear(e.target.value)} />
          <button className="btn btn-outline btn-sm" onClick={loadSummary}>Load Summary</button>
        </div>

        <div className="actions-grid" style={{ marginTop: 10 }}>
          <button className="action-btn action-primary" onClick={() => handleDownload(reportService.downloadAttendanceCsv, `attendance-${year}-${month}.csv`)}>Download Attendance CSV</button>
          <button className="action-btn action-secondary" onClick={() => handleDownload(reportService.downloadLeavesCsv, `leaves-${year}-${month}.csv`)}>Download Leave CSV</button>
          <button className="action-btn action-secondary" onClick={() => handleDownload(reportService.downloadKpisCsv, `kpis-${year}.csv`)}>Download KPI CSV</button>
        </div>

        {loading ? (
          <div className="page-loading">Loading summary...</div>
        ) : summary ? (
          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <div className="today-card info-card">
              <div>
                <div className="today-label">Attendance Records</div>
                <div className="today-value">{summary.kpis.totalAttendanceRecords}</div>
              </div>
            </div>
            <div className="today-card info-card">
              <div>
                <div className="today-label">Leave Requests</div>
                <div className="today-value">{summary.kpis.totalLeaveRequests}</div>
              </div>
            </div>
            <div className="today-card info-card">
              <div>
                <div className="today-label">Interns</div>
                <div className="today-value">{summary.kpis.totalInterns}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">No summary available.</div>
        )}
      </div>
    </div>
  );
};

export default Reports;
