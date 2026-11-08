import { API_URL } from "../../api";

export const TIERS = [
  { min: 2400, name: "Grandmaster", color: "#dc2626" },
  { min: 2100, name: "Master", color: "#ea580c" },
  { min: 1900, name: "Candidate Master", color: "#9333ea" },
  { min: 1600, name: "Expert", color: "#2563eb" },
  { min: 1400, name: "Specialist", color: "#0d9488" },
  { min: 1200, name: "Pupil", color: "#16a34a" },
  { min: 0, name: "Newbie", color: "#78716c" },
];

export const tierOf = (rating) => TIERS.find((t) => rating >= t.min);

export const DIFF_COLORS = { easy: "#10b981", medium: "#f59e0b", hard: "#ef4444" };

export const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #fed7aa",
  fontSize: 12,
};

export const linkSmall =
  "text-sm font-medium text-orange-600 no-underline hover:text-orange-700 hover:underline";

export const assetUrl = (value) =>
  value && value.startsWith("/uploads/") ? `${API_URL}${value}` : value;

export const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export const formatShortDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const skillGroupsOf = (profile) =>
  [
    { label: "Tech stack", items: profile.tech_stack, tone: "bg-orange-100 text-orange-700" },
    { label: "Skills", items: profile.skills, tone: "bg-amber-100 text-amber-700" },
    { label: "Preferred languages", items: profile.preferred_languages, tone: "bg-stone-100 text-stone-700" },
    { label: "Algorithms", items: profile.algorithms, tone: "bg-rose-100 text-rose-700" },
  ].filter((group) => group.items.length > 0);

export function Avatar({ name, src, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };

  if (src) {
    return <img className="shrink-0 rounded-full object-cover" style={style} src={assetUrl(src)} alt={name} />;
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600"
      style={style}
    >
      {initialsOf(name)}
    </div>
  );
}

export function Card({ id, title, subtitle, action, className = "", children }) {
  return (
    <section
      id={id}
      className={`min-w-0 scroll-mt-24 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm ${className}`}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-base font-semibold text-stone-900">{title}</h2>
            {subtitle && <p className="m-0 mt-0.5 text-xs text-stone-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }) {
  return <p className="m-0 py-6 text-center text-sm text-stone-500">{children}</p>;
}

export function Chips({ items, tone }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
          {item}
        </span>
      ))}
    </div>
  );
}