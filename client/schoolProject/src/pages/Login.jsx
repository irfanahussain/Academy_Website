import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const INITIAL_FORM = { email: "", password: "" };

function validate(form) {
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Please enter a valid email address.";
  if (!form.password) errors.password = "Please enter your password.";
  return errors;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/dashboard";

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
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setStatus("idle");
      setServerError(err?.data?.detail || "Invalid email or password. Please try again.");
      return;
    }
    setStatus("success");
  }

  return (
    <>
      <section className="page-header page-header--plain">
        <h1>Log in to your account</h1>
        <p className="page-header__lede">Enter your email and password to continue.</p>
      </section>

      <section className="section auth-section">
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

          <div className="form__row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <span className="form__error">{errors.password}</span>}
            <Link to="/forgot-password" className="form__forgot-link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="button button--primary" disabled={status === "submitting"}>
            {status === "submitting" ? "Logging in…" : "Log in"}
          </button>

          <p className="form__footnote">
            New to BrightPath? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </>
  );
}
