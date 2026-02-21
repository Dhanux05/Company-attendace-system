import React from "react";
import "./CompanyLogo.css";

const CompanyLogo = ({ size = "md", compact = false, animate = false, className = "" }) => {
  const animatedClass = animate ? " company-logo-animated" : "";

  if (compact) {
    return (
      <div className={`company-logo company-logo-${size} company-logo-compact${animatedClass} ${className}`}>
        <span className="company-logo-sn">SN</span>
      </div>
    );
  }

  return (
    <div className={`company-logo company-logo-${size}${animatedClass} ${className}`}>
      <span className="company-logo-sn">SN</span>
      <span className="company-logo-pill">
        <span className="company-logo-info">INFO</span>
        <span className="company-logo-systems">SYSTEMS</span>
      </span>
    </div>
  );
};

export default CompanyLogo;
