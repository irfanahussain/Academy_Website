import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import BrandMark from "./BrandMark.jsx";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
];

const CATEGORIES = [
  { to: "/courses?stage=primary", label: "Foundation (8-10)" },
  { to: "/courses?stage=middle", label: "Class 11 & 12" },
  { to: "/courses?stage=high", label: "Competitive & Dropper" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();

  // Close the mobile menu automatically if the viewport is resized back to desktop.
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 860) setOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <BrandMark />
          <span className="navbar__name">
            Bright<em>Path</em>
          </span>
        </NavLink>

        <button
          className="navbar__toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar__links ${open ? "navbar__links--open" : ""}`}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                "navbar__link" + (isActive ? " navbar__link--active" : "")
              }
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}

          {/* Quick category shortcuts — shown only in the mobile menu. */}
          <div className="navbar__categories">
            <p className="navbar__categories-heading">Popular categories</p>
            {CATEGORIES.map((cat) => (
              <NavLink key={cat.to} to={cat.to} className="navbar__category" onClick={() => setOpen(false)}>
                {cat.label}
              </NavLink>
            ))}
          </div>

          <div className="navbar__auth">
            {status === "ready" && user ? (
              <>
                <NavLink to="/dashboard" className="navbar__link" onClick={() => setOpen(false)}>
                  Dashboard
                </NavLink>
                
              </>
            ) : (
              <NavLink to="/login" className="navbar__link" onClick={() => setOpen(false)}>
                Log in
              </NavLink>
            )}
          </div>

          <NavLink to="/admissions" className="navbar__cta" onClick={() => setOpen(false)}>
            Enroll Now
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
