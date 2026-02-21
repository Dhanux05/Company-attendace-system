import React from "react";
import "./Badge.css";

const colors = {
  Present: "green", Late: "yellow", Absent: "red", "Half Day": "orange",
  Approved: "green", Pending: "yellow", Rejected: "red",
  intern: "blue", teamlead: "purple", admin: "orange",
};

const Badge = ({ status }) => (
  <span className={`badge badge-${colors[status] || "gray"}`}>{status}</span>
);

export default Badge;
