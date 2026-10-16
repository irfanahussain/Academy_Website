import { useState } from "react";
import { submitAdmissionApplication } from "../api.js";

const GRADES = Array.from({ length: 5 }, (_, i) => String(i + 8));

const INITIAL_FORM = {
  student_name: "",
  date_of_birth: "",
  grade_applying_for: "",
  previous_school: "",
  parent_name: "",
  parent_email: "",
  parent_phone: "",
  address: "",
  additional_notes: "",
};

function validate(form) {
  const errors = {};
  if (!form.student_name.trim()) errors.student_name = "Please enter the student's full name.";

  if (!form.date_of_birth) {
    errors.date_of_birth = "Please enter a date of birth.";
  } else {
    const dob = new Date(form.date_of_birth);
    const today = new Date();
    if (dob >= today) errors.date_of_birth = "Date of birth must be in the past.";
  }

  if (!form.grade_applying_for) errors.grade_applying_for = "Please select a class.";

  if (!form.parent_name.trim()) errors.parent_name = "Please enter a parent or guardian name.";
  if (!/^\S+@\S+\.\S+$/.test(form.parent_email)) {
    errors.parent_email = "Please enter a valid email address.";
  }
  if (!/^\+?[0-9 ()\-]{7,20}$/.test(form.parent_phone)) {
    errors.parent_phone = "Please enter a valid phone number.";
  }
  if (!form.address.trim()) errors.address = "Please enter a home address.";

  return errors;
}

export default function AdmissionForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setStatus("submitting");
    try {
      await submitAdmissionApplication(form);
      setStatus("success");
      setForm(INITIAL_FORM);
    } catch (err) {
      if (err.data) {
        const serverErrors = {};
        Object.entries(err.data).forEach(([field, messages]) => {
          serverErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setErrors(serverErrors);
      }
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <section className="page-header">
        <p className="page-header__eyebrow eyebrow">Enrollment</p>
        <h1>Application received.</h1>
        <p className="page-header__lede">
          Thank you for applying to BrightPath Academy. Our counselling team will review
          your application and reach out to the email address provided within 5 business days to
          schedule a free demo class.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="page-header">
        <p className="page-header__eyebrow eyebrow">Enrollment</p>
        <h1>Enroll for the upcoming batch.</h1>
        <p className="page-header__lede">
          Complete the form below to start your BrightPath application. You'll be able to book a free
          demo class and share previous mark sheets once our counselling team follows up.
        </p>
      </section>

      <section className="section">
        <form className="form form--wide" onSubmit={handleSubmit} noValidate>
          {status === "error" && (
            <p className="form__banner form__banner--error">
              We couldn't submit the application. Please check the highlighted fields and try
              again.
            </p>
          )}

          <fieldset className="form__fieldset">
            <legend>Student information</legend>

            <div className="form__row">
              <label htmlFor="student_name">Student's full name</label>
              <input
                id="student_name"
                name="student_name"
                value={form.student_name}
                onChange={handleChange}
              />
              {errors.student_name && <span className="form__error">{errors.student_name}</span>}
            </div>

            <div className="form__row form__row--split">
              <div>
                <label htmlFor="date_of_birth">Date of birth</label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={handleChange}
                />
                {errors.date_of_birth && (
                  <span className="form__error">{errors.date_of_birth}</span>
                )}
              </div>
              <div>
                <label htmlFor="grade_applying_for">Class / batch joining</label>
                <select
                  id="grade_applying_for"
                  name="grade_applying_for"
                  value={form.grade_applying_for}
                  onChange={handleChange}
                >
                  <option value="">Select a class</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      Class {g}
                    </option>
                  ))}
                </select>
                {errors.grade_applying_for && (
                  <span className="form__error">{errors.grade_applying_for}</span>
                )}
              </div>
            </div>

            <div className="form__row">
              <label htmlFor="previous_school">Current school / board (optional)</label>
              <input
                id="previous_school"
                name="previous_school"
                value={form.previous_school}
                onChange={handleChange}
              />
            </div>
          </fieldset>

          <fieldset className="form__fieldset">
            <legend>Parent or guardian information</legend>

            <div className="form__row">
              <label htmlFor="parent_name">Full name</label>
              <input
                id="parent_name"
                name="parent_name"
                value={form.parent_name}
                onChange={handleChange}
              />
              {errors.parent_name && <span className="form__error">{errors.parent_name}</span>}
            </div>

            <div className="form__row form__row--split">
              <div>
                <label htmlFor="parent_email">Email</label>
                <input
                  id="parent_email"
                  name="parent_email"
                  type="email"
                  value={form.parent_email}
                  onChange={handleChange}
                />
                {errors.parent_email && (
                  <span className="form__error">{errors.parent_email}</span>
                )}
              </div>
              <div>
                <label htmlFor="parent_phone">Phone</label>
                <input
                  id="parent_phone"
                  name="parent_phone"
                  value={form.parent_phone}
                  onChange={handleChange}
                />
                {errors.parent_phone && (
                  <span className="form__error">{errors.parent_phone}</span>
                )}
              </div>
            </div>

            <div className="form__row">
              <label htmlFor="address">Home address</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={form.address}
                onChange={handleChange}
              />
              {errors.address && <span className="form__error">{errors.address}</span>}
            </div>
          </fieldset>

          <fieldset className="form__fieldset">
            <legend>Anything else we should know?</legend>
            <div className="form__row">
              <label htmlFor="additional_notes">Additional notes (optional)</label>
              <textarea
                id="additional_notes"
                name="additional_notes"
                rows={4}
                value={form.additional_notes}
                onChange={handleChange}
                placeholder="Preferred batch timing, target exam year, siblings already enrolled, etc."
              />
            </div>
          </fieldset>

          <button type="submit" className="button button--primary" disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting…" : "Submit enrollment"}
          </button>
        </form>
      </section>
    </>
  );
}
