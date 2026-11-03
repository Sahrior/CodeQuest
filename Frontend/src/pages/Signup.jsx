import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthShell } from "./Login";
import "./Signup.css";

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
    // register api call krbo  `payload`
  };

  return (
    <AuthShell
      role={role}
      setRole={switchRole}
      title={"Join the\nQuest"}
      sub="Pick your role and create your account."
    >
      <form onSubmit={onSubmit}>
        {role === "Student" && (
          <>
            <div className="au-field">
              <label htmlFor="fullName">Full name</label>
              <input id="fullName" name="fullName" placeholder="e.g. John Doe" onChange={handleChange} required />
            </div>
            <div className="au-field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" placeholder="name@email.com" onChange={handleChange} required />
            </div>
            <div className="au-field">
              <label htmlFor="education">Education level</label>
              <select id="education" name="education" defaultValue="" onChange={handleChange} required>
                <option value="" disabled>Select your level</option>
                <option>High School</option>
                <option>Undergraduate</option>
                <option>Graduate</option>
                <option>Self-taught</option>
              </select>
            </div>
            <div className="au-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
            </div>
          </>
        )}

        {role === "Company" && (
          <>
            <div className="au-row">
              <div className="au-field">
                <label htmlFor="companyName">Company name</label>
                <input id="companyName" name="companyName" placeholder="e.g. Acme Corp" onChange={handleChange} required />
              </div>
              <div className="au-field">
                <label htmlFor="website">Website</label>
                <input id="website" name="website" placeholder="acme.com" onChange={handleChange} />
              </div>
            </div>
            <div className="au-row">
              <div className="au-field">
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
              <div className="au-field">
                <label htmlFor="contactEmail">Contact email</label>
                <input id="contactEmail" name="contactEmail" type="email" placeholder="hiring@company.com" onChange={handleChange} required />
              </div>
            </div>
            <div className="au-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
              <span className="au-hint">At least 8 characters, with letters and numbers.</span>
            </div>
            <div className="au-field">
              <label htmlFor="document">Business verification document</label>
              <label className="au-upload" htmlFor="document">
                <span>{form.document ? form.document.name : "Upload your business license or tax ID"}</span>
                <small>PDF, JPG, or PNG (max. 10MB)</small>
              </label>
              <input id="document" name="document" type="file" accept=".pdf,.jpg,.jpeg,.png" className="au-file" onChange={handleChange} />
            </div>
            <label className="au-check">
              <input type="checkbox" name="agree" onChange={handleChange} required />
              <span>
                I agree to the <a href="#" className="au-link">Terms of Service</a> and <a href="#" className="au-link">Privacy Policy</a>
              </span>
            </label>
          </>
        )}

        {role === "Admin" && (
          <>
            <div className="au-field">
              <label htmlFor="accessCode">Private access code</label>
              <input id="accessCode" name="accessCode" placeholder="Enter your admin code" onChange={handleChange} required />
            </div>
            <div className="au-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
            </div>
            <div className="au-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" onChange={handleChange} required />
            </div>
          </>
        )}

        <button type="submit" className="au-submit">
          {role === "Admin" ? "Create admin account" : "Create account"}
        </button>

        <p className="au-footer">
          Already have an account? <Link to="/login" className="au-link">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}