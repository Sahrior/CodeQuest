import { useNavigate, useLocation, Link } from "react-router-dom";
import logo from "../assets/logo.png";

// Each white pill scrolls to a section on the landing page (never a new page).
const links = [
  { label: "Play & Learn", id: "learn" },
  { label: "Practice", id: "practice" },
  { label: "Compete", id: "compete" },
  { label: "Apply", id: "apply" },
  { label: "Post", id: "post" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const goTo = (id) => {
    if (pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      // coming from login/signup: go home, Landing scrolls after mount
      navigate("/", { state: { scrollTo: id } });
    }
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-linear-to-b from-slate-200/90 to-slate-100/70 px-4 py-3 backdrop-blur md:px-8">
      <Link to="/" className="shrink-0">
        <img src={logo} alt="Code Quest" className="h-12 w-12 rounded-full object-cover" />
      </Link>

      <div className="flex flex-1 items-center gap-3 overflow-x-auto px-2 md:px-6">
        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => goTo(l.id)}
            className="shrink-0 rounded-full bg-white px-5 py-1.5 text-sm text-slate-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            {l.label}
          </button>
        ))}
      </div>

      <Link
        to="/signup"
        className="shrink-0 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Get Started
      </Link>
    </nav>
  );
}