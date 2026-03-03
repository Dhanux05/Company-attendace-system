import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { userService } from "../../services/api";
import { getTeams, getUsers, invalidateAdminReferenceData } from "../../services/adminDataStore";
import "../intern/Pages.css";

const ManageTeams = () => {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", leaderId: "", memberIds: [] });
  const [saving, setSaving] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editForm, setEditForm] = useState({ leaderId: "", memberIds: [] });

  const loadTeams = () => {
    setLoading(true);
    getTeams()
      .then((teamsData) => {
        setTeams(teamsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadUsersIfNeeded = async () => {
    if (users.length) return;
    setUsersLoading(true);
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userService.createTeam(form);
      setTeams((prev) => [...prev, data]);
      setForm({ name: "", description: "", leaderId: "", memberIds: [] });
      setShowForm(false);
      invalidateAdminReferenceData({ users: false, teams: true });
      loadTeams();
    } catch (e) {
      alert(e.response?.data?.message || "Failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this team?")) return;
    try {
      await userService.deleteTeam(id);
      setTeams((prev) => prev.map((t) => (t._id === id ? { ...t, isActive: false } : t)));
      invalidateAdminReferenceData({ users: false, teams: true });
    } catch (e) {}
  };

  const startEditTeam = async (team) => {
    await loadUsersIfNeeded();
    setEditingTeamId(team._id);
    const memberIds = (team.members || []).map((m) => m._id);
    setEditForm({
      leaderId: team.leader?._id || "",
      memberIds,
    });
  };

  const cancelEditTeam = () => {
    setEditingTeamId(null);
    setEditForm({ leaderId: "", memberIds: [] });
  };

  const toggleMember = (userId) => {
    setEditForm((prev) => {
      const exists = prev.memberIds.includes(userId);
      return {
        ...prev,
        memberIds: exists
          ? prev.memberIds.filter((id) => id !== userId)
          : [...prev.memberIds, userId],
      };
    });
  };

  const saveTeamMembers = async (team) => {
    try {
      const payload = {
        name: team.name,
        description: team.description,
        leaderId: editForm.leaderId || null,
        memberIds: [...new Set(editForm.memberIds)],
      };
      const { data } = await userService.updateTeam(team._id, payload);
      setTeams((prev) => prev.map((t) => (t._id === team._id ? data : t)));
      cancelEditTeam();
      invalidateAdminReferenceData({ users: true, teams: true });
      loadTeams();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update team");
    }
  };

  const handleToggleCreateForm = async () => {
    const next = !showForm;
    if (next) await loadUsersIfNeeded();
    setShowForm(next);
  };

  const leads = users.filter((u) => (u.role === "teamlead" || u.role === "intern") && u.isActive);
  const assignableUsers = users.filter((u) => u.isActive && u.role !== "admin");

  return (
    <div className="page">
      <div className="sub-nav sub-nav-center">
        <NavLink to="/admin-portal/users" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
        <NavLink to="/admin-portal/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
        <NavLink to="/admin-portal/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
      </div>
      <div className="page-header page-header-center">
        <h1>Manage Teams</h1>
        <p>Create teams and assign members as needed</p>
      </div>
      <div style={{ marginBottom: 20 }}>
        <button
          className="btn-primary"
          style={{ width: "auto", padding: "10px 20px", display: "inline-block" }}
          onClick={handleToggleCreateForm}
        >
          {showForm ? "Cancel" : "+ Create Team"}
        </button>
      </div>

      {showForm && (
        <div className="page-card" style={{ marginBottom: 20, maxWidth: 600 }}>
          <h3 style={{ color: "var(--text-main)", marginBottom: 16 }}>New Team</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Team Name</label>
              <input
                placeholder="e.g., Frontend Team"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                placeholder="Brief description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Team Leader</label>
              <select value={form.leaderId} onChange={(e) => setForm({ ...form, leaderId: e.target.value })}>
                <option value="">Select leader</option>
                {leads.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              {usersLoading && <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-soft)" }}>Loading members...</div>}
            </div>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? "Creating..." : "Create Team"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-loading">Loading...</div>
      ) : teams.length === 0 ? (
        <div className="page-card">
          <div className="empty-state">No teams created yet</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {teams.map((t) => (
            <div key={t._id} className="page-card" style={{ opacity: t.isActive === false ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ color: "var(--text-main)", fontWeight: 700, marginBottom: 4 }}>{t.name}</h3>
                  <p style={{ fontSize: 12, color: "var(--text-soft)" }}>{t.description || "No description"}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {t.isActive !== false && (
                    <button className="btn btn-outline btn-sm" onClick={() => startEditTeam(t)}>
                      Assign Members
                    </button>
                  )}
                  {t.isActive !== false && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-soft)" }}>
                <div>
                  Leader: <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{t.leader?.name || "Not assigned"}</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  Members: <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{t.members?.length || 0}</span>
                </div>
              </div>

              {editingTeamId === t._id && (
                <div style={{ marginTop: 14, borderTop: "1px solid #e3dccf", paddingTop: 12 }}>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label>Team Leader</label>
                    <select
                      value={editForm.leaderId}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, leaderId: e.target.value }))}
                    >
                      <option value="">No Leader</option>
                      {leads.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", marginBottom: 8 }}>
                    Assign Team Members
                  </div>
                  <div
                    style={{
                      maxHeight: 210,
                      overflowY: "auto",
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      padding: 8,
                      background: "#f8fafc",
                    }}
                  >
                    {assignableUsers.map((u) => (
                      <label
                        key={u._id}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          padding: "6px 4px",
                          fontSize: 13,
                          color: "#0f172a",
                          fontWeight: 600,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editForm.memberIds.includes(u._id)}
                          onChange={() => toggleMember(u._id)}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>
                          {u.name} ({u.role})
                        </span>
                      </label>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button className="btn btn-success btn-sm" onClick={() => saveTeamMembers(t)}>
                      Save
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={cancelEditTeam}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageTeams;

