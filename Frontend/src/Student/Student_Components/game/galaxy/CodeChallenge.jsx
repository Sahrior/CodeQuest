import { useMemo, useRef, useState } from "react";
import { judgeBlank } from "./exprEval";
import { btnGhost, btnPrimary, chip, panel, sectionTitle } from "./missionUi";

const MARKER = /(___\d+___)/;

function CodeLine({ line, values, results, onChange, blanks, disabled }) {
  const commentAt = line.indexOf("//");
  const code = commentAt === -1 ? line : line.slice(0, commentAt);
  const comment = commentAt === -1 ? "" : line.slice(commentAt);

  return (
    <div className="whitespace-pre leading-8">
      {code.split(MARKER).map((part, index) => {
        const match = /^___(\d+)___$/.exec(part);
        if (!match) return <span key={index}>{part}</span>;

        const id = Number(match[1]);
        const blank = blanks.find((b) => b.id === id);
        const result = results[id];
        const border = result ? (result.ok ? "border-emerald-400 bg-emerald-500/10" : "border-red-400 bg-red-500/10") : "border-orange-400/60 bg-black/40";

        return (
          <input
            key={index}
            value={values[id] || ""}
            disabled={disabled}
            onChange={(e) => onChange(id, e.target.value)}
            placeholder={blank.placeholder}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={`Blank ${id}`}
            style={{ width: `${Math.max(12, (values[id] || "").length + 3)}ch` }}
            className={`mx-0.5 rounded border px-1.5 py-0.5 font-mono text-[13px] text-orange-100 outline-none focus:border-orange-300 ${border}`}
          />
        );
      })}
      {comment && <span className="italic text-slate-500">{comment}</span>}
    </div>
  );
}

export default function CodeChallenge({ challenge, onSolved }) {
  const lines = useMemo(() => challenge.code.split("\n"), [challenge]);
  const [values, setValues] = useState({});
  const [results, setResults] = useState({});
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [shown, setShown] = useState(0);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const solution = useRef({ attempts: 0 });

  const change = (id, value) => {
    setValues((v) => ({ ...v, [id]: value }));
    setResults((r) => ({ ...r, [id]: undefined }));
  };

  const check = () => {
    const next = {};
    challenge.blanks.forEach((blank) => {
      next[blank.id] = judgeBlank(blank, values[blank.id]);
    });
    setResults(next);

    const ok = challenge.blanks.every((blank) => next[blank.id].ok);
    if (ok) {
      solution.current.attempts = attempts;
      setSolved(true);
    } else {
      setAttempts((n) => n + 1);
    }
  };

  const nextHint = () => {
    setShown((n) => Math.min(n + 1, challenge.blanks.length));
    setHintsUsed((n) => n + 1);
  };

  const showSolution = () => {
    const answers = {};
    challenge.blanks.forEach((blank) => {
      answers[blank.id] = blank.answer || blank.accept[0];
    });
    setValues(answers);
    setResults(Object.fromEntries(challenge.blanks.map((b) => [b.id, { ok: true }])));
    setHintsUsed((n) => n + 1);
    setRevealed(true);
    setSolved(true);
  };

  const firstTry = solved && !revealed && solution.current.attempts === 0 && hintsUsed === 0;
  const failures = challenge.blanks.filter((b) => results[b.id] && !results[b.id].ok);

  return (
    <section className={`${panel} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={sectionTitle}>{challenge.title}</h2>
        <span className={chip}>{challenge.level}</span>
      </div>
      <p className="m-0 mt-2 text-sm leading-relaxed text-slate-300">{challenge.intro}</p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-[#0b1020] p-4 font-mono text-[13px] text-slate-200">
        {lines.map((line, index) => (
          <CodeLine
            key={index}
            line={line}
            values={values}
            results={results}
            onChange={change}
            blanks={challenge.blanks}
            disabled={solved}
          />
        ))}
      </div>

      {failures.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {failures.map((blank) => (
            <div key={blank.id} className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-50">
              <span className="text-[11px] font-bold uppercase tracking-widest text-red-300">
                Navigation AI: blank {blank.id}
              </span>
              <p className="m-0 mt-1 leading-relaxed">{results[blank.id].why}</p>
            </div>
          ))}
        </div>
      )}

      {shown > 0 && (
        <ul className="m-0 mt-3 list-disc pl-5 text-sm leading-relaxed text-amber-100">
          {challenge.blanks.slice(0, shown).map((blank) => (
            <li key={blank.id}>
              Blank {blank.id}: {blank.hint}
            </li>
          ))}
        </ul>
      )}

      {solved ? (
        <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3">
          <p className="m-0 text-sm text-emerald-50">
            {revealed
              ? "Solution revealed. Read it carefully, it is exactly what the console did by hand."
              : firstTry
                ? "Perfect! Solved on the first try. Bonus coins unlocked."
                : "Code accepted. The navigation program works."}
          </p>
          <button
            type="button"
            className={`${btnPrimary} mt-3`}
            onClick={() => onSolved({ firstTry, hints: hintsUsed })}
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className={btnPrimary} onClick={check}>
            Check code
          </button>
          <button type="button" className={btnGhost} onClick={nextHint} disabled={shown >= challenge.blanks.length}>
            Hint
          </button>
          {attempts >= 3 && (
            <button type="button" className={btnGhost} onClick={showSolution}>
              Show solution
            </button>
          )}
          <span className="text-xs text-slate-500">Attempts: {attempts}</span>
        </div>
      )}
    </section>
  );
}
