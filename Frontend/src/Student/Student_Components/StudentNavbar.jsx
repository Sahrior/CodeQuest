import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import MessagesButton from "./MessagesButton";
import { closeSocket } from "../../socketclient";

const NAV_ITEMS = ["Play and Learn", "Practice", "Compete", "Apply", "Interview"];

const StudentNavbar = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(""); // visual only for now
  const [menuOpen, setMenuOpen] = useState(false); // profile dropdown
  const [mobileOpen, setMobileOpen] = useState(false); // hamburger menu
  const profileRef = useRef(null);

  const logout = () => {
    closeSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Close the dropdown on outside click or Escape
  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const linkClass = (item) =>
    `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
      active === item
        ? "bg-orange-50 font-semibold text-orange-600"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-4 md:gap-8 md:px-6">
        {/* Logo */}
        <Link to="/student" aria-label="Go to home" className="flex shrink-0 items-center">
          <img src={logo} alt="Code Quest" className="h-9 w-auto" />
        </Link>

        {/* Middle links (desktop) */}
        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <button key={item} type="button" className={linkClass(item)} onClick={() => setActive(item)}>
              {item}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3 md:gap-4">
          <button
            type="button"
            className="rounded-full bg-gradient-to-br from-orange-400 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-500/30 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-500/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            Buy premium
          </button>

          <MessagesButton />

          {/* Profile + dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Open profile menu"
              onClick={() => setMenuOpen((open) => !open)}
              className={`grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white transition hover:ring-2 hover:ring-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                menuOpen ? "ring-2 ring-orange-500" : "ring-1 ring-slate-200"
              }`}
            >
              pp
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+10px)] w-52 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/student/edit-profile");
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-100"
                >
                  Edit profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>

          {/* Hamburger (mobile / tablet) */}
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-[10px] border border-slate-200 bg-white lg:hidden"
          >
            <span className="h-0.5 w-[18px] rounded bg-slate-900" />
            <span className="h-0.5 w-[18px] rounded bg-slate-900" />
            <span className="h-0.5 w-[18px] rounded bg-slate-900" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          className="flex flex-col gap-0.5 border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-lg lg:hidden"
          aria-label="Mobile"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              className={`${linkClass(item)} text-left`}
              onClick={() => {
                setActive(item);
                setMobileOpen(false);
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};

export default StudentNavbar;