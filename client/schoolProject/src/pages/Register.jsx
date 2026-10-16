import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const INITIAL_FORM = { fullName: "", email: "", password: "" };

function validate(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Please enter a valid email address.";
  if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
  return errors;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("submitting");
    setServerError("");
    try {
      await register(form.fullName, form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setStatus("idle");
      const data = err?.data || {};
      const firstError =
        data.email?.[0] || data.password?.[0] || data.full_name?.[0] || data.detail;
      setServerError(firstError || "We couldn't create your account. Please try again.");
      return;
    }
    setStatus("success");
  }

  return (
    <>
      <section className="page-header page-header--plain">
        <h1>Create an account</h1>
        <p className="page-header__lede">It only takes a minute.</p>
      </section>

      <section className="section auth-section">
        <form className="form form--narrow" onSubmit={handleSubmit} noValidate>
          {serverError && <p className="form__banner form__banner--error">{serverError}</p>}

          <div className="form__row">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              name="fullName"
              autoComplete="name"
              value={form.fullName}
              onChange={handleChange}
            />
            {errors.fullName && <span className="form__error">{errors.fullName}</span>}
          </div>

          <div className="form__row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <span className="form__error">{errors.email}</span>}
          </div>

          <div className="form__row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <span className="form__error">{errors.password}</span>}
          </div>

          <button type="submit" className="button button--primary" disabled={status === "submitting"}>
            {status === "submitting" ? "Creating account…" : "Create account"}
          </button>

          <p className="form__footnote">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </section>
    </>
  );
}
