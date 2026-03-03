import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../layout/Header";
import AdminPortalSidebar from "./AdminPortalSidebar";
import "./AdminPortalLayout.css";

const AdminPortalLayout = () => {
  const isMobileView = () => typeof window !== "undefined" && window.innerWidth <= 1024;
  const [isMobile, setIsMobile] = useState(isMobileView);
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileView());

  useEffect(() => {
    const onResize = () => {
      const mobile = isMobileView();
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleNavigate = () => {
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="admin-portal-layout">
      <AdminPortalSidebar open={sidebarOpen} onNavigate={handleNavigate} />
      {isMobile && sidebarOpen && (
        <button
          className="admin-portal-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}
      <div className={`admin-portal-main ${sidebarOpen ? "" : "expanded"}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="admin-portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminPortalLayout;
