import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CompanyLogo from "../components/common/CompanyLogo";
import "./Auth.css";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (animateOut) return;
    setLoading(true); setError("");
    const result = await login(form.email, form.password);
    if (result.success) {
      setAnimateOut(true);
      const role = result.data.role;
      setTimeout(() => {
        if (role === "admin") navigate("/admin/dashboard");
        else if (role === "teamlead") navigate("/teamlead/attendance");
        else navigate("/intern/dashboard");
      }, 760);
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className={`auth-page auth-signin-page ${animateIn ? "animate-in" : ""} ${animateOut ? "animate-out" : ""}`}>
      <div className="signin-curtain signin-curtain-left" />
      <div className="signin-curtain signin-curtain-right" />
      <div className="auth-card">
        <div className="auth-brand">
          <CompanyLogo size="lg" animate />
          <h1>SN Info Systems</h1>
          <p>Smart Attendance & Leave Management</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Welcome Back</h2>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@company.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="auth-link">Don\'t have an account? <Link to="/register">Register</Link></p>
        </form>
      </div>
    </div>
  );
};

export default Login;
