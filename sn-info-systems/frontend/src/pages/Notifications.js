import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { notificationService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./intern/Pages.css";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await notificationService.getMy({ limit: 100 });
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markOneRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const getRoleBasePath = () => {
    if (location.pathname.startsWith("/admin-portal")) return "/admin-portal";
    if (location.pathname.startsWith("/admin")) return "/admin";
    if (location.pathname.startsWith("/teamlead")) return "/teamlead";
    return "/intern";
  };

  const getNotificationTargetPath = (notification) => {
    if (notification?.type === "leave") {
      if (["admin", "teamlead"].includes(user?.role)) {
        return `${getRoleBasePath()}/leaves`;
      }
      return "/intern/leave-history";
    }
    return null;
  };

  const handleNotificationClick = async (notification) => {
    const targetPath = getNotificationTargetPath(notification);
    if (!targetPath) return;
    if (!notification.isRead) {
      await markOneRead(notification._id);
    }
    navigate(targetPath);
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  return (
    <div className="page">
      <div className="page-header page-header-center">
        <h1>Notifications</h1>
        <p>{unreadCount} unread updates</p>
      </div>

      <div className="page-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <h2 className="analytics-section-title" style={{ margin: 0 }}>Inbox</h2>
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark All Read</button>
        </div>

        {loading && <div className="page-loading">Loading...</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !items.length && <div className="empty-state">No notifications</div>}

        {!loading && !!items.length && (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((n) => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: n.isRead ? "1px solid rgba(148, 163, 184, 0.2)" : "1px solid rgba(59, 130, 246, 0.45)",
                  background: n.isRead ? "rgba(15, 23, 42, 0.45)" : "rgba(30, 64, 175, 0.18)",
                  cursor: getNotificationTargetPath(n) ? "pointer" : "default",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 700, color: "#f8fafc" }}>{n.title}</div>
                  {!n.isRead && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markOneRead(n._id);
                      }}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
                <div style={{ marginTop: 6, color: "#cbd5e1", fontSize: 13 }}>{n.message}</div>
                <div style={{ marginTop: 8, color: "#94a3b8", fontSize: 11 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
