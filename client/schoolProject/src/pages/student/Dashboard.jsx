import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useAuth } from "../../AuthContext.jsx";
import { getCourses, getMyCourses } from "../../api.js";
import { FALLBACK_IMAGE } from "../Courses.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const { search = "" } = useOutletContext() ?? {};
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCourses(), getMyCourses()])
      .then(([allCourses, myCourses]) => {
        if (cancelled) return;
        setCourses(allCourses);
        setEnrolledIds(new Set(myCourses.map((e) => e.course.id)));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "there";

  const visibleCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter(
      (course) =>
        course.title?.toLowerCase().includes(term) ||
        course.summary?.toLowerCase().includes(term)
    );
  }, [courses, search]);

  return (
    <>
      <div className="student__banner">
        <div className="student__banner-copy">
          <p className="eyebrow student__banner-eyebrow">Dashboard</p>
          <h1>Welcome back, {firstName}.</h1>
          <p>Pick up where you left off, or explore a new batch.</p>
        </div>
        <img
          className="student__banner-illustration"
          src="/dashboard-illustration.svg"
          alt=""
          aria-hidden="true"
        />
      </div>

      <div className="student__quick-links">
        <Link to="/dashboard/courses" className="student__quick-link">
          <span className="student__quick-link-icon student__quick-link-icon--courses" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 5.5C4 4.67 4.67 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M20 5.5c0-.83-.67-1.5-1.5-1.5H13v16h5.5c.83 0 1.5-.67 1.5-1.5v-13Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h3>My Courses</h3>
          <p>Continue learning from the batches you're already enrolled in.</p>
        </Link>
        <Link to="/dashboard/profile" className="student__quick-link">
          <span className="student__quick-link-icon student__quick-link-icon--profile" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
          <h3>My Profile</h3>
          <p>Update your name, email, and profile photo.</p>
        </Link>
      </div>

      <h2 className="student__section-title">Our Courses</h2>

      {status === "loading" && <p className="state-message">Loading courses…</p>}
      {status === "error" && <p className="state-message">Couldn't load courses right now.</p>}

      {status === "ready" && visibleCourses.length === 0 && (
        <p className="state-message">No courses match "{search}".</p>
      )}

      {status === "ready" && visibleCourses.length > 0 && (
        <div className="course-grid">
          {visibleCourses.map((course, index) => {
            const enrolled = enrolledIds.has(course.id);
            return (
              <article key={course.id} className="course-card">
                <div className={`course-card__image-wrap course-card__image-wrap--${index % 3}`}>
                  <img
                    className="course-card__image"
                    src={course.image || FALLBACK_IMAGE[course.stage] || "/course-foundation.svg"}
                    alt={course.title}
                  />
                  <span className="course-card__dot course-card__dot--a" aria-hidden="true" />
                  <span className="course-card__dot course-card__dot--b" aria-hidden="true" />
                </div>
                <div className="course-card__body">
                  <h3>{course.title}</h3>
                  <p className="course-card__summary">{course.summary}</p>
                  <p className="course-card__duration">{course.duration}</p>
                  <div className="course-card__action">
                    {enrolled ? (
                      <Link
                        to={`/dashboard/courses/${course.id}/learn`}
                        className="button button--primary button--sm"
                      >
                        Continue Learning
                      </Link>
                    ) : (
                      <Link to={`/courses/${course.id}`} className="button button--primary button--sm">
                        Explore
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
