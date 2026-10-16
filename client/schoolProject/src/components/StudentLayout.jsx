import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import BrandMark from "./BrandMark.jsx";

const NAV = [
  { to: "/dashboard", label: "Home", end: true, icon: "home" },
  { to: "/dashboard/courses", label: "My Courses", end: false, icon: "courses" },
  { to: "/dashboard/profile", label: "Profile", end: false, icon: "profile" },
];

function NavIcon({ name }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "courses") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 5.5C4 4.67 4.67 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H13v16h5.5c.83 0 1.5-.67 1.5-1.5v-13Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "profile") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  return null;
}

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/dashboard/courses": "My Courses",
  "/dashboard/profile": "Profile",
};

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");

  function handleLogout() {
    logout();
    navigate("/");
  }

  const initial = (user?.full_name || user?.email || "S").charAt(0).toUpperCase();
  const pageTitle =
    PAGE_TITLES[location.pathname] ||
    (location.pathname.includes("/learn") ? "Course" : "Dashboard");
  const showSearch = location.pathname === "/dashboard";

  return (
    <section className="student">
      <header className="student__topbar">
        <button
          type="button"
          className="student__hamburger"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>

        <NavLink to="/dashboard" className="student__brand">
          <BrandMark className="student__sidebar-brand-mark student__sidebar-brand-mark--sm" />
          <span>
            Bright<em>Path</em>
          </span>
        </NavLink>

        <NavLink to="/dashboard/profile" className="student__topbar-avatar" aria-label="Profile">
          {user?.avatar ? <img src={user.avatar} alt="" /> : initial}
        </NavLink>
      </header>

      {drawerOpen && (
        <div className="student__drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      )}

      <aside className={"student__drawer" + (drawerOpen ? " student__drawer--open" : "")}>
        <button
          type="button"
          className="student__drawer-close"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        >
          ×
        </button>

        <NavLink to="/dashboard" className="student__sidebar-brand">
          <BrandMark variant="on-dark" className="student__sidebar-brand-mark" />
          <span>
            Bright<em>Path</em>
          </span>
        </NavLink>

        <div className="student__identity">
          <span className="student__avatar" aria-hidden="true">
            {user?.avatar ? <img src={user.avatar} alt="" /> : initial}
          </span>
          <div>
            <p className="student__name">{user?.full_name}</p>
            <p className="student__email">{user?.email}</p>
          </div>
        </div>

        <nav className="student__nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                "student__nav-link" + (isActive ? " student__nav-link--active" : "")
              }
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
         <button type="button" className="student__logout" onClick={handleLogout}>
          Log out
        </button>

        
      </aside>

      <div className="student__main">
        <div className="student__page-header">
          <h1 className="student__page-title">{pageTitle}</h1>
          {showSearch && (
            <label className="student__search" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          )}
        </div>

        <div className="student__content">
          <Outlet context={{ search }} />
        </div>
      </div>
    </section>
  );
}
