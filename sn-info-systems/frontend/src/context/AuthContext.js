import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";
import { getCookie, removeCookie, setCookie } from "../utils/cookies";

const AuthContext = createContext();

const parseUserData = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
};

const setSession = (data) => {
  if (data?.token) setCookie("token", data.token);
  if (data?.refreshToken) setCookie("refreshToken", data.refreshToken);
  setCookie("user", JSON.stringify(data || {}));
};

const extractErrorMessage = (err, fallback) => {
  const apiMessage = err.response?.data?.message;
  const apiErrors = err.response?.data?.errors;
  if (Array.isArray(apiErrors) && apiErrors.length) {
    return apiErrors.map((e) => e.message || e.msg).filter(Boolean).join(", ");
  }
  if (apiMessage) return apiMessage;
  if (err.request) return "Cannot connect to server. Make sure backend is running on port 5000.";
  return fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => parseUserData(getCookie("user")));
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (err) {}

    const syncCurrentUser = async () => {
      const token = getCookie("token");
      const refreshToken = getCookie("refreshToken");
      if (!token && !refreshToken) {
        setAuthReady(true);
        return;
      }

      try {
        if (!token && refreshToken) {
          const { data: refreshed } = await authService.refresh({ refreshToken });
          setSession(refreshed);
          setUser(refreshed);
        }
        const { data } = await authService.getMe();
        const parsed = parseUserData(getCookie("user")) || {};
        const syncedUser = { ...parsed, ...data };
        setCookie("user", JSON.stringify(syncedUser));
        setUser(syncedUser);
      } catch (err) {
        removeCookie("token");
        removeCookie("refreshToken");
        removeCookie("user");
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    };
    syncCurrentUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authService.login({ email, password });

      if (data?.requires2FA) {
        return {
          success: true,
          requires2FA: true,
          tempToken: data.tempToken,
          message: data.message || "2FA verification required",
        };
      }

      setSession(data);
      setUser(data);
      return { success: true, data };
    } catch (err) {
      const message = extractErrorMessage(err, "Login failed");
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (tempToken, code) => {
    setLoading(true);
    try {
      const { data } = await authService.verifyLogin2FA({ tempToken, code });
      setSession(data);
      setUser(data);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "2FA verification failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const { data } = await authService.register(userData);
      setSession(data);
      setUser(data);
      return { success: true };
    } catch (err) {
      const message = extractErrorMessage(err, "Registration failed");
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeCookie("token");
    removeCookie("refreshToken");
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
    <AuthContext.Provider value={{ user, authReady, loading, login, logout, register, updateUser, verify2FA }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
