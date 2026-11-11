import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../api";
import { Avatar, tierOf } from "./shared";

export default function StudentSearch({
  onSelect,
  placeholder = "Search students by name, university, skill or handle",
}) {
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const text = term.trim();
  const ready = text.length >= 2;

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const token = localStorage.getItem("token");
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/student/search?q=${encodeURIComponent(text)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Search failed");
        setResults(json.results);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message === "Failed to fetch" ? "Cannot reach the server" : err.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, ready]);

  const choose = (student) => {
    setOpen(false);
    setTerm("");
    setResults([]);

    if (onSelect) {
      onSelect(student);
    } else {
      navigate(`/student/profile/${student.id}`);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" && results.length > 0) choose(results[0]);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3.5 py-2.5 shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
        <svg
          className="h-4 w-4 shrink-0 text-orange-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
          aria-label="Search students"
        />
        {term && (
          <button
            type="button"
            onClick={() => {
              setTerm("");
              setResults([]);
            }}
            className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-lg leading-none text-stone-400 hover:text-stone-600"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {open && ready && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-orange-100 bg-white shadow-lg">
          {error ? (
            <p className="m-0 px-4 py-3 text-sm text-red-600">{error}</p>
          ) : loading && results.length === 0 ? (
            <p className="m-0 px-4 py-3 text-sm text-stone-500">Searching...</p>
          ) : results.length === 0 ? (
            <p className="m-0 px-4 py-3 text-sm text-stone-500">No students found for "{text}".</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => choose(s)}
                    className="flex w-full cursor-pointer items-center gap-3 border-0 bg-white px-4 py-2.5 text-left hover:bg-orange-50"
                  >
                    <Avatar name={s.name} src={s.profile_pic_url} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-stone-900">{s.name}</div>
                      <div className="truncate text-xs text-stone-500">
                        {s.headline || s.university || s.country || "CodeQuest student"}
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: tierOf(s.contest_rating).color }}>
                      {s.contest_rating}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}