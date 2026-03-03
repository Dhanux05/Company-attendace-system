import axios from "axios";
import { getCookie, removeCookie, setCookie } from "../utils/cookies";

const API = axios.create({ baseURL: "/api" });
let refreshPromise = null;
const inFlightGetRequests = new Map();

const stableStringify = (value) => {
  if (!value || typeof value !== "object") return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
};

const getRequestKey = (url, config = {}) => {
  const params = stableStringify(config.params || {});
  return `GET:${url}:${params}`;
};

const dedupedGet = (url, config = {}) => {
  if (config.skipDedupe) {
    const next = { ...config };
    delete next.skipDedupe;
    return API.get(url, next);
  }

  const requestKey = getRequestKey(url, config);
  const existingRequest = inFlightGetRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = API.get(url, config).finally(() => {
    inFlightGetRequests.delete(requestKey);
  });
  inFlightGetRequests.set(requestKey, request);
  return request;
};

const clearAuthSession = () => {
  removeCookie("token");
  removeCookie("refreshToken");
  removeCookie("user");
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch (e) {}
};

API.interceptors.request.use((config) => {
  const token = getCookie("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (String(config.method || "").toLowerCase() === "get") {
    config.headers["Cache-Control"] = "no-cache";
    config.headers.Pragma = "no-cache";
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config || {};
    const status = err.response?.status;
    const requestUrl = String(originalRequest.url || "");

    if (status !== 401) return Promise.reject(err);

    const isAuthLoginFlow =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/2fa/login-verify");
    const isRefreshRequest = requestUrl.includes("/auth/refresh");

    if (isAuthLoginFlow) return Promise.reject(err);
    if (isRefreshRequest || originalRequest._retry) {
      clearAuthSession();
      window.location.href = "/login";
      return Promise.reject(err);
    }

    const refreshToken = getCookie("refreshToken");
    if (!refreshToken) {
      clearAuthSession();
      window.location.href = "/login";
      return Promise.reject(err);
    }

    originalRequest._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = API.post("/auth/refresh", { refreshToken });
      }
      const { data } = await refreshPromise;
      refreshPromise = null;

      if (data?.token) setCookie("token", data.token);
      if (data?.refreshToken) setCookie("refreshToken", data.refreshToken);
      if (data) setCookie("user", JSON.stringify(data));

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return API(originalRequest);
    } catch (refreshErr) {
      refreshPromise = null;
      clearAuthSession();
      window.location.href = "/login";
      return Promise.reject(refreshErr);
    }
  }
);

export const authService = {
  login: (data) => API.post("/auth/login", data),
  verifyLogin2FA: (data) => API.post("/auth/2fa/login-verify", data),
  refresh: (data) => API.post("/auth/refresh", data),
  logoutAll: () => API.post("/auth/logout-all"),
  enable2FA: () => API.post("/auth/2fa/enable"),
  disable2FA: () => API.post("/auth/2fa/disable"),
  register: (data) => API.post("/auth/register", data),
  getMe: () => dedupedGet("/auth/me"),
  updateProfile: (data) => API.put("/auth/profile", data),
  changePassword: (data) => API.put("/auth/change-password", data),
  saveFace: (embedding) => API.post("/auth/face", { embedding }),
  getFace: () => dedupedGet("/auth/face"),
};

export const attendanceService = {
  markLogin: (data) => API.post("/attendance/login", data),
  markLogout: (data) => API.post("/attendance/logout", data),
  getToday: () => dedupedGet("/attendance/today"),
  getMy: (params) => dedupedGet("/attendance/my", { params }),
  getTeam: (params) => dedupedGet("/attendance/team", { params }),
  getAll: (params) => dedupedGet("/attendance/all", { params }),
  getAnalytics: (params) => dedupedGet("/attendance/analytics", { params }),
  editAttendance: (id, data) => API.put(`/attendance/${id}`, data),
  sendMissedLogoutAlerts: (data) => API.post("/attendance/alerts/missed-logout", data),
};

export const leaveService = {
  apply: (data) => API.post("/leaves", data),
  getMy: () => dedupedGet("/leaves/my"),
  getTeam: (params) => dedupedGet("/leaves/team", { params }),
  getAll: (params) => dedupedGet("/leaves/all", { params }),
  getStats: () => dedupedGet("/leaves/stats"),
  review: (id, data) => API.patch(`/leaves/${id}/review`, data),
};

export const userService = {
  getAll: () => dedupedGet("/users"),
  getTeamMembers: () => dedupedGet("/users/team-members"),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
  addToTeam: (id, teamId) => API.post(`/users/${id}/team`, { teamId }),
  createTeam: (data) => API.post("/users/teams", data),
  getTeams: () => dedupedGet("/users/teams"),
  updateTeam: (id, data) => API.put(`/users/teams/${id}`, data),
  deleteTeam: (id) => API.delete(`/users/teams/${id}`),
};

export const notificationService = {
  getMy: (params) => dedupedGet("/notifications/my", { params }),
  markRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: () => API.patch("/notifications/read-all"),
};

export const auditService = {
  getAll: (params) => dedupedGet("/audit", { params }),
  getTodayTimeline: () => dedupedGet("/audit/timeline/today"),
};

export const reportService = {
  downloadAttendanceCsv: (params) => dedupedGet("/reports/attendance.csv", { params, responseType: "blob" }),
  downloadLeavesCsv: (params) => dedupedGet("/reports/leaves.csv", { params, responseType: "blob" }),
  downloadKpisCsv: (params) => dedupedGet("/reports/kpis.csv", { params, responseType: "blob" }),
  getMonthlySummary: (params) => dedupedGet("/reports/monthly-summary", { params }),
};

export default API;
