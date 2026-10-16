import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCourseDetail, getMyCourses, enrollInCourse, unenrollFromCourse } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { FALLBACK_IMAGE } from "./Courses.jsx";

const STAGE_LABELS = {
  primary: "Foundation (Class 8-10)",
  middle: "Class 11 & 12",
  high: "Competitive / Dropper Batch",
};

function formatPrice(price) {
  const value = Number(price);
  if (!value) return "Free";
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState("loading");
  const [enrolled, setEnrolled] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState("idle");
  const [openSubjectId, setOpenSubjectId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getCourseDetail(id)
      .then((data) => {
        if (cancelled) return;
        setCourse(data);
        setStatus("ready");
        setOpenSubjectId(data.subjects?.[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!user) {
      setEnrolled(false);
      return;
    }
    let cancelled = false;
    getMyCourses()
      .then((data) => {
        if (!cancelled) setEnrolled(data.some((e) => e.course.id === Number(id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  async function handleEnrollToggle() {
    setEnrollStatus("pending");
    try {
      if (enrolled) {
        await unenrollFromCourse(course.id);
        setEnrolled(false);
      } else {
        await enrollInCourse(course.id);
        setEnrolled(true);
      }
    } catch {
      // Request failed — leave the button in its previous state.
    } finally {
      setEnrollStatus("idle");
    }
  }

  if (status === "loading") {
    return (
      <p className="state-message" style={{ padding: "3rem 1.5rem" }}>
        Loading course…
      </p>
    );
  }

  if (status === "error" || !course) {
    return (
      <p className="state-message" style={{ padding: "3rem 1.5rem" }}>
        We couldn't load that course. <Link to="/courses">Back to all courses</Link>
      </p>
    );
  }

  const totalLessons = (course.subjects || []).reduce((sum, s) => sum + s.lessons.length, 0);

  return (
    <div className="course-detail">
      <Link to="/courses" className="checkout__back">
        ← Back to all courses
      </Link>

      <div className="course-detail__hero">
        <img
          className="course-detail__image"
          src={course.image || FALLBACK_IMAGE[course.stage] || "/course-foundation.svg"}
          alt={course.title}
        />

        <div>
          <p className="eyebrow">{STAGE_LABELS[course.stage] || course.stage}</p>
          <h1>{course.title}</h1>
          <p className="course-detail__summary">{course.summary}</p>

          <div className="course-detail__meta">
            <span className="course-detail__price">{formatPrice(course.price)}</span>
            <span className="course-detail__meta-item">{course.duration}</span>
            {course.subjects && course.subjects.length > 0 && (
              <span className="course-detail__meta-item">
                {course.subjects.length} subjects · {totalLessons} lessons
              </span>
            )}
          </div>

          {!user ? (
            <Link
              to="/login"
              state={{ from: `/courses/${course.id}` }}
              className="button button--primary"
            >
              Log in to enroll
            </Link>
          ) : enrolled ? (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link to="/dashboard/courses" className="button button--primary">
                Go to My Courses
              </Link>
              <button
                type="button"
                className="button button--ghost"
                onClick={handleEnrollToggle}
                disabled={enrollStatus === "pending"}
              >
                {enrollStatus === "pending" ? "Removing…" : "Unenroll"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="button button--primary"
              onClick={handleEnrollToggle}
              disabled={enrollStatus === "pending"}
            >
              {enrollStatus === "pending" ? "Enrolling…" : "Enroll now"}
            </button>
          )}
        </div>
      </div>

      <div className="course-detail__body">
        <div className="course-detail__main">
          <section>
            <h2>About this course</h2>
            <p>{course.description}</p>
          </section>

          {course.subjects && course.subjects.length > 0 && (
            <section>
              <h2>Syllabus</h2>
              <div className="syllabus">
                {course.subjects.map((subject) => (
                  <div className="syllabus__subject" key={subject.id}>
                    <button
                      type="button"
                      className="syllabus__subject-toggle"
                      onClick={() =>
                        setOpenSubjectId((cur) => (cur === subject.id ? null : subject.id))
                      }
                      aria-expanded={openSubjectId === subject.id}
                    >
                      <span>{subject.title}</span>
                      <span className="syllabus__count">{subject.lessons.length} lessons</span>
                    </button>
                    {openSubjectId === subject.id && (
                      <ul className="syllabus__lessons">
                        {subject.lessons.map((lesson) => (
                          <li key={lesson.id}>{lesson.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside>
          {course.features && course.features.length > 0 && (
            <div className="course-detail__panel">
              <h3>What you'll get</h3>
              <ul className="course-detail__list">
                {course.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {course.requirements && course.requirements.length > 0 && (
            <div className="course-detail__panel">
              <h3>Requirements</h3>
              <ul className="course-detail__list">
                {course.requirements.map((requirement, i) => (
                  <li key={i}>{requirement}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
