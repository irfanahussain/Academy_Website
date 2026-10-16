import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCourseDetail } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

function formatPrice(price) {
  const value = Number(price);
  if (!value) return "Free";
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function Checkout() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    getCourseDetail(id)
      .then((data) => {
        if (!cancelled) {
          setCourse(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return <p className="state-message" style={{ padding: "3rem 1.5rem" }}>Loading checkout…</p>;
  }

  if (status === "error" || !course) {
    return (
      <p className="state-message" style={{ padding: "3rem 1.5rem" }}>
        We couldn't load that course. <Link to="/courses">Back to all courses</Link>
      </p>
    );
  }

  return (
    <div className="checkout">
      <div className="student__header">
        <p className="eyebrow">Checkout</p>
        <h1>Confirm your enrollment</h1>
        <p className="student__lede">Review your details before payment.</p>
      </div>

      <div className="checkout__grid">
        <div className="checkout__panel">
          <h3>Course</h3>
          <p className="checkout__course-title">{course.title}</p>
          <p className="checkout__course-duration">{course.duration}</p>
        </div>

        <div className="checkout__panel">
          <h3>Student details</h3>
          <p>{user?.full_name}</p>
          <p>{user?.email}</p>
        </div>

        <div className="checkout__panel checkout__panel--total">
          <h3>Amount due</h3>
          <p className="checkout__price">{formatPrice(course.price)}</p>
        </div>
      </div>

      <div className="checkout__payment-note">
        <h3>Payment</h3>
        <p>
          Payment processing isn't wired up yet — this is the next build phase. Once it's live,
          your enrollment will be created automatically only after a successful payment here.
        </p>
        <button type="button" className="button button--primary" disabled>
          Pay {formatPrice(course.price)} — coming soon
        </button>
      </div>

      <Link to={`/courses/${id}`} className="checkout__back">
        ← Back to course details
      </Link>
    </div>
  );
}
