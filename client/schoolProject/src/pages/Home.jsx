import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCourses } from "../api.js";
import { FALLBACK_IMAGE } from "./Courses.jsx";
import Reveal from "../components/Reveal.jsx";
import AnimatedCounter from "../components/AnimatedCounter.jsx";

const HIGHLIGHTS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3l8 4.5v3c0 4.5-3.4 8.7-8 9.9-4.6-1.2-8-5.4-8-9.9v-3L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Mentors, not just teachers",
    body: "Every batch is led by subject-expert faculty who track each student's progress personally, not just the class average.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Weekly tests & analytics",
    body: "Structured test series with rank-wise performance reports so students and parents always know where they stand.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8.5" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 19c0-3 2.3-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M13.5 14.3c2.3.2 4 2.1 4 4.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    title: "Small, focused batches",
    body: "Batch sizes are kept small on purpose, so doubts get cleared in the room — not left for later.",
  },
];

// Sample figures for demonstration only. Replace with real data before publishing.
const STATS = [
  { value: 12000, suffix: "+", label: "Students mentored" },
  { value: 850, suffix: "+", label: "Medical & engineering selections" },
  { value: 60, suffix: "+", label: "Expert faculty" },
  { value: 18, suffix: "", label: "Years of excellence" },
];

const TESTIMONIALS = [
  {
    quote:
      "The weekly test series and rank analysis kept me honest about where I stood. That discipline is the reason I cracked NEET on my first attempt.",
    name: "Anjali Menon",
    meta: "NEET 2025 · AIR 1,842",
  },
  {
    quote:
      "My JEE mentor didn't just teach formulas — he pushed me to think through problems the way the exam actually asks them.",
    name: "Rahul Nair",
    meta: "JEE Advanced 2025 · IIT Madras",
  },
  {
    quote:
      "Joining the Foundation batch in Class 9 gave me a two-year head start. By Class 11 I was already comfortable with JEE-level questions.",
    name: "Fathima Zahra",
    meta: "Foundation → JEE batch",
  },
];

export default function Home() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getCourses()
      .then((data) => {
        if (!cancelled) setCourses(data.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero__text">
          <p className="hero__eyebrow eyebrow">For NEET, JEE, Foundation & CUET aspirants</p>
          <h1>Rise higher with <span className="text-brand hero__glow">mentors who track every rank</span>.</h1>
          <p className="hero__lede">
            BrightPath Academy pairs concept-first teaching with weekly test analytics and
            small, focused batches — so students walk into exam day prepared, not just practiced.
          </p>
          <div className="hero__actions">
            <Link to="/courses" className="button button--primary">
              Explore Courses
            </Link>
            <Link to="/admissions" className="button button--primary">
              Book a Free Demo Class
            </Link>
          </div>
          <div className="hero__trust">
            <div className="hero__trust-item">
              <span className="hero__trust-value">850+</span>
              <p className="hero__trust-label">Selections last year</p>
            </div>
            <div className="hero__trust-item">
              <span className="hero__trust-value">18 yrs</span>
              <p className="hero__trust-label">Of coaching experience</p>
            </div>
            <div className="hero__trust-item">
              <span className="hero__trust-value">60+</span>
              <p className="hero__trust-label">Expert mentors</p>
            </div>
          </div>
        </div>
        <div className="hero__visual">
          <img
            src="/hero-illustration.svg"
            alt="Student studying at a desk"
            className="hero__image"
          />
        </div>
      </section>

      <div className="marquee" aria-label="Programs we coach for">
        <div className="marquee__track">
          {[0, 1].flatMap((set) =>
            ["NEET", "JEE Main", "JEE Advanced", "Foundation (8–10)", "CUET", "Dropper Batch"].map(
              (item) => (
                <span className="marquee__item" key={`${set}-${item}`} aria-hidden={set === 1 || undefined}>
                  <span className="marquee__dot" />
                  {item}
                </span>
              )
            )
          )}
        </div>
      </div>

      <section className="section stats" style={{ paddingTop: "2.5rem" }}>
        <div className="stats__grid">
          {STATS.map((stat) => (
            <Reveal as="div" key={stat.label} className="stats__item">
              <span className="stats__value">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </span>
              <p className="stats__label">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {courses.length > 0 && (
        <section className="section">
          <Reveal as="div" className="section__head">
            <div>
              <p className="eyebrow">Popular batches</p>
              <h2 className="section__heading">Courses students are enrolling in</h2>
            </div>
            <Link to="/courses" className="button button--ghost button--sm">
              View all courses
            </Link>
          </Reveal>
          <div className="course-grid">
            {courses.map((course, i) => (
              <Reveal as="article" key={course.id} className="course-card" delay={i * 80}>
                <img
                  className="course-card__image"
                  src={course.image || FALLBACK_IMAGE[course.stage] || "/course-foundation.svg"}
                  alt={course.title}
                />
                <div className="course-card__body">
                  <h3>{course.title}</h3>
                  <p className="course-card__summary">{course.summary}</p>
                  <p className="course-card__duration">{course.duration}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <Reveal as="div" className="section__head">
          <div>
            <p className="eyebrow">Why BrightPath</p>
            <h2 className="section__heading">Why families choose <span className="text-brand">BrightPath Academy</span></h2>
          </div>
        </Reveal>
        <div className="highlights">
          {HIGHLIGHTS.map((item, i) => (
            <Reveal as="article" key={item.title} className="highlights__card" delay={i * 80}>
              <div className="highlights__icon" aria-hidden="true">
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <Reveal as="div" className="section__head">
          <div>
            <p className="eyebrow">Success stories</p>
            <h2 className="section__heading">What our <span className="text-brand">students</span> say</h2>
          </div>
        </Reveal>
        <div className="testimonials">
          {TESTIMONIALS.map((t, i) => (
            <Reveal as="article" key={t.name} className="testimonial-card" delay={i * 80}>
              <span className="testimonial-card__quote-mark" aria-hidden="true">
                "
              </span>
              <p className="testimonial-card__quote">{t.quote}</p>
              <div className="testimonial-card__person">
                <span className="testimonial-card__avatar">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <span className="testimonial-card__name">{t.name}</span>
                  <p className="testimonial-card__meta">{t.meta}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section cta-band">
        <div className="cta-band__inner">
          <div>
            <h2>Not sure which batch is right for you?</h2>
            <p>Book a free demo class and get a personalised study-plan recommendation.</p>
          </div>
          <div className="cta-band__actions">
            <Link to="/admissions" className="button button--primary">
              Book a Free Demo Class
            </Link>
            <Link to="/contact" className="button button--on-dark">
              Talk to a Counsellor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}