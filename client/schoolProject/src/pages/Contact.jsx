import {useState} from "react";
import {submitContactMessage} from "../api.js";

const INITIAL_FORM={ name: "", email: "", phone: "", subject: "", message: "" };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email="Please enter a valid email address.";
  if (form.phone && !/^\+?[0-9 ()\-]{7,20}$/.test(form.phone)) {
    errors.phone = "Please enter a valid phone number, or leave this blank.";
  }
  if (!form.subject.trim()) errors.subject="Please add a short subject.";
  if (form.message.trim().length<10) {
    errors.message = "Please write at least 10 characters so we know how to help.";
  }
  return errors;
}

export default function Contact() {
  const [form,setForm] = useState(INITIAL_FORM);
  const [errors,setErrors] = useState({});
  const [status,setStatus] = useState("idle"); 

  function handleChange(event) {
    const {name,value }=event.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors=validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length> 0)return;

    setStatus("submitting");
    try{
      await submitContactMessage(form);
      setStatus("success");
      setForm(INITIAL_FORM);
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <>
      <section className="page-header">
        <p className="page-header__eyebrow eyebrow">Get in touch</p>
        <h1>We'd love to hear from you.</h1>
        <p className="page-header__lede">
          Questions about a course, a free demo class, or anything else — send us a message and
          our counselling team will get back to you within one business day.
        </p>
      </section>

      <section className="section split">
        <div className="contact-info">
          <h2 className="section__heading">Visit or write</h2>
          <p>123 Example Street<br />Your City, Country</p>
          <p>+1 555 010 0100</p>
          <p>admissions@brightpath.example</p>
          <p className="contact-info__hours">Monday – Saturday, 8:00am – 7:00pm</p>
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          {status === "success" && (
            <p className="form__banner form__banner--success">
              Thank you — your message has been sent. We'll be in touch soon.
            </p>
          )}
          {status === "error" && (
            <p className="form__banner form__banner--error">
              Something went wrong sending your message. Please try again in a moment.
            </p>
          )}

          <div className="form__row">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} />
            {errors.name && <span className="form__error">{errors.name}</span>}
          </div>

          <div className="form__row form__row--split">
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
              {errors.email && <span className="form__error">{errors.email}</span>}
            </div>
            <div>
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
              {errors.phone && <span className="form__error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form__row">
            <label htmlFor="subject">Subject</label>
            <input id="subject" name="subject" value={form.subject} onChange={handleChange} />
            {errors.subject && <span className="form__error">{errors.subject}</span>}
          </div>

          <div className="form__row">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={6} value={form.message} onChange={handleChange} />
            {errors.message && <span className="form__error">{errors.message}</span>}
          </div>

          <button type="submit" className="button button--primary" disabled={status === "submitting"}>
            {status === "submitting" ? "Sending…" : "Send message"}
          </button>
        </form>
      </section>
    </>
  );
}
