import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const TwoFactorVerify = () => {
  const navigate = useNavigate();
  const { verify2FA } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tempToken = (() => {
    try {
      return sessionStorage.getItem("temp2FAToken") || "";
    } catch (e) {
      return "";
    }
  })();

  const email = (() => {
    try {
      return sessionStorage.getItem("temp2FAEmail") || "";
    } catch (e) {
      return "";
    }
  })();

  const clearTemp2FA = () => {
    try {
      sessionStorage.removeItem("temp2FAToken");
      sessionStorage.removeItem("temp2FAEmail");
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!tempToken) {
      setError("2FA session not found. Please login again.");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    const result = await verify2FA(tempToken, code.trim());
    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    clearTemp2FA();
    const role = result.data?.role;
    if (role === "admin") navigate("/admin-portal/dashboard", { replace: true });
    else if (role === "teamlead") navigate("/teamlead/attendance", { replace: true });
    else navigate("/intern/dashboard", { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Two-Factor Verification</h1>
          <p>{email ? `Code sent for ${email}` : "Enter your 6-digit login code"}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Verify Sign-In</h2>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>6-Digit Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Verifying..." : "Verify 2FA"}
          </button>
          <p className="auth-link">Go back to <Link to="/login" onClick={clearTemp2FA}>Login</Link></p>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
