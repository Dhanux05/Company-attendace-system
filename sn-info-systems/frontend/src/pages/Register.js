import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Password and Confirm Password must match.");
      return;
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongPasswordRegex.test(form.password)) {
      setError("Password must be 8+ chars with uppercase, lowercase, number, and special character.");
      return;
    }
    setLoading(true); setError("");
    const { confirmPassword, ...payload } = form;
    const result = await register({ ...payload, role: "intern" });
    setLoading(false);
    if (result.success) navigate("/intern/dashboard");
    else setError(result.message);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-sn-wrap">
            <svg
              className="auth-sn-mark"
              viewBox="0 0 560 180"
              role="img"
              aria-label="SN Info Systems"
            >
              <rect x="280" y="26" rx="62" ry="62" width="250" height="128" fill="#273ca5" />
              <text x="38" y="132" fontFamily="Georgia, 'Times New Roman', serif" fontSize="132" fontWeight="700" fill="#273ca5">SN</text>
              <text x="304" y="88" fontFamily="Georgia, 'Times New Roman', serif" fontSize="64" fontWeight="700" fill="#ffffff">INFO</text>
              <text x="304" y="136" fontFamily="Georgia, 'Times New Roman', serif" fontSize="48" fontWeight="700" fill="#ffffff">SYSTEMS</text>
              <circle cx="512" cy="96" r="8" fill="#ffffff" />
            </svg>
          </div>
          <h1>SN Info Systems</h1>
          <p>Smart Attendance & Leave Management</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Create Account</h2>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="John Doe" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@company.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" placeholder="+91 99999 99999" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
              minLength={8}
            />
            <small style={{ color: "#7a879b", display: "block", marginTop: 6 }}>
              Password requirements: at least 8 characters, with uppercase, lowercase, number, and special character.
            </small>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
              required
              minLength={8}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
          <p className="auth-link">Already have an account? <Link to="/login">Sign In</Link></p>
        </form>
      </div>
    </div>
  );
};

export default Register;
