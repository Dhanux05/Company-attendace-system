import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiEdit2 } from "react-icons/fi";
import { userService } from "../../services/api";
import Badge from "../../components/common/Badge";
import "../intern/Pages.css";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([userService.getAll(), userService.getTeams()])
      .then(([u, t]) => { setUsers(u.data); setTeams(t.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleEdit = (user) => {
    setEditing(user._id);
    setForm({ name: user.name, email: user.email, role: user.role, phone: user.phone || "", team: user.team?._id || "", isActive: user.isActive });
  };

  const handleSave = async () => {
    try {
      const { data } = await userService.update(editing, form);
      setUsers(prev => prev.map(u => u._id === editing ? data : u));
      setEditing(null);
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };

  const handleToggle = async (id, isActive) => {
    try {
      const { data } = await userService.update(id, { isActive: !isActive });
      setUsers(prev => prev.map(u => u._id === id ? data : u));
    } catch (e) {}
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/admin-portal/users" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/admin-portal/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/admin-portal/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        <NavLink to="/admin-portal/analytics" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Analytics</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Manage Users</h1>
        <p>View and manage all system users</p>
      </div>
      <div className="filter-bar">
        <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 280 }} />
        <span style={{ color: "#64748b", fontSize: 13 }}>{filtered.length} users</span>
      </div>
      <div className="page-card">
        {loading ? <div className="empty-state">Loading...</div> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Team</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id}>
                    {editing === u._id ? (
                      <>
                        <td><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ background: "#ffffff", border: "1px solid #cfc4b1", borderRadius: 6, padding: "6px 10px", color: "#23272f", width: "100%" }} /></td>
                        <td><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ background: "#ffffff", border: "1px solid #cfc4b1", borderRadius: 6, padding: "6px 10px", color: "#23272f", width: "100%" }} /></td>
                        <td>
                          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ background: "#ffffff", border: "1px solid #cfc4b1", borderRadius: 6, padding: "6px 10px", color: "#23272f" }}>
                            <option value="intern">intern</option>
                            <option value="teamlead">teamlead</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td>
                          <select value={form.team} onChange={e => setForm({...form, team: e.target.value})} style={{ background: "#ffffff", border: "1px solid #cfc4b1", borderRadius: 6, padding: "6px 10px", color: "#23272f" }}>
                            <option value="">No Team</option>
                            {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                          </select>
                        </td>
                        <td colSpan={2}>
                          <button className="btn btn-success btn-sm" onClick={handleSave} style={{ marginRight: 6 }}>Save</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ color: "#23272f", fontWeight: 700 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td><Badge status={u.role} /></td>
                        <td>{u.team?.name || "—"}</td>
                        <td><span style={{ color: u.isActive ? "#34d399" : "#f87171", fontSize: 12 }}>{u.isActive ? "Active" : "Inactive"}</span></td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => handleEdit(u)}><FiEdit2 /></button>
                          <button className="btn btn-sm" style={{ background: u.isActive ? "#ef444420" : "#10b98120", color: u.isActive ? "#f87171" : "#34d399", border: "none" }} onClick={() => handleToggle(u._id, u.isActive)}>
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </>
                    )}
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

export default ManageUsers;
