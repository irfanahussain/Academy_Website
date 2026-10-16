import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getCourses, getMyCourses, enrollInCourse, unenrollFromCourse } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import Reveal from "../components/Reveal.jsx";

const STAGES = [
  { value: "", label: "All programs" },
  { value: "primary", label: "Foundation (8-10)" },
  { value: "middle", label: "Class 11 & 12" },
  { value: "high", label: "Competitive & Dropper" },
];
const STAGE_VALUES = STAGES.map((s) => s.value);

export const FALLBACK_IMAGE = {
  primary: "/course-foundation.svg",
  middle: "/course-middle.svg",
  high: "/course-high.svg",
};

function formatPrice(price) {
  const value = Number(price);
  if (!value) return "Free";
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function Courses() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStage = STAGE_VALUES.includes(searchParams.get("stage"))
    ? searchParams.get("stage")
    : "";
  const [stage, setStage] = useState(initialStage);
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("loading");
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [pendingId, setPendingId] = useState(null);

  function selectStage(value) {
    setStage(value);
    setSearchParams(value ? { stage: value } : {}, { replace: true });
  }

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getCourses(stage)
      .then((data) => {
        if (cancelled) return;
        setCourses(data);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [stage]);

  useEffect(() => {
    if (!user) {
      setEnrolledIds(new Set());
      return;
    }
    let cancelled = false;
    getMyCourses()
      .then((data) => {
        if (!cancelled) setEnrolledIds(new Set(data.map((e) => e.course.id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleEnrollToggle(courseId) {
    setPendingId(courseId);
    try {
      if (enrolledIds.has(courseId)) {
        await unenrollFromCourse(courseId);
        setEnrolledIds((prev) => {
          const next = new Set(prev);
          next.delete(courseId);
          return next;
        });
      } else {
        await enrollInCourse(courseId);
        setEnrolledIds((prev) => new Set(prev).add(courseId));
      }
    } catch {
      // Request failed — leave the button in its previous state.
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <section className="page-header page-header--compact">
        <p className="page-header__eyebrow eyebrow">Academics</p>
        <h1>Courses built around real exam patterns.</h1>
        <p className="page-header__lede">
          From early Foundation batches to intensive Dropper programs, every course is anchored
          in weekly testing, rank tracking, and mentors who specialise in that exact stage.
        </p>
      </section>

      <section className="section section--tight section--tight-bottom">
        <div className="tabs" role="tablist" aria-label="Filter courses by program stage">
          {STAGES.map((s) => (
            <button
              key={s.value || "all"}
              role="tab"
              aria-selected={stage === s.value}
              className={"tabs__button" + (stage === s.value ? " tabs__button--active" : "")}
              onClick={() => selectStage(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {status === "loading" && <p className="state-message">Loading courses…</p>}

        {status === "ready" && courses.length === 0 && (
          <p className="state-message">No courses found for this category yet.</p>
        )}

        {status === "ready" && courses.length > 0 && (
          <div className="course-grid">
            {courses.map((course, i) => (
              <Reveal as="article" key={course.id} className="course-card" delay={(i % 3) * 80}>
                <img
                  className="course-card__image"
                  src={course.image || FALLBACK_IMAGE[course.stage] || "/course-foundation.svg"}
                  alt={course.title}
                />
                <div className="course-card__body">
                  <h3>{course.title}</h3>
                  <p className="course-card__summary">{course.summary}</p>
                  <div className="course-card__tags">
                    <p className="course-card__duration">{course.duration}</p>
                    <p className="course-card__price">{formatPrice(course.price)}</p>
                  </div>
                  <div className="course-card__action">
                    <Link to={`/courses/${course.id}`} className="button button--ghost button--sm">
                      View Details
                    </Link>
                    {!user ? (
                      <Link to="/login" state={{ from: "/courses" }} className="button button--ghost button--sm">
                        Log in to enroll
                      </Link>
                    ) : enrolledIds.has(course.id) ? (
                      <button
                        type="button"
                        className="button button--ghost button--sm"
                        onClick={() => handleEnrollToggle(course.id)}
                        disabled={pendingId === course.id}
                      >
                        {pendingId === course.id ? "Removing…" : "Enrolled ✓ — remove"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button button--primary button--sm"
                        onClick={() => handleEnrollToggle(course.id)}
                        disabled={pendingId === course.id}
                      >
                        {pendingId === course.id ? "Enrolling…" : "Enroll"}
                      </button>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
