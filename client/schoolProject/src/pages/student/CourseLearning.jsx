import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCourseLearn,
  markLessonComplete,
  markLessonIncomplete,
  downloadLessonFile,
} from "../../api.js";
import { FALLBACK_IMAGE } from "../Courses.jsx";

const STAGE_LABELS = {
  primary: "Foundation (Class 8-10)",
  middle: "Class 11 & 12",
  high: "Competitive / Dropper Batch",
};

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let videoId = null;

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1];
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1];
      }
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

export default function CourseLearning() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  // Flow: "subjects" -> "lessons" -> "lesson"
  const [view, setView] = useState("subjects");
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);

  const [pendingLessonId, setPendingLessonId] = useState(null);
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getCourseLearn(id)
      .then((data) => {
        if (cancelled) return;
        setCourse(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.data?.detail || "You don't have access to this course.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const activeSubject = useMemo(
    () => course?.subjects.find((s) => s.id === activeSubjectId) || null,
    [course, activeSubjectId]
  );

  const activeLesson = useMemo(
    () => activeSubject?.lessons.find((l) => l.id === activeLessonId) || null,
    [activeSubject, activeLessonId]
  );

  const embedUrl = getYoutubeEmbedUrl(activeLesson?.youtube_url);

  function openSubject(subject) {
    setActiveSubjectId(subject.id);
    setView("lessons");
  }

  function openLesson(lesson) {
    setActiveLessonId(lesson.id);
    setView("lesson");
  }

  function backToSubjects() {
    setView("subjects");
    setActiveSubjectId(null);
    setActiveLessonId(null);
  }

  function backToLessons() {
    setView("lessons");
    setActiveLessonId(null);
  }

  async function toggleComplete(lesson) {
    setPendingLessonId(lesson.id);
    try {
      if (lesson.completed) {
        await markLessonIncomplete(lesson.id);
      } else {
        await markLessonComplete(lesson.id);
      }
      setCourse((prev) => {
        if (!prev) return prev;
        const subjects = prev.subjects.map((subject) => ({
          ...subject,
          lessons: subject.lessons.map((l) =>
            l.id === lesson.id ? { ...l, completed: !l.completed } : l
          ),
        }));
        const total = subjects.reduce((sum, s) => sum + s.lessons.length, 0);
        const completed = subjects.reduce(
          (sum, s) => sum + s.lessons.filter((l) => l.completed).length,
          0
        );
        return {
          ...prev,
          subjects,
          progress: { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 },
        };
      });
    } catch {
      // Leave state as-is if the request fails.
    } finally {
      setPendingLessonId(null);
    }
  }

  async function handleDownload(file) {
    setDownloadingFileId(file.id);
    try {
      await downloadLessonFile(file.download_url, file.label);
    } catch {
      // Could surface a toast here; keep silent for now.
    } finally {
      setDownloadingFileId(null);
    }
  }

  if (status === "loading") {
    return <p className="state-message">Loading course…</p>;
  }

  if (status === "error") {
    return (
      <div className="student__empty-card">
        <h3>Can't open this course</h3>
        <p>{error}</p>
        <Link to="/dashboard/courses" className="button button--primary button--sm">
          Back to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="learn">
      <div className="learn__banner">
        <div className="learn__banner-copy">
          <p className="eyebrow">Course Learning</p>
          <h1>{course.title}</h1>
          {(course.stage || course.duration) && (
            <p className="learn__banner-meta">
              {STAGE_LABELS[course.stage] || course.stage}
              {course.stage && course.duration ? " · " : ""}
              {course.duration}
            </p>
          )}
          <div className="learn__progress-bar" role="progressbar" aria-valuenow={course.progress.percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="learn__progress-fill" style={{ width: `${course.progress.percent}%` }} />
          </div>
          <p className="learn__progress-label">
            {course.progress.completed} of {course.progress.total} lessons complete ({course.progress.percent}%)
          </p>
        </div>
        <img
          className="learn__banner-illustration"
          src={FALLBACK_IMAGE[course.stage] || "/course-foundation.svg"}
          alt=""
          aria-hidden="true"
        />
      </div>

      {/* Step 1: Subjects */}
      {view === "subjects" && (
        <div className="learn__list">
          {course.subjects.length === 0 && (
            <p className="state-message">This course doesn't have any subjects yet.</p>
          )}
          {course.subjects.map((subject) => {
            const total = subject.lessons.length;
            const completed = subject.lessons.filter((l) => l.completed).length;
            return (
              <button
                key={subject.id}
                type="button"
                className="learn__list-item"
                onClick={() => openSubject(subject)}
              >
                <span className="learn__list-item-title">{subject.title}</span>
                <span className="learn__list-item-meta">
                  {total} lesson{total === 1 ? "" : "s"}
                  {total > 0 ? ` · ${completed}/${total} complete` : ""}
                </span>
                <span className="learn__list-item-arrow" aria-hidden="true">›</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Lessons within a subject */}
      {view === "lessons" && activeSubject && (
        <div className="learn__step">
          <button type="button" className="learn__crumb" onClick={backToSubjects}>
            ‹ Back to Subjects
          </button>
          <h2 className="learn__step-title">{activeSubject.title}</h2>

          <div className="learn__list">
            {activeSubject.lessons.length === 0 && (
              <p className="state-message">This subject doesn't have any lessons yet.</p>
            )}
            {activeSubject.lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                type="button"
                className="learn__list-item"
                onClick={() => openLesson(lesson)}
              >
                <span className="learn__lesson-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="learn__list-item-title">{lesson.title}</span>
                <span
                  className={"learn__lesson-play" + (lesson.completed ? " learn__lesson-play--done" : "")}
                  aria-hidden="true"
                >
                  {lesson.completed ? "✓" : "▶"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Lesson Details + Lesson Files */}
      {view === "lesson" && activeSubject && activeLesson && (
        <div className="learn__step">
          <button type="button" className="learn__crumb" onClick={backToLessons}>
            ‹ Back to {activeSubject.title}
          </button>

          <div className="learn__viewer">
            <h2>{activeLesson.title}</h2>

            {embedUrl && (
              <div className="learn__video">
                <iframe
                  src={embedUrl}
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {activeLesson.files.length > 0 && (
              <div className="learn__files">
                <h3>Lesson Files</h3>
                <ul>
                  {activeLesson.files.map((file) => (
                    <li key={file.id}>
                      <button
                        type="button"
                        className="button button--ghost button--sm"
                        onClick={() => handleDownload(file)}
                        disabled={downloadingFileId === file.id}
                      >
                        {downloadingFileId === file.id ? "Downloading…" : `Download: ${file.label}`}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              className={
                "button button--sm " +
                (activeLesson.completed ? "button--ghost" : "button--primary")
              }
              onClick={() => toggleComplete(activeLesson)}
              disabled={pendingLessonId === activeLesson.id}
            >
              {pendingLessonId === activeLesson.id
                ? "Updating…"
                : activeLesson.completed
                ? "Mark as incomplete"
                : "Mark as complete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
