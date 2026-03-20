import React, { useEffect, useState } from "react";
import { FiBell, FiRefreshCw, FiSend } from "react-icons/fi";
import { notificationService } from "../../services/api";

const TeamAnnouncementPanel = ({ allowCompose = false, compact = false }) => {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const { data } = await notificationService.getTeamAnnouncements({ limit: 20 });
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setItems([]);
      setError(err.response?.data?.message || "Unable to load team announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setSuccess("");
      setError("Announcement message is required");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await notificationService.createTeamAnnouncement({
        title: title.trim(),
        message: message.trim(),
      });

      if (data) {
        setItems((prev) => [data, ...prev]);
      }
      setTitle("");
      setMessage("");
      setError("");
      setSuccess("Announcement posted to your team");
    } catch (err) {
      setSuccess("");
      setError(err.response?.data?.message || "Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-card">
      <div className="team-panel-header">
        <div>
          <h2 className="analytics-section-title" style={{ marginBottom: 6 }}>
            Team Announcements
          </h2>
          <p className="team-panel-subtitle">
            Latest updates shared with your team.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={loadAnnouncements}>
          <FiRefreshCw style={{ marginRight: 6 }} />
          Refresh
        </button>
      </div>

      {allowCompose && (
        <form className="team-announcement-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <textarea
            placeholder="Write an announcement for your team..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={compact ? 3 : 4}
            maxLength={500}
          />
          <div className="team-announcement-actions">
            <span className="team-panel-subtitle">{message.length}/500</span>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              <FiSend style={{ marginRight: 6 }} />
              {submitting ? "Posting..." : "Post Announcement"}
            </button>
          </div>
        </form>
      )}

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading announcements...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No team announcements yet</div>
      ) : (
        <div className="team-announcement-list">
          {items.map((item) => (
            <div key={item._id} className="team-announcement-item">
              <div className="team-announcement-icon">
                <FiBell />
              </div>
              <div className="team-announcement-body">
                <div className="team-announcement-top">
                  <div className="team-announcement-title">{item.title}</div>
                  <div className="team-announcement-time">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="team-announcement-meta">
                  By {item.meta?.announcedBy?.name || "Team lead"}
                </div>
                <div className="team-announcement-message">{item.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamAnnouncementPanel;
