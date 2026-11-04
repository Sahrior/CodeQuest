import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { API_URL } from "../api";
import "./Signup.css";

export const ROLES = ["Student", "Company", "Admin"];

const copy = {
  Student: { title: "Hello!\nWelcome Back", sub: "Continue your coding journey", idLabel: "Email Address", idPh: "name@example.com", btn: "Sign in to Quest" },
  Company: { title: "Welcome back,\nPartner", sub: "Manage your tech talent pipeline with ease.", idLabel: "Work Email", idPh: "name@company.com", btn: "Login to Dashboard" },
  Admin: { title: "Admin\nPortal", sub: "Platform management access", idLabel: "Admin ID / Private Code", idPh: "Enter your unique ID", btn: "Secure Login" },
};

const HOME = { Student: "/student", Company: "/company", Admin: "/admin" };

const FACES = ["</>", "{ }", ">_", "#", "=>", "01"];
const TILES = [
  { g: "</>", x: 8, y: 10, z: 60, s: 74, d: 6 },
  { g: "{ }", x: 70, y: 8, z: -40, s: 64, d: 7 },
  { g: "git", x: 80, y: 36, z: 90, s: 70, d: 5 },
  { g: "[ ]", x: 6, y: 42, z: -60, s: 60, d: 8 },
  { g: "&&", x: 72, y: 66, z: 20, s: 62, d: 6.5 },
  { g: "fn()", x: 10, y: 74, z: 80, s: 78, d: 7.5 },
  { g: "//", x: 44, y: 84, z: -30, s: 58, d: 5.5 },
  { g: "λ", x: 42, y: 6, z: 70, s: 56, d: 9 },
  { g: "( )", x: 88, y: 84, z: -70, s: 54, d: 8.5 },
];

/* Right-hand 3D coding showcase */
function Showcase() {
  const stage = useRef(null);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    stage.current?.style.setProperty("--ry", `${px * 24}deg`);
    stage.current?.style.setProperty("--rx", `${-py * 24}deg`);
  };
  const onLeave = () => {
    stage.current?.style.setProperty("--ry", "0deg");
    stage.current?.style.setProperty("--rx", "0deg");
  };

  return (
    <aside className="au-right" onMouseMove={onMove} onMouseLeave={onLeave} aria-hidden="true">
      <div className="au-scene">
        <div className="au-stage" ref={stage}>
          <div className="au-cube">
            {FACES.map((f, i) => (
              <div key={i} className={`au-face f${i}`}>{f}</div>
            ))}
          </div>
          {TILES.map((t, i) => (
            <div
              key={i}
              className="au-tile"
              style={{ left: `${t.x}%`, top: `${t.y}%`, "--z": `${t.z}px`, "--s": `${t.s}px`, "--d": `${t.d}s`, "--delay": `${-i * 0.9}s` }}
            >
              <div className="au-tile-in">{t.g}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="au-tagline">Code. Compete. Get hired.</p>
    </aside>
  );
}

/* Shared layout: logo + title + sliding role bar + 3D panel */
export function AuthShell({ role, setRole, title, sub, children }) {
  const idx = ROLES.indexOf(role);
  return (
    <div className="au-page" data-role={role}>
      <section className="au-left">
        <Link to="/" className="au-logo" aria-label="Code Quest home">
          <img src={logo} alt="Code Quest" />
        </Link>

        <div className="au-wrap">
          <h1 className="au-title">{title}</h1>
          <p className="au-sub">{sub}</p>

          <div className="au-roles" role="tablist" style={{ "--i": idx }}>
            <span className="au-pill" />
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                className={`au-role ${role === r ? "active" : ""}`}
                onClick={() => setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <div key={role} className="au-body">{children}</div>
        </div>
      </section>
      <Showcase />
    </div>
  );
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
);
const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.800 0c2.200-1.500 3.200-1.200 3.200-1.200.6 1.600.2 2.800.1 3.100.8.8 1.200 1.800 1.200 3.100 0 4.400-2.700 5.400-5.300 5.700.4.4.8 1.100.8 2.200v3.300c0 .3.2.7.8.6A11.500 11.500 0 0 0 23.500 12C23.500 5.700 18.300.5 12 .5z"/></svg>
);
const EyeIcon = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Student");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const c = copy[role];

  const switchRole = (r) => {
    setRole(r);
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(e.target);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          id: data.get("id"),
          password: data.get("password"),
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Login failed");
        return;
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      navigate(HOME[result.user.role]);
    } catch {
      setError("Cannot reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell role={role} setRole={switchRole} title={c.title} sub={c.sub}>
      <form onSubmit={onSubmit}>
        <div className="au-field">
          <label htmlFor="id">{c.idLabel}</label>
          <input id="id" name="id" type={role === "Admin" ? "text" : "email"} placeholder={c.idPh} required />
        </div>

        <div className="au-field">
          <label htmlFor="password">Password</label>
          <div className="au-pass">
            <input id="password" name="password" type={show ? "text" : "password"} placeholder="Password" required />
            <button type="button" className="au-eye" onClick={() => setShow((s) => !s)} aria-label="Toggle password visibility">
              <EyeIcon off={!show} />
            </button>
          </div>
          <a href="#" className="au-link au-forgot">Forgot Password?</a>
        </div>

        {error && <p style={{ color: "#ef4444", fontSize: "0.9rem", margin: "0 0 12px" }}>{error}</p>}

        <button type="submit" className="au-submit" disabled={loading}>
          {loading ? "Signing in..." : c.btn}
        </button>

        {role !== "Admin" ? (
          <>
            <div className="au-or"><span>OR</span></div>
            <div className="au-social">
              <button type="button"><GoogleIcon /> Google</button>
              <button type="button"><GithubIcon /> {role === "Company" ? "SSO" : "GitHub"}</button>
            </div>
            <p className="au-footer">
              Don&apos;t have an account? <Link to="/signup" className="au-link">Register</Link>
            </p>
          </>
        ) : (
          <p className="au-secure">🔒 256-BIT ENCRYPTED CONNECTION</p>
        )}
      </form>
    </AuthShell>
  );
}