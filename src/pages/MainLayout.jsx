// src/layouts/MainLayout.js
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/Dashboard.css";

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true }); 
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  

  const handleOutsideClick = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isSidebarOpen]);

  return (
    <div className="dashboard">
      {/* Hamburger */}
      <div className="menu-icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <svg width="28" height="28" viewBox="0 0 100 80" fill="#333">
          <rect width="100" height="10" />
          <rect y="30" width="100" height="10" />
          <rect y="60" width="100" height="10" />
        </svg>
      </div>

      {isSidebarOpen && <div className="overlay"></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`} ref={sidebarRef}>
        <div className="sidebar-logo">KM Foundation</div>
        <nav className="sidebar-menu">
          <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""} onClick={() => setIsSidebarOpen(false)}>Dashboard</Link>
          <Link to="/add-student" className={location.pathname === "/add-student" ? "active" : ""} onClick={() => setIsSidebarOpen(false)}>Add Student</Link>
          <Link to="/student-list" className={location.pathname === "/student-list" ? "active" : ""} onClick={() => setIsSidebarOpen(false)}>View Students</Link>
          <Link to="/add-college" className={location.pathname === "/add-college" ? "active" : ""} onClick={() => setIsSidebarOpen(false)}>Add College</Link>
        </nav>

        <div className="logout-container">
          <button className="logout-btn" onClick={handleLogout}>
            🔒 Logout
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
};

export default MainLayout;
