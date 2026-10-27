import Navbar from "./Navbar";

const roles = ["Student", "Company", "Admin"];

// Shared page shell for login + signup: navbar, peach blurs, role switcher.
export default function AuthLayout({ role, setRole, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <Navbar />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-orange-200/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-orange-200/70 blur-3xl" />

      <main className="relative z-10 flex flex-col items-center px-4 pb-16 pt-6">
        <div className="mb-8 flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-full px-5 py-1.5 text-sm transition ${
                role === r ? "bg-orange-200 font-semibold text-slate-900" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}