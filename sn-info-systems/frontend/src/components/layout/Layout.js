import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./Layout.css";

const Layout = () => {
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
    <div className="layout">
      <Sidebar open={sidebarOpen} onNavigate={handleNavigate} />
      {isMobile && sidebarOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}
      <div className={`layout-main ${sidebarOpen ? "" : "expanded"}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
