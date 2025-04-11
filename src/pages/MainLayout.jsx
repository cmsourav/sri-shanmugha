import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/sidebar-logo.png";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 769);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 769);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="app-container">
      {/* Desktop Floating Sidebar */}
      <aside
        className="desktop-sidebar"
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Logo" className="logo-img" />
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}
          >
            <svg className="nav-icon" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="nav-text">Dashboard</span>
          </Link>

          <Link
            to="/add-student"
            className={`nav-item ${location.pathname === "/add-student" ? "active" : ""}`}
          >
            <svg className="nav-icon" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            <span className="nav-text">Add Student</span>
          </Link>

          <Link
            to="/student-list"
            className={`nav-item ${location.pathname === "/student-list" ? "active" : ""}`}
          >
            <svg className="nav-icon" viewBox="0 0 24 24">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
            </svg>
            <span className="nav-text">Students</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg className="logout-icon" viewBox="0 0 24 24">
              <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
            </svg>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="mobile-bottom-bar">
      <Link to="/dashboard" className={`mobile-nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}>
      <svg className="mobile-nav-icon" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
      <span>Dashboard</span>
    </Link>

    <Link to="/add-student" className={`mobile-nav-item ${location.pathname === "/add-student" ? "active" : ""}`}>
      <svg className="mobile-nav-icon" viewBox="0 0 24 24">
        <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span>Add</span>
    </Link>

    <Link to="/student-list" className={`mobile-nav-item ${location.pathname === "/student-list" ? "active" : ""}`}>
      <svg className="mobile-nav-icon" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span>Students</span>
    </Link>

    {/* Enhanced Logout Button with Confirmation */}
    <button 
      className="mobile-nav-item logout-btn"
      onClick={() => {
        if (window.confirm('Are you sure you want to logout?')) {
          handleLogout();
        }
      }}
    >
      <svg className="mobile-nav-icon" viewBox="0 0 24 24">
        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              stroke="currentColor" strokeWidth="2" />
      </svg>
      <span>Logout</span>
    </button>
      </nav>

      <main
        className="main-content"
        style={{
          marginLeft: !isMobile
            ? isSidebarExpanded
              ? 'calc(var(--sidebar-expanded) + 40px)'
              : 'calc(var(--sidebar-width) + 40px)'
            : '0'
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default MainLayout;