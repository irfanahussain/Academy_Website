import { Link } from "react-router-dom";
import BrandMark from "./BrandMark.jsx";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__col">
          <div className="footer__brand">
            <BrandMark variant="on-dark" />
            <span>BrightPath Academy</span>
          </div>
          <p className="footer__tagline">
            Structured, result-focused NEET, JEE and Foundation coaching led by expert mentors.
          </p>
          <div className="footer__social" aria-label="Social links">
            <a href="#" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9.5c0-.3.2-.5.5-.5H14z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" />
              </svg>
            </a>
            <a href="#" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6.5" width="18" height="11" rx="3" stroke="currentColor" strokeWidth="1.4" />
                <path d="M10.5 9.5l4.5 2.5-4.5 2.5v-5z" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer__col">
          <h3>Explore</h3>
          <Link to="/about">About us</Link>
          <Link to="/courses">Courses</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/admissions">Enrollment form</Link>
        </div>

        <div className="footer__col">
          <h3>Visit</h3>
          <p>CyberPark</p>
          <p>Your City, Country</p>
          <p>+1 555 010 0100</p>
          <p>admissions@brightpath.example</p>
        </div>

        <div className="footer__col">
          <h3>Office hours</h3>
          <p>Monday – Saturday</p>
          <p>8:00am – 7:00pm</p>
          <Link to="/contact">Send a message →</Link>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {year} BrightPath Academy. All rights reserved.</p>
      </div>

      <button
        type="button"
        className="back-to-top"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 14l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </footer>
  );
}