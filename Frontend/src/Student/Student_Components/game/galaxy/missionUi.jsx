import { useCallback, useReducer, useRef, useState } from "react";

export const panel = "rounded-2xl border border-orange-500/20 bg-[#0e1530] shadow-lg shadow-black/30";
export const chip =
  "rounded-md border border-orange-400/30 bg-black/40 px-2.5 py-1 text-xs font-semibold text-orange-200";
export const codeTag = "rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-orange-200";
export const sectionTitle = "m-0 text-sm font-semibold uppercase tracking-wide text-orange-300";
export const btnPrimary =
  "cursor-pointer rounded-lg border border-orange-500 bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "cursor-pointer rounded-lg border border-orange-500/40 bg-transparent px-4 py-2 text-sm font-semibold text-orange-200 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-50";

// Shared bookkeeping for every mission: mistakes, hints, update decisions and the Navigation AI message.
export function useMission(mission) {
  const stats = useRef({ mistakes: [], hints: 0, right: 0, wrong: 0 });
  const [, bump] = useReducer((n) => n + 1, 0);
  const [ai, setAi] = useState({ type: "info", text: mission.aiIntro });

  const say = useCallback((type, text) => setAi({ type, text }), []);

  const mistake = useCallback((kind, text) => {
    stats.current.mistakes.push({ kind, text });
    bump();
    setAi({ type: "error", text });
  }, []);

  const decision = useCallback((ok) => {
    if (ok) stats.current.right += 1;
    else stats.current.wrong += 1;
    bump();
  }, []);

  const hint = useCallback(() => {
    const list = mission.hints || [];
    if (list.length === 0) return;
    const text = list[Math.min(stats.current.hints, list.length - 1)];
    stats.current.hints += 1;
    bump();
    setAi({ type: "hint", text });
  }, [mission]);

  return { ai, say, mistake, decision, hint, stats: stats.current };
}

const AI_STYLE = {
  info: { border: "border-cyan-400/40", bg: "bg-cyan-500/10", label: "text-cyan-300", text: "text-cyan-50" },
  error: { border: "border-red-400/40", bg: "bg-red-500/10", label: "text-red-300", text: "text-red-50" },
  success: { border: "border-emerald-400/40", bg: "bg-emerald-500/10", label: "text-emerald-300", text: "text-emerald-50" },
  hint: { border: "border-amber-400/40", bg: "bg-amber-500/10", label: "text-amber-300", text: "text-amber-50" },
  alert: { border: "border-red-500", bg: "bg-red-600/20 animate-pulse", label: "text-red-300", text: "text-red-50" },
};

export function MissionHud({ m, hideHint = false }) {
  const style = AI_STYLE[m.ai.type] || AI_STYLE.info;
  const label = { error: "Navigation AI: mistake", hint: "Navigation AI: hint", success: "Navigation AI", alert: "CRITICAL NAVIGATION ALERT" }[m.ai.type] || "Navigation AI";

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className={`rounded-xl border p-3 ${style.border} ${style.bg}`} role="status">
        <div className={`text-[11px] font-bold uppercase tracking-widest ${style.label}`}>{label}</div>
        <p className={`m-0 mt-1 text-sm leading-relaxed ${style.text}`}>{m.ai.text}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <span className={chip}>Mistakes {m.stats.mistakes.length}</span>
          <span className={chip}>Hints {m.stats.hints}</span>
        </div>
        {!hideHint && (
          <button type="button" onClick={m.hint} className={`${btnGhost} px-3 py-1 text-xs`}>
            Show hint
          </button>
        )}
      </div>
    </div>
  );
}

export function MissionLayout({ map, side }) {
  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className={`${panel} min-w-0 p-3`}>{map}</div>
      <div className="flex min-w-0 flex-col gap-4">{side}</div>
    </div>
  );
}

export function SidePanel({ title, children, right }) {
  return (
    <section className={`${panel} p-4`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className={sectionTitle}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function AlgoChoice({ question, options, onPick, picked }) {
  return (
    <SidePanel title="Choose your navigation algorithm">
      <p className="m-0 mb-3 text-sm leading-relaxed text-slate-300">{question}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onPick(option.id)}
            disabled={picked === option.id}
            className="cursor-pointer rounded-xl border border-orange-500/30 bg-[#0b1226] p-3 text-left hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="text-base font-bold text-orange-200">{option.label}</div>
            <div className="mt-0.5 text-xs text-slate-400">{option.sub}</div>
          </button>
        ))}
      </div>
    </SidePanel>
  );
}
