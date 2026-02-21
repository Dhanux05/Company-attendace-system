import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CompanyLogo from "../components/common/CompanyLogo";
import "./Auth.css";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "intern" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    const result = await register(form);
    setLoading(false);
    if (result.success) navigate("/intern/dashboard");
    else setError(result.message);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <CompanyLogo size="lg" />
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
            <input type="password" placeholder="Min 6 characters" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="intern">Intern</option>
              <option value="teamlead">Team Leader</option>
            </select>
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
