import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyCourses, unenrollFromCourse } from "../../api.js";
import { FALLBACK_IMAGE } from "../Courses.jsx";

export default function StudentCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [status, setStatus] = useState("loading");
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyCourses()
      .then((data) => {
        if (!cancelled) {
          setEnrollments(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUnenroll(courseId) {
    setPendingId(courseId);
    try {
      await unenrollFromCourse(courseId);
      setEnrollments((prev) => prev.filter((e) => e.course.id !== courseId));
    } catch {
      // Request failed — leave the list as-is.
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="student__banner">
        <div className="student__banner-copy">
          <p className="eyebrow student__banner-eyebrow">My Courses</p>
          <h1>Courses you're enrolled in</h1>
          <p>Batches you've signed up for as a BrightPath student.</p>
        </div>
        <img
          className="student__banner-illustration"
          src="/course-foundation.svg"
          alt=""
          aria-hidden="true"
        />
      </div>

      {status === "loading" && <p className="state-message">Loading your courses…</p>}

      {status === "ready" && enrollments.length === 0 && (
        <div className="student__empty-card">
          <h3>You haven't enrolled in any courses yet.</h3>
          <p>Browse the NEET, JEE and Foundation batches available and enroll to see them here.</p>
          <Link to="/courses" className="button button--primary button--sm">
            Browse courses
          </Link>
        </div>
      )}

      {status === "ready" && enrollments.length > 0 && (
        <div className="course-grid">
          {enrollments.map(({ course, progress }) => (
            <article key={course.id} className="course-card">
              <img
                className="course-card__image"
                src={course.image || FALLBACK_IMAGE[course.stage] || "/course-foundation.svg"}
                alt={course.title}
              />
              <div className="course-card__body">
                <h3>{course.title}</h3>
                <p className="course-card__summary">{course.summary}</p>
                <p className="course-card__duration">{course.duration}</p>

                {progress && (
                  <div className="course-card__progress">
                    <div className="learn__progress-bar learn__progress-bar--sm">
                      <div
                        className="learn__progress-fill"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <p className="course-card__progress-label">
                      {progress.completed}/{progress.total} lessons · {progress.percent}%
                    </p>
                  </div>
                )}

                <div className="course-card__action">
                  <Link to={`/dashboard/courses/${course.id}/learn`} className="button button--primary button--sm">
                    Continue Learning
                  </Link>
                  <Link to={`/courses/${course.id}`} className="button button--ghost button--sm">
                    View Details
                  </Link>
                  <button
                    type="button"
                    className="button button--ghost button--sm"
                    onClick={() => handleUnenroll(course.id)}
                    disabled={pendingId === course.id}
                  >
                    {pendingId === course.id ? "Removing…" : "Unenroll"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
