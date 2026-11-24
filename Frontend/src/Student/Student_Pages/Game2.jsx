import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentNav from "../Student_Components/StudentNav";
import CodeEditor from "../Student_Components/game/CodeEditor";
import VaultBattle from "../Student_Components/game/VaultBattle";
import { HINTS, LEVELS, STARTER_CODE, pickSecret, runLevel } from "../Student_Components/game/game2Logic";

const STORAGE_KEY = "codequest-game2-code";
const SPEEDS = [1, 2, 4];

const loadSavedCode = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && saved.trim() ? saved : STARTER_CODE;
  } catch {
    return STARTER_CODE;
  }
};

const panel = "rounded-2xl border border-orange-500/20 bg-[#0e1530] shadow-lg shadow-black/30";
const chip =
  "rounded-md border border-orange-400/30 bg-black/50 px-2.5 py-1 text-xs font-semibold text-orange-200 backdrop-blur";
const codeTag = "rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-orange-200";
const sectionTitle = "m-0 mb-1 mt-5 text-sm font-semibold uppercase tracking-wide text-orange-300";

const TURN_LABEL = { cracked: "OK  ", continue: "HINT" };
const TURN_COLOR = { cracked: "text-emerald-300", continue: "text-cyan-300" };

const Stars = ({ count, size = "text-3xl" }) => (
  <div className={`${size} tracking-widest`} aria-label={`${count} of 3 stars`}>
    {[1, 2, 3].map((n) => (
      <span key={n} className={n <= count ? "text-amber-300" : "text-slate-600"}>
        ★
      </span>
    ))}
  </div>
);

const Game2 = () => {
  const [code, setCode] = useState(loadSavedCode);
  const [levelIndex, setLevelIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [bestStars, setBestStars] = useState(() => LEVELS.map(() => 0));
  const [turns, setTurns] = useState(null);
  const [report, setReport] = useState(null);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [compileError, setCompileError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [resolved, setResolved] = useState(0);
  const [alarm, setAlarm] = useState(0);
  const [speed, setSpeed] = useState(2);
  const [hintCount, setHintCount] = useState(0);

  const level = LEVELS[levelIndex];
  const hasNextLevel = levelIndex < LEVELS.length - 1;
  const preview = { min: level.min, max: level.max };
  const playing = phase === "playing";

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // saving the draft is only a convenience
    }
  }, [code]);

  const resetBattle = () => {
    setTurns(null);
    setReport(null);
    setCompileError(null);
    setPhase("idle");
    setAttempt(0);
    setResolved(0);
    setAlarm(0);
    setRunId((id) => id + 1);
  };

  const chooseLevel = (index) => {
    if (index > unlocked || playing) return;
    setLevelIndex(index);
    setHintCount(0);
    resetBattle();
  };

  const submit = () => {
    if (playing) return;

    const outcome = runLevel(code, level, pickSecret(level));

    if (outcome.compileError) {
      resetBattle();
      setCompileError(outcome.compileError);
      return;
    }

    setCompileError(null);
    setReport(outcome);
    setTurns(outcome.turns);
    setAttempt(0);
    setResolved(0);
    setAlarm(0);
    setRunId((id) => id + 1);
    setPhase("playing");
  };

  const onFinish = (passed) => {
    setPhase(passed ? "won" : "lost");

    if (passed) {
      setUnlocked((value) => Math.max(value, Math.min(levelIndex + 1, LEVELS.length - 1)));
      setBestStars((list) => list.map((value, index) => (index === levelIndex ? Math.max(value, report.stars) : value)));
    }
  };

  const resetCode = () => {
    if (code !== STARTER_CODE && !window.confirm("Reset your code to the starter code?")) return;
    setCode(STARTER_CODE);
    setCompileError(null);
  };

  const changeCode = (next) => {
    setCode(next);
    if (compileError) setCompileError(null);
  };

  const finished = phase === "won" || phase === "lost";
  const shownTurns = report ? (finished ? report.turns : report.turns.filter((turn) => turn.index < resolved)) : [];
  const failedTurn = report && phase === "lost" ? report.turns[report.turns.length - 1] : null;
  const rangeSize = (level.max - level.min + 1).toLocaleString("en-US");

  return (
    <div className="min-h-screen bg-[#070b17] text-slate-200 [&_button]:font-[inherit]">
      <StudentNav />

      <main className="mx-auto max-w-[1400px] px-5 pb-14 pt-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              to="/student/games"
              className="text-sm font-medium text-orange-300 no-underline hover:text-orange-200 hover:underline"
            >
              ← All games
            </Link>
            <h1 className="m-0 mt-2 text-2xl font-bold text-white">Cyber Vault Hacker</h1>
            <p className="m-0 mt-1 text-sm text-slate-400">
              Topic: <span className="font-semibold text-orange-300">binary search with a while loop</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Levels">
            {LEVELS.map((item, index) => {
              const locked = index > unlocked;
              const active = index === levelIndex;
              const earned = bestStars[index];

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={locked || playing}
                  title={locked ? "Crack the previous vault to unlock this one" : item.description}
                  onClick={() => chooseLevel(index)}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : locked
                        ? "border-white/10 bg-white/5 text-slate-600"
                        : "border-orange-500/30 bg-transparent text-orange-200 hover:bg-orange-500/10"
                  }`}
                >
                  Vault {item.id}
                  {locked ? " (locked)" : earned > 0 ? ` ${"★".repeat(earned)}` : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-6">
            <section className={`${panel} p-3`}>
              <div className="relative overflow-hidden rounded-xl border border-orange-500/30">
                <VaultBattle
                  turns={turns}
                  runId={runId}
                  speed={speed}
                  preview={preview}
                  onAttempt={(index) => setAttempt(index + 1)}
                  onResolved={(index, value) => {
                    setResolved(index + 1);
                    setAlarm(value);
                  }}
                  onFinish={onFinish}
                />

                <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
                  <span className={chip}>
                    Vault {level.id} · {level.name}
                  </span>
                </div>

                <div className="pointer-events-none absolute bottom-3 right-3 flex flex-wrap justify-end gap-2">
                  <span className={chip}>
                    {attempt === 0 ? "Ready" : `Attempt ${attempt}/${level.maxAttempts}`}
                  </span>
                  <span className={chip}>Alarm {alarm}%</span>
                </div>

                {finished && (
                  <div className="absolute inset-0 grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
                    <div className="max-w-sm rounded-2xl border border-orange-500/40 bg-[#0e1530] p-6 text-center shadow-2xl">
                      {phase === "won" ? (
                        <>
                          <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                            Vault cracked
                          </div>
                          <h2 className="m-0 mt-2 text-2xl font-bold text-white">ACCESS GRANTED</h2>
                          <div className="mt-2 flex justify-center">
                            <Stars count={report.stars} />
                          </div>
                          <p className="m-0 mt-2 text-sm text-slate-300">
                            Password {report.secret.toLocaleString("en-US")} found in {report.attempts} attempt
                            {report.attempts === 1 ? "" : "s"}.
                          </p>
                          <p className="m-0 mt-1 text-xs text-slate-400">
                            {report.stars === 3
                              ? "Perfect binary search. Every guess cut the range in half."
                              : `Binary search needs at most ${level.perfect} attempts here. Try again for 3 stars.`}
                          </p>
                          <div className="mt-5 flex flex-wrap justify-center gap-2">
                            {hasNextLevel && (
                              <button
                                type="button"
                                onClick={() => chooseLevel(levelIndex + 1)}
                                className="cursor-pointer rounded-lg border border-orange-500 bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                              >
                                Next vault
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={resetBattle}
                              className="cursor-pointer rounded-lg border border-orange-500/40 bg-transparent px-4 py-2 text-sm font-semibold text-orange-200 hover:bg-orange-500/10"
                            >
                              Play again
                            </button>
                          </div>
                          {!hasNextLevel && (
                            <p className="m-0 mt-3 text-xs text-slate-400">
                              That was the last vault. More games are coming soon.
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-semibold uppercase tracking-widest text-red-300">
                            Hack failed
                          </div>
                          <h2 className="m-0 mt-2 text-2xl font-bold text-white">The vault locked you out</h2>
                          <p className="m-0 mt-2 text-sm text-slate-300">
                            {failedTurn ? failedTurn.message : "Something went wrong."}
                          </p>
                          <button
                            type="button"
                            onClick={resetBattle}
                            className="mt-5 cursor-pointer rounded-lg border border-orange-500 bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                          >
                            Try again
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
                <p className="m-0 text-xs text-slate-400">{level.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Speed</span>
                  {SPEEDS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSpeed(value)}
                      aria-pressed={speed === value}
                      className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-semibold ${
                        speed === value
                          ? "border-orange-500 bg-orange-500/20 text-orange-200"
                          : "border-white/10 bg-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className={`${panel} p-6`}>
              <h2 className="m-0 text-base font-bold text-white">
                Your program must <span className="text-orange-300">crack</span> the vault password using binary
                search, in as few attempts as possible.
              </h2>

              <h3 className={sectionTitle}>Story</h3>
              <p className="m-0 text-sm leading-relaxed text-slate-300">
                You are a hacker breaking into a secured digital vault. The password is a secret whole number
                between <code className={codeTag}>low</code> and <code className={codeTag}>high</code>. A new
                password is chosen every time you press Submit. Vault {level.id} has {rangeSize} possible passwords.
              </p>

              <h3 className={sectionTitle}>Rules</h3>
              <p className="m-0 text-sm leading-relaxed text-slate-300">Your program talks to the vault like this:</p>
              <ol className="my-2 list-decimal pl-5 text-sm leading-relaxed text-slate-300">
                <li>
                  Read two numbers once, at the very start: <code className={codeTag}>low</code> and{" "}
                  <code className={codeTag}>high</code>.
                </li>
                <li>
                  Print one guess, your <code className={codeTag}>mid</code>.
                </li>
                <li>
                  Read one word from the vault: <code className={codeTag}>HIGHER</code>,{" "}
                  <code className={codeTag}>LOWER</code> or <code className={codeTag}>CORRECT</code>.
                </li>
                <li>Use the word to shrink your range, then guess again. Stop when you read CORRECT.</li>
              </ol>
              <p className="m-0 text-sm leading-relaxed text-slate-300">
                <code className={codeTag}>HIGHER</code> means the password is bigger than your guess,{" "}
                <code className={codeTag}>LOWER</code> means it is smaller.
              </p>

              <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm leading-relaxed text-red-100">
                Security alarm: every wrong guess raises the alarm. A guess that eliminates many numbers lowers it
                again, so trying 1, 2, 3 one by one sets it off fast. At 100% the vault locks down and the hack
                fails. You also only get {level.maxAttempts} attempts.
              </div>

              <h3 className={sectionTitle}>Example</h3>
              <p className="m-0 text-sm leading-relaxed text-slate-300">
                Range <code className={codeTag}>1</code> to <code className={codeTag}>128</code>, secret password{" "}
                <code className={codeTag}>90</code>:
              </p>
              <ul className="my-2 list-disc pl-5 font-mono text-[13px] leading-relaxed text-slate-300">
                <li>mid 64: HIGHER</li>
                <li>mid 96: LOWER</li>
                <li>mid 80: HIGHER</li>
                <li>mid 88: HIGHER</li>
                <li>mid 92: LOWER</li>
                <li>mid 90: CORRECT. ACCESS GRANTED!</li>
              </ul>

              <h3 className={sectionTitle}>Stars</h3>
              <p className="m-0 text-sm leading-relaxed text-slate-300">
                <span className="text-amber-300">★★★</span> in {level.perfect} attempts or fewer,{" "}
                <span className="text-amber-300">★★</span> in {level.perfect + 2} or fewer,{" "}
                <span className="text-amber-300">★</span> for any other crack. Crack a vault to unlock a bigger one.
              </p>

              <h3 className={sectionTitle}>Good to know</h3>
              <ul className="m-0 list-disc pl-5 text-sm leading-relaxed text-slate-400">
                <li>
                  Compare words with <code className={codeTag}>==</code>, for example{" "}
                  <code className={codeTag}>{'hint == "HIGHER"'}</code>. Write them in capital letters.
                </li>
                <li>
                  This editor runs beginner C++: variables, <code className={codeTag}>string</code>,{" "}
                  <code className={codeTag}>if / else</code>, <code className={codeTag}>while</code>,{" "}
                  <code className={codeTag}>cin</code> and <code className={codeTag}>cout</code>.
                </li>
                <li>Your code is saved in your browser while you work.</li>
              </ul>
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <section className={`${panel} p-4`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm font-semibold text-orange-200">
                  C++
                </span>
                <button
                  type="button"
                  onClick={resetCode}
                  disabled={playing}
                  className="cursor-pointer rounded-md border border-white/10 bg-transparent px-3 py-1 text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset code
                </button>
              </div>

              <CodeEditor
                value={code}
                onChange={changeCode}
                readOnly={playing}
                errorLine={compileError ? compileError.line : null}
              />

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={submit}
                  disabled={playing}
                  className="min-w-[200px] cursor-pointer rounded-full border-0 bg-[linear-gradient(90deg,#f97316,#f59e0b)] px-10 py-3 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {playing ? "Hacking..." : "Submit"}
                </button>
              </div>
            </section>

            <section className={`${panel} p-4`}>
              <h2 className="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-orange-300">Console</h2>
              <div className="h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#080d1c] p-3 font-mono text-xs leading-5">
                {compileError ? (
                  <div className="text-red-300">
                    <div className="font-bold">
                      Compile error{compileError.line ? ` on line ${compileError.line}` : ""}:
                    </div>
                    <div>{compileError.message}</div>
                    <div className="mt-2 text-slate-500">Fix the problem and press Submit again.</div>
                  </div>
                ) : shownTurns.length === 0 ? (
                  <span className="text-slate-500">
                    {playing
                      ? "Running your program..."
                      : "Your program's results appear here after you press Submit."}
                  </span>
                ) : (
                  shownTurns.map((turn) => (
                    <div key={turn.index} className="mb-1">
                      <span className="text-slate-500">Attempt {turn.index + 1}</span>{" "}
                      <span className="text-slate-300">
                        low={turn.low.toLocaleString("en-US")} high={turn.high.toLocaleString("en-US")}
                      </span>{" "}
                      <span className="text-slate-400">printed {turn.output || "nothing"}</span>
                      <div className={TURN_COLOR[turn.status] || "text-red-300"}>
                        {TURN_LABEL[turn.status] || "FAIL"} {turn.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={`${panel} p-4`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-orange-300">Stuck?</h2>
                <button
                  type="button"
                  onClick={() => setHintCount((value) => Math.min(value + 1, HINTS.length))}
                  disabled={hintCount >= HINTS.length}
                  className="cursor-pointer rounded-md border border-orange-500/40 bg-transparent px-3 py-1 text-xs font-semibold text-orange-200 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {hintCount >= HINTS.length ? "No more hints" : `Show hint (${hintCount}/${HINTS.length})`}
                </button>
              </div>

              {hintCount > 0 && (
                <ol className="m-0 mt-3 list-decimal pl-5 text-sm leading-relaxed text-slate-300">
                  {HINTS.slice(0, hintCount).map((hint) => (
                    <li key={hint} className="mb-1">
                      {hint}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Game2;