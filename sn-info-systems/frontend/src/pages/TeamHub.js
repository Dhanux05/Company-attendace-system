import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiBriefcase, FiUsers } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/api";
import TeamAnnouncementPanel from "../components/team/TeamAnnouncementPanel";
import "./intern/Pages.css";

const TeamHub = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTeam = async () => {
      try {
        setLoading(true);
        const { data } = await userService.getMyTeam();
        setTeam(data);
        setError("");
      } catch (err) {
        setTeam(null);
        setError(err.response?.data?.message || "Unable to load team details");
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, []);

  const allowCompose = user?.role === "teamlead" || user?.role === "admin";
  const members = Array.isArray(team?.members) ? team.members : [];

  return (
    <div className="page">
      {user?.role === "teamlead" && (
        <div className="sub-nav sub-nav-center">
          <NavLink to="/teamlead/team" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Team</NavLink>
          <NavLink to="/teamlead/members" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Members</NavLink>
          <NavLink to="/teamlead/attendance" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Attendance</NavLink>
          <NavLink to="/teamlead/leaves" className={({ isActive }) => `sub-nav-link ${isActive ? "active" : ""}`}>Leaves</NavLink>
        </div>
      )}

      <div className="page-header page-header-center">
        <h1>{user?.role === "teamlead" ? "Team Hub" : "My Team"}</h1>
        <p>See your assigned team and the latest team announcements</p>
      </div>

      {loading ? (
        <div className="page-card"><div className="empty-state">Loading team...</div></div>
      ) : error ? (
        <div className="page-card"><div className="empty-state">{error}</div></div>
      ) : (
        <>
          <div className="team-overview-grid">
            <div className="page-card team-hero-card">
              <div className="team-overview-head">
                <div className="team-overview-badge">
                  <FiBriefcase />
                  Team
                </div>
                <div className="team-overview-count">
                  <FiUsers style={{ marginRight: 6 }} />
                  {members.length} members
                </div>
              </div>
              <div className="team-hero-copy">
                <h2 className="analytics-section-title team-hero-title">{team?.name || "-"}</h2>
                <p className="team-panel-subtitle team-hero-text">
                  {team?.description || "No team description added yet."}
                </p>
              </div>

              <div className="team-meta-grid">
                <div className="team-meta-card">
                  <span className="team-meta-label">Team Lead</span>
                  <strong>{team?.leader?.name || "Not assigned"}</strong>
                  <span>{team?.leader?.email || "—"}</span>
                </div>
                <div className="team-meta-card">
                  <span className="team-meta-label">Your Role</span>
                  <strong>{user?.role === "teamlead" ? "Team Lead" : "Intern"}</strong>
                  <span>{team?.name || "No team assigned"}</span>
                </div>
              </div>

              <div className="team-member-preview">
                <div className="team-member-preview-head">
                  <h3>Members</h3>
                  {user?.role === "teamlead" ? (
                    <NavLink to="/teamlead/members" className="see-all">Open team members</NavLink>
                  ) : null}
                </div>
                {!members.length ? (
                  <div className="empty-state" style={{ padding: "18px 0 6px" }}>No active team members found</div>
                ) : (
                  <div className="team-member-chip-list">
                    {members.slice(0, 8).map((member) => (
                      <div key={member._id} className="team-member-chip">
                        <span>{member.name}</span>
                        <small>{member.role}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <TeamAnnouncementPanel allowCompose={allowCompose} />
          </div>
        </>
      )}
    </div>
  );
};

export default TeamHub;
