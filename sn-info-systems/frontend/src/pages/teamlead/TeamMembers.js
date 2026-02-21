import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { userService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "../intern/Pages.css";

const TeamMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await userService.getTeamMembers();
      setMembers(data);
    } catch (e) {
      setMembers([]);
      setError(e.response?.data?.message || "Unable to load team members");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = members.filter((m) =>
    (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/teamlead/members" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/teamlead/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/teamlead/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        <NavLink to="/teamlead/analytics" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Analytics</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Team Members</h1>
        <p>View members assigned to your team</p>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 280 }}
        />
        <span style={{ color: "#64748b", fontSize: 13 }}>{filtered.length} members</span>
      </div>

      <div className="page-card">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No team members found</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m._id}>
                    <td style={{ color: "#2f343f", fontWeight: 700 }}>{m.name}</td>
                    <td>{m.email}</td>
                    <td><Badge status={m.role} /></td>
                    <td>{m.phone || "-"}</td>
                    <td>{m.isActive ? "Active" : "Inactive"}</td>
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

export default TeamMembers;
