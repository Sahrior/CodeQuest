import { useState } from "react";

export default function Field({ label, type = "text", placeholder, options, hint, right }) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  const base =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm font-semibold text-slate-800">
        {label}
        {right}
      </span>
      {options ? (
        <select className={base} defaultValue="">
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <div className="relative">
          <input
            type={isPass && show ? "text" : type}
            placeholder={placeholder}
            className={base}
          />
          {isPass && (
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
            >
              {show ? "Hide" : "Show"}
            </button>
          )}
        </div>
      )}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}