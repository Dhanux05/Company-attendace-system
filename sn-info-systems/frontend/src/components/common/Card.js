import React from "react";
import "./Card.css";

const Card = ({ title, value, icon, color = "blue", subtitle }) => (
  <div className={`stat-card card-${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-body">
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  </div>
);

export default Card;
