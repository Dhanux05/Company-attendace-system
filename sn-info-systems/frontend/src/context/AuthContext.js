import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";
import { getCookie, removeCookie, setCookie } from "../utils/cookies";

const AuthContext = createContext();
const parseUserCookie = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return parseUserCookie(getCookie("user"));
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (err) {}

    const syncCurrentUser = async () => {
      const token = getCookie("token");
      if (!token) return;
      try {
        const { data } = await authService.getMe();
        const parsed = parseUserCookie(getCookie("user")) || {};
        const syncedUser = { ...parsed, ...data };
        setCookie("user", JSON.stringify(syncedUser));
        setUser(syncedUser);
      } catch (err) {
        removeCookie("token");
        removeCookie("user");
        setUser(null);
      }
    };
    syncCurrentUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authService.login({ email, password });
      setCookie("token", data.token);
      setCookie("user", JSON.stringify(data));
      setUser(data);
      return { success: true, data };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request ? "Cannot connect to server. Make sure backend is running on port 5000." : "Login failed");
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const { data } = await authService.register(userData);
      setCookie("token", data.token);
      setCookie("user", JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request ? "Cannot connect to server. Make sure backend is running on port 5000." : "Registration failed");
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeCookie("token");
    removeCookie("user");
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (err) {}
    setUser(null);
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    setCookie("user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
