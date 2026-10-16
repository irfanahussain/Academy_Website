import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { confirmPasswordReset } from "../api.js";

function validate(form) {
  const errors = {};
  if (!form.password || form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords don't match.";
  }
  return errors;
}

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success
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
      await confirmPasswordReset({ uid, token, newPassword: form.password });
      setStatus("success");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setStatus("idle");
      setServerError(
        err?.data?.detail || "This reset link is invalid or has expired. Please request a new one."
      );
    }
  }

  if (status === "success") {
    return (
      <section className="page-header page-header--plain">
        <h1>Password reset</h1>
        <p className="page-header__lede">Your password has been updated. Redirecting you to log in…</p>
      </section>
    );
  }

  return (
    <>
      <section className="page-header page-header--plain">
        <h1>Choose a new password</h1>
        <p className="page-header__lede">Enter a new password for your account.</p>
      </section>

      <section className="section auth-section">
        <form className="form form--narrow" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <p className="form__banner form__banner--error">
              {serverError} <Link to="/forgot-password">Request a new link</Link>
            </p>
          )}

          <div className="form__row">
            <label htmlFor="password">New password</label>
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

          <div className="form__row">
            <label htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <span className="form__error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="button button--primary" disabled={status === "submitting"}>
            {status === "submitting" ? "Saving…" : "Reset password"}
          </button>
        </form>
      </section>
    </>
  );
}
