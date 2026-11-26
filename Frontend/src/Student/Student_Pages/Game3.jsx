import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StudentNav from "../Student_Components/StudentNav";
import { CHALLENGES, LEVELS, MISSIONS, RANKS } from "../Student_Components/game/galaxy/galaxyData";
import { GRAPHS } from "../Student_Components/game/galaxy/galaxyGraphs";
import GalaxyMap from "../Student_Components/game/galaxy/GalaxyMap";
import CodeChallenge from "../Student_Components/game/galaxy/CodeChallenge";
import { BfsMission, DfsMission, RescueMission } from "../Student_Components/game/galaxy/TraversalMissions";
import DijkstraMission from "../Student_Components/game/galaxy/DijkstraMission";
import BellmanMission from "../Student_Components/game/galaxy/BellmanMission";
import FinalBoss from "../Student_Components/game/galaxy/FinalBoss";
import { BRIEFINGS, LEARN, ProgressionTable, SkillBadges } from "../Student_Components/game/galaxy/GalaxyExtras";
import { btnGhost, btnPrimary, chip, codeTag, panel, sectionTitle } from "../Student_Components/game/galaxy/missionUi";

const STORAGE_KEY = "codequest.galacticRoute.v1";

const loadProgress = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveProgress = (progress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // progress simply is not remembered when storage is blocked
  }
};

const BODIES = {
  dfs: DfsMission,
  bfs: BfsMission,
  rescue: RescueMission,
  dijkstra: DijkstraMission,
  bellman: BellmanMission,
  final: FinalBoss,
};

function Stars({ count, size = "text-xl" }) {
  return (
    <span className={`${size} tracking-wider`} aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < count ? "text-amber-300" : "text-slate-600"}>
          ★
        </span>
      ))}
    </span>
  );
}

// stars, XP and coins for one finished mission
function score(mission, stats, codeInfo) {
  const algoMistakes = stats.mistakes.filter((x) => x.kind === "algo").length;
  const hints = stats.hints + (codeInfo ? codeInfo.hints : 0);
  const mistakes = stats.mistakes.length;
  const stars = 1 + (algoMistakes === 0 ? 1 : 0) + (hints === 0 ? 1 : 0);

  const decisions = stats.right + stats.wrong;
  const updateXp = mission.updateXp && decisions > 0 ? Math.round((mission.updateXp * stats.right) / decisions) : 0;
  const perfect = mistakes === 0 && hints === 0 && (!codeInfo || codeInfo.firstTry);
  const bonus = perfect ? Math.max(10, Math.round(mission.coins / 2)) : 0;

  return { stars, xp: mission.xp + updateXp, coins: mission.coins + bonus, bonus, updateXp, hints, mistakes, algoMistakes, perfect };
}

export default function Game3() {
  const [progress, setProgress] = useState(loadProgress);
  const [view, setView] = useState({ name: "hub" });

  useEffect(() => saveProgress(progress), [progress]);

  const missions = MISSIONS;
  const doneIds = Object.keys(progress);
  const isUnlocked = (index) => index === 0 || Boolean(progress[missions[index - 1].id]);

  const totals = useMemo(() => {
    const xp = Object.values(progress).reduce((sum, p) => sum + p.xp, 0);
    const coins = Object.values(progress).reduce((sum, p) => sum + p.coins, 0);
    const stars = Object.values(progress).reduce((sum, p) => sum + p.stars, 0);
    const rank = [...RANKS].reverse().find((r) => xp >= r.min).name;
    const skills = missions.filter((x) => x.unlock && progress[x.id]).map((x) => x.unlock);
    const all = skills.includes("Bellman-Ford");
    return { xp, coins, stars, rank: all ? "Galactic Navigator" : rank, skills };
  }, [progress, missions]);

  const finishMission = (mission, stats, codeInfo) => {
    const result = score(mission, stats, codeInfo);
    const old = progress[mission.id];
    const best = {
      stars: Math.max(result.stars, old ? old.stars : 0),
      xp: Math.max(result.xp, old ? old.xp : 0),
      coins: Math.max(result.coins, old ? old.coins : 0),
    };
    setProgress({ ...progress, [mission.id]: best });
    setView({ name: "result", mission, result, mistakes: stats.mistakes });
  };

  const resetAll = () => {
    if (window.confirm("Erase all Galactic Route progress?")) {
      setProgress({});
      setView({ name: "hub" });
    }
  };

  const mission = view.mission;

  return (
    <div className="min-h-screen bg-[#070b1a] text-slate-100">
      <StudentNav />

      <main className="mx-auto max-w-[1150px] px-5 pb-16 pt-6">
        {view.name === "hub" ? (
          <Link to="/student/games" className="text-sm font-medium text-orange-300 no-underline hover:text-orange-200">
            ← Back to games
          </Link>
        ) : (
          <button type="button" onClick={() => setView({ name: "hub" })} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-orange-300 hover:text-orange-200">
            ← Back to the galaxy map
          </button>
        )}

        <header className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="m-0 text-2xl font-bold text-orange-100">Galactic Route: The Lost Explorer</h1>
            {mission && view.name !== "result" && <p className="m-0 mt-1 text-sm text-slate-400">{mission.title}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={chip}>Rank: {totals.rank}</span>
            <span className={chip}>XP {totals.xp}</span>
            <span className={chip}>Coins {totals.coins}</span>
            <span className={chip}>★ {totals.stars}</span>
          </div>
        </header>

        <div className="mt-5">
          {view.name === "hub" && (
            <Hub
              missions={missions}
              progress={progress}
              doneCount={doneIds.length}
              isUnlocked={isUnlocked}
              skills={totals.skills}
              onOpen={(m) => setView({ name: "briefing", mission: m })}
              onReset={resetAll}
            />
          )}

          {view.name === "briefing" && <Briefing mission={mission} onStart={() => setView({ name: "run", mission, attempt: 1 })} />}

          {view.name === "run" && (
            <Runner key={`${mission.id}-${view.attempt}`} mission={mission} onFinish={(stats, codeInfo) => finishMission(mission, stats, codeInfo)} />
          )}

          {view.name === "result" && (
            <Result
              mission={mission}
              result={view.result}
              mistakes={view.mistakes}
              nextMission={missions[missions.findIndex((x) => x.id === mission.id) + 1]}
              skills={totals.skills}
              onHub={() => setView({ name: "hub" })}
              onRetry={() => setView({ name: "run", mission, attempt: Date.now() })}
              onNext={(next) => setView({ name: "briefing", mission: next })}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Hub({ missions, progress, doneCount, isUnlocked, skills, onOpen, onReset }) {
  const finished = doneCount === missions.length;

  return (
    <div className="flex flex-col gap-6">
      <section className={`${panel} p-5`}>
        <h2 className={sectionTitle}>Your navigation system</h2>
        <p className="m-0 mt-2 text-sm leading-relaxed text-slate-300">
          You command an exploration ship. Every galaxy is harder than the last, and your navigation system must evolve with it. Each new level starts with a problem your current algorithm cannot solve.
        </p>
        <div className="mt-3">
          <SkillBadges unlocked={skills} />
        </div>
      </section>

      {LEVELS.map((level) => (
        <section key={level.id} className={`${panel} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-orange-400">
                Level {level.id} · {level.difficulty}
              </div>
              <h2 className="m-0 mt-1 text-xl font-bold text-orange-100">{level.name}</h2>
              <p className="m-0 mt-1 text-sm text-slate-400">{level.blurb}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-orange-200">{level.algo}</div>
              <div className="text-xs italic text-slate-400">{level.question}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {missions.map((m, index) => {
              if (m.level !== level.id) return null;
              const open = isUnlocked(index);
              const done = progress[m.id];
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={!open}
                  onClick={() => onOpen(m)}
                  className={`rounded-xl border p-3 text-left ${
                    open ? "cursor-pointer border-orange-500/30 bg-[#0b1226] hover:bg-orange-500/10" : "cursor-not-allowed border-white/10 bg-black/30 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-orange-200">{m.title}</span>
                    {m.boss && <span className="rounded bg-red-500/20 px-1.5 text-[10px] font-bold uppercase text-red-300">Boss</span>}
                  </div>
                  <p className="m-0 mt-1 text-xs leading-relaxed text-slate-400">{m.short}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    {done ? <Stars count={done.stars} size="text-base" /> : <span className="text-slate-500">{open ? "Ready" : "Locked"}</span>}
                    <span className="text-slate-500">{m.xp + m.updateXp} XP max</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {finished && (
        <section className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-5 text-center">
          <h2 className="m-0 text-2xl font-bold text-emerald-200">You have become a Galactic Navigator!</h2>
          <p className="m-0 mt-1 text-sm text-emerald-100">DFS, BFS, Dijkstra and Bellman-Ford are all in your navigation system.</p>
        </section>
      )}

      <ProgressionTable />

      {doneCount > 0 && (
        <div>
          <button type="button" onClick={onReset} className={`${btnGhost} text-xs`}>
            Reset progress
          </button>
        </div>
      )}
    </div>
  );
}

function Briefing({ mission, onStart }) {
  const graph = mission.graph ? GRAPHS[mission.graph] : null;
  const Extra = mission.briefing ? BRIEFINGS[mission.briefing] : null;
  const challenge = mission.challenge ? CHALLENGES[mission.challenge] : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
        <section className={`${panel} p-5`}>
          <h2 className={sectionTitle}>Story</h2>
          {mission.story.map((line) => (
            <p key={line} className="m-0 mt-2 text-sm leading-relaxed text-slate-300">
              {line}
            </p>
          ))}
          <h2 className={`${sectionTitle} mt-4`}>Objective</h2>
          <p className="m-0 mt-2 text-sm leading-relaxed text-slate-300">{mission.objective}</p>
          {challenge && (
            <p className="m-0 mt-3 text-xs text-slate-400">
              After the mission: <span className={codeTag}>{challenge.title}</span>
            </p>
          )}
          <button type="button" className={`${btnPrimary} mt-5`} onClick={onStart}>
            Start mission
          </button>
        </section>

        {graph && (
          <div className={`${panel} p-3`}>
            <GalaxyMap graph={graph} showWeights nodeKinds={mission.start ? { [mission.start]: "start" } : {}} />
          </div>
        )}
      </div>
      {Extra && <Extra />}
    </div>
  );
}

function Runner({ mission, onFinish }) {
  const [bodyStats, setBodyStats] = useState(null);
  const challenge = mission.challenge ? CHALLENGES[mission.challenge] : null;
  const Body = BODIES[mission.kind];

  if (mission.kind === "code") {
    return (
      <CodeChallenge
        challenge={challenge}
        onSolved={(info) => onFinish({ mistakes: [], hints: 0, right: 0, wrong: 0 }, info)}
      />
    );
  }

  if (bodyStats && challenge) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          Mission complete! Now turn the idea into C++ code.
        </div>
        <CodeChallenge challenge={challenge} onSolved={(info) => onFinish(bodyStats, info)} />
      </div>
    );
  }

  return <Body mission={mission} onDone={(stats) => (challenge ? setBodyStats({ ...stats, mistakes: [...stats.mistakes] }) : onFinish(stats, null))} />;
}

function Result({ mission, result, mistakes, nextMission, skills, onHub, onRetry, onNext }) {
  const Learn = mission.learn ? LEARN[mission.learn] : null;
  const last = mission.id === "3D";

  return (
    <div className="flex flex-col gap-5">
      <section className={`${panel} p-6 text-center`}>
        <div className="text-xs font-semibold uppercase tracking-widest text-orange-400">Mission complete</div>
        <h2 className="m-0 mt-1 text-xl font-bold text-orange-100">{mission.title}</h2>
        <div className="mt-2">
          <Stars count={result.stars} size="text-4xl" />
        </div>
        <ul className="m-0 mx-auto mt-3 max-w-md list-none space-y-1 p-0 text-left text-sm text-slate-300">
          <li>★ Mission completed</li>
          <li className={result.algoMistakes === 0 ? "" : "text-slate-500"}>{result.algoMistakes === 0 ? "★" : "☆"} Correct algorithm used</li>
          <li className={result.hints === 0 ? "" : "text-slate-500"}>{result.hints === 0 ? "★" : "☆"} No hints used ({result.hints} used)</li>
        </ul>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className={chip}>+{result.xp} XP{result.updateXp ? ` (${result.updateXp} for distance updates)` : ""}</span>
          <span className={chip}>+{result.coins} coins{result.bonus ? ` (bonus ${result.bonus})` : ""}</span>
          <span className={chip}>{result.mistakes} mistake{result.mistakes === 1 ? "" : "s"}</span>
        </div>
        {result.perfect && <p className="m-0 mt-3 text-sm font-semibold text-emerald-300">Flawless run! Bonus challenge coins awarded.</p>}
      </section>

      {mission.unlock && (
        <section className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-center">
          <div className="text-sm font-bold text-emerald-200">New skill unlocked: {mission.unlock}</div>
          <div className="mt-2 flex justify-center">
            <SkillBadges unlocked={skills} />
          </div>
        </section>
      )}

      {mission.ai && (
        <section className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">Navigation AI</div>
          <p className="m-0 mt-1 text-sm leading-relaxed text-cyan-50">{mission.ai}</p>
        </section>
      )}

      {mistakes.length > 0 && (
        <section className={`${panel} p-4`}>
          <h2 className={sectionTitle}>What the Navigation AI noticed</h2>
          <ul className="m-0 mt-2 space-y-2 pl-5 text-sm text-slate-300">
            {mistakes.slice(0, 4).map((x, i) => (
              <li key={i}>{x.text}</li>
            ))}
          </ul>
        </section>
      )}

      {Learn && <Learn />}

      <p className="m-0 text-sm text-slate-300">{mission.after}</p>

      {mission.whyNext && (
        <section className="rounded-2xl border border-orange-400/40 bg-orange-500/10 p-5">
          <h2 className="m-0 text-lg font-bold text-orange-200">{mission.whyNext.title}</h2>
          {mission.whyNext.lines.map((line) => (
            <p key={line} className="m-0 mt-2 text-sm leading-relaxed text-slate-200">
              {line}
            </p>
          ))}
        </section>
      )}

      {last && (
        <>
          <section className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-center">
            <h2 className="m-0 text-2xl font-bold text-emerald-200">You have become a Galactic Navigator!</h2>
          </section>
          <ProgressionTable />
        </>
      )}

      <div className="flex flex-wrap gap-3">
        {nextMission && (
          <button type="button" className={btnPrimary} onClick={() => onNext(nextMission)}>
            Next: {nextMission.title}
          </button>
        )}
        <button type="button" className={btnGhost} onClick={onRetry}>
          Replay for more stars
        </button>
        <button type="button" className={btnGhost} onClick={onHub}>
          Galaxy map
        </button>
      </div>
    </div>
  );
}
