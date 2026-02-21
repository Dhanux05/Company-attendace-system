import axios from 'axios';
import { getCookie, removeCookie } from '../utils/cookies';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = getCookie('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      removeCookie('token');
      removeCookie('user');
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (e) {}
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authService = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  saveFace: (embedding) => API.post('/auth/face', { embedding }),
  getFace: () => API.get('/auth/face'),
};

export const attendanceService = {
  markLogin: (data) => API.post('/attendance/login', data),
  markLogout: (data) => API.post('/attendance/logout', data),
  getToday: () => API.get('/attendance/today'),
  getMy: (params) => API.get('/attendance/my', { params }),
  getTeam: (params) => API.get('/attendance/team', { params }),
  getAll: (params) => API.get('/attendance/all', { params }),
  getAnalytics: () => API.get('/attendance/analytics'),
};

export const leaveService = {
  apply: (data) => API.post('/leaves', data),
  getMy: () => API.get('/leaves/my'),
  getTeam: () => API.get('/leaves/team'),
  getAll: (params) => API.get('/leaves/all', { params }),
  getStats: () => API.get('/leaves/stats'),
  review: (id, data) => API.patch(`/leaves/${id}/review`, data),
};

export const userService = {
  getAll: () => API.get('/users'),
  getTeamMembers: () => API.get('/users/team-members'),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
  addToTeam: (id, teamId) => API.post(`/users/${id}/team`, { teamId }),
  createTeam: (data) => API.post('/users/teams', data),
  getTeams: () => API.get('/users/teams'),
  updateTeam: (id, data) => API.put(`/users/teams/${id}`, data),
  deleteTeam: (id) => API.delete(`/users/teams/${id}`),
};

export default API;
