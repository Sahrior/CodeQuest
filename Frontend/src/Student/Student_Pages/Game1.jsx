import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentNav from "../Student_Components/StudentNav";
import CodeEditor from "../Student_Components/game/CodeEditor";
import SpaceBattle from "../Student_Components/game/SpaceBattle";
import { HINTS, LEVELS, STARTER_CODE, runLevel } from "../Student_Components/game/game1Logic";

const STORAGE_KEY = "codequest-game1-code";
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

const Game1 = () => {
  const [code, setCode] = useState(loadSavedCode);
  const [levelIndex, setLevelIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [turns, setTurns] = useState(null);
  const [report, setReport] = useState(null);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [compileError, setCompileError] = useState(null);
  const [wave, setWave] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [speed, setSpeed] = useState(2);
  const [hintCount, setHintCount] = useState(0);

  const level = LEVELS[levelIndex];
  const hasNextLevel = levelIndex < LEVELS.length - 1;
  const preview = { d1: level.waves[0][0], d2: level.waves[0][1] };
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
    setWave(0);
    setCleared(0);
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

    const outcome = runLevel(code, level);

    if (outcome.compileError) {
      resetBattle();
      setCompileError(outcome.compileError);
      return;
    }

    setCompileError(null);
    setReport(outcome);
    setTurns(outcome.turns);
    setWave(0);
    setCleared(0);
    setRunId((id) => id + 1);
    setPhase("playing");
  };

  const onFinish = (passed) => {
    setPhase(passed ? "won" : "lost");

    if (passed) {
      setUnlocked((value) => Math.max(value, Math.min(levelIndex + 1, LEVELS.length - 1)));
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
  const shownTurns = report ? (finished ? report.turns : report.turns.filter((turn) => turn.index < cleared)) : [];
  const failedTurn = report && phase === "lost" ? report.turns[report.turns.length - 1] : null;

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
            <h1 className="m-0 mt-2 text-2xl font-bold text-white">Space Defender</h1>
            <p className="m-0 mt-1 text-sm text-slate-400">
              Topic: <span className="font-semibold text-orange-300">if / else</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Levels">
            {LEVELS.map((item, index) => {
              const locked = index > unlocked;
              const active = index === levelIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={locked || playing}
                  title={locked ? "Pass the previous level to unlock this one" : item.description}
                  onClick={() => chooseLevel(index)}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : locked
                        ? "border-white/10 bg-white/5 text-slate-600"
                        : "border-orange-500/30 bg-transparent text-orange-200 hover:bg-orange-500/10"
                  }`}
                >
                  Level {item.id}
                  {locked ? " (locked)" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-6">
            <section className={`${panel} p-3`}>
              <div className="relative overflow-hidden rounded-xl border border-orange-500/30">
                <SpaceBattle
                  turns={turns}
                  runId={runId}
                  speed={speed}
                  preview={preview}
                  onWave={(index) => setWave(index + 1)}
                  onCleared={() => setCleared((value) => value + 1)}
                  onFinish={onFinish}
                />

                <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
                  <span className={chip}>
                    Level {level.id} · {level.name}
                  </span>
                </div>

                <div className="pointer-events-none absolute right-3 top-3 flex flex-wrap justify-end gap-2">
                  <span className={chip}>
                    {wave === 0 ? "Ready" : `Wave ${wave}/${level.waves.length}`}
                  </span>
                  <span className={chip}>Score {cleared * 100}</span>
                </div>

                {finished && (
                  <div className="absolute inset-0 grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
                    <div className="max-w-sm rounded-2xl border border-orange-500/40 bg-[#0e1530] p-6 text-center shadow-2xl">
                      {phase === "won" ? (
                        <>
                          <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                            Level complete
                          </div>
                          <h2 className="m-0 mt-2 text-2xl font-bold text-white">All waves destroyed</h2>
                          <p className="m-0 mt-2 text-sm text-slate-300">
                            Score {cleared * 100}. You always shot the closest ship.
                          </p>
                          <div className="mt-5 flex flex-wrap justify-center gap-2">
                            {hasNextLevel && (
                              <button
                                type="button"
                                onClick={() => chooseLevel(levelIndex + 1)}
                                className="cursor-pointer rounded-lg border border-orange-500 bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                              >
                                Next level
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
                              That was the last level. More games are coming soon.
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-semibold uppercase tracking-widest text-red-300">
                            Mission failed
                          </div>
                          <h2 className="m-0 mt-2 text-2xl font-bold text-white">Your ship was destroyed</h2>
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
                Your program must <span className="text-orange-300">destroy</span> the enemy ships by shooting the
                closest one on every turn.
              </h2>

              <h3 className="m-0 mb-1 mt-5 text-sm font-semibold uppercase tracking-wide text-orange-300">Rules</h3>
              <p className="m-0 text-sm leading-relaxed text-slate-300">
                Enemy ships arrive in pairs. At the start of each turn (inside the game loop) your program reads
                two numbers:
              </p>
              <ul className="my-2 list-disc pl-5 text-sm leading-relaxed text-slate-300">
                <li>
                  <code className={codeTag}>d1</code>: the distance to enemy ship 1
                </li>
                <li>
                  <code className={codeTag}>d2</code>: the distance to enemy ship 2
                </li>
              </ul>
              <p className="m-0 text-sm leading-relaxed text-slate-300">
                Before the turn ends, print the distance of the ship you want to shoot: print{" "}
                <code className={codeTag}>d1</code> to shoot ship 1, or <code className={codeTag}>d2</code> to
                shoot ship 2.
              </p>

              <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm leading-relaxed text-red-100">
                Shoot the closest ship. If you shoot the one that is farther away, the closer ship crashes into
                your spaceship and you lose.
              </div>

              <h3 className="m-0 mb-1 mt-5 text-sm font-semibold uppercase tracking-wide text-orange-300">Example</h3>
              <p className="m-0 text-sm leading-relaxed text-slate-300">
                Input <code className={codeTag}>d1 = 34</code> and <code className={codeTag}>d2 = 81</code>: ship 1
                is closer, so print <code className={codeTag}>34</code>.
              </p>

              <h3 className="m-0 mb-1 mt-5 text-sm font-semibold uppercase tracking-wide text-orange-300">
                Good to know
              </h3>
              <ul className="m-0 list-disc pl-5 text-sm leading-relaxed text-slate-400">
                <li>
                  The distances are never equal, and each turn prints exactly one value.
                </li>
                <li>
                  This editor runs beginner C++: variables, <code className={codeTag}>if / else</code>, loops,
                  comparisons, <code className={codeTag}>cin</code>, <code className={codeTag}>cout</code> and{" "}
                  <code className={codeTag}>min() / max()</code>.
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
                  {playing ? "Running..." : "Submit"}
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
                      <span className="text-slate-500">Turn {turn.index + 1}</span>{" "}
                      <span className="text-slate-300">
                        d1={turn.d1} d2={turn.d2}
                      </span>{" "}
                      <span className="text-slate-400">printed {turn.output || "nothing"}</span>
                      <div className={turn.outcome === "clear" ? "text-emerald-300" : "text-red-300"}>
                        {turn.outcome === "clear" ? "OK  " : "FAIL"} {turn.message}
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

export default Game1;