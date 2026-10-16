import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api.js";

function validate(form) {
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Please enter a valid email address.";
  return errors;
}

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | sent
  const [serverError, setServerError] = useState("");

  function handleChange(event) {
    setForm({ email: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("submitting");
    setServerError("");
    try {
      await requestPasswordReset(form.email);
      setStatus("sent");
    } catch {
      setStatus("idle");
      setServerError("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <section className="page-header page-header--plain">
        <h1>Forgot your password?</h1>
        <p className="page-header__lede">
          Enter the email on your account and we'll send you a link to reset it.
        </p>
      </section>

      <section className="section auth-section">
        {status === "sent" ? (
          <div className="form form--narrow">
            <p className="form__banner">
              If an account with that email exists, we've sent a password reset link. Check your
              inbox (and spam folder) for the next steps.
            </p>
            <Link to="/login" className="button button--primary">
              Back to log in
            </Link>
          </div>
        ) : (
          <form className="form form--narrow" onSubmit={handleSubmit} noValidate>
            {serverError && <p className="form__banner form__banner--error">{serverError}</p>}

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

            <button type="submit" className="button button--primary" disabled={status === "submitting"}>
              {status === "submitting" ? "Sending…" : "Send reset link"}
            </button>

            <p className="form__footnote">
              Remembered it? <Link to="/login">Log in</Link>
            </p>
          </form>
        )}
      </section>
    </>
  );
}
