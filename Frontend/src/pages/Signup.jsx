import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Signup.css";

const ROLES = ["Student", "Company", "Admin"];

export default function Signup() {
  const [role, setRole] = useState("Student");
  const [form, setForm] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };

  const switchRole = (r) => {
    setRole(r);
    setForm({});
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, role };
    console.log(payload);
    // TODO: call your register API here with `payload`
  };

  return (
    <div className="su-page" data-role={role}>
      <div className="su-wrap">
        {/* Logo: click to go back home */}
        <Link to="/" className="su-logo" aria-label="Code Quest home">
          <img src={logo} alt="Code Quest" className="su-logo-img" />
        </Link>

        <form className="su-card" onSubmit={onSubmit}>
          <h1 className="su-title">Join the Quest</h1>
          <p className="su-subtitle">Pick your role and create your account.</p>

          <div className="su-roles" role="tablist">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                className={`su-role ${role === r ? "active" : ""}`}
                onClick={() => switchRole(r)}
              >
                {r}
              </button>
            ))}
          </div>

          {role === "Student" && (
            <>
              <div className="su-field">
                <label htmlFor="fullName">Full name</label>
                <input id="fullName" name="fullName" placeholder="e.g. John Doe" onChange={handleChange} required />
              </div>
              <div className="su-field">
                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" placeholder="name@email.com" onChange={handleChange} required />
              </div>
              <div className="su-field">
                <label htmlFor="education">Education level</label>
                <select id="education" name="education" defaultValue="" onChange={handleChange} required>
                  <option value="" disabled>Select your level</option>
                  <option>High School</option>
                  <option>Undergraduate</option>
                  <option>Graduate</option>
                  <option>Self-taught</option>
                </select>
              </div>
              <div className="su-field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
              </div>
            </>
          )}

          {role === "Company" && (
            <>
              <div className="su-row">
                <div className="su-field">
                  <label htmlFor="companyName">Company name</label>
                  <input id="companyName" name="companyName" placeholder="e.g. Acme Corp" onChange={handleChange} required />
                </div>
                <div className="su-field">
                  <label htmlFor="website">Website</label>
                  <input id="website" name="website" placeholder="acme.com" onChange={handleChange} />
                </div>
              </div>
              <div className="su-row">
                <div className="su-field">
                  <label htmlFor="industry">Industry</label>
                  <select id="industry" name="industry" defaultValue="" onChange={handleChange} required>
                    <option value="" disabled>Select industry</option>
                    <option>Software</option>
                    <option>Fintech</option>
                    <option>E-commerce</option>
                    <option>Education</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="su-field">
                  <label htmlFor="contactEmail">Contact email</label>
                  <input id="contactEmail" name="contactEmail" type="email" placeholder="hiring@company.com" onChange={handleChange} required />
                </div>
              </div>
              <div className="su-field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
                <span className="su-hint">At least 8 characters, with letters and numbers.</span>
              </div>
              <div className="su-field">
                <label htmlFor="document">Business verification document</label>
                <label className="su-upload" htmlFor="document">
                  <span>{form.document ? form.document.name : "Upload your business license or tax ID"}</span>
                  <small>PDF, JPG, or PNG (max. 10MB)</small>
                </label>
                <input id="document" name="document" type="file" accept=".pdf,.jpg,.jpeg,.png" className="su-file" onChange={handleChange} />
              </div>
              <label className="su-check">
                <input type="checkbox" name="agree" onChange={handleChange} required />
                <span>
                  I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                </span>
              </label>
            </>
          )}

          {role === "Admin" && (
            <>
              <div className="su-field">
                <label htmlFor="accessCode">Private access code</label>
                <input id="accessCode" name="accessCode" placeholder="Enter your admin code" onChange={handleChange} required />
              </div>
              <div className="su-field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
              </div>
              <div className="su-field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" onChange={handleChange} required />
              </div>
            </>
          )}

          <button type="submit" className="su-submit">
            {role === "Admin" ? "Create admin account" : "Create account"}
          </button>

          <p className="su-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>

        <Link to="/" className="su-home">← Back to home</Link>
      </div>
    </div>
  );
}