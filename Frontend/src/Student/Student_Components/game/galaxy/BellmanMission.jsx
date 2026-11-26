import { useMemo, useState } from "react";
import GalaxyMap, { distSub } from "./GalaxyMap";
import { GRAPHS } from "./galaxyGraphs";
import { INF, bellmanFord, fmt } from "./graphAlgos";
import { MissionHud, MissionLayout, SidePanel, btnGhost, btnPrimary, chip, useMission } from "./missionUi";

const pathText = (path) => path.join(" → ");

const improves = (dist, e) => dist[e.from] !== INF && dist[e.from] + e.w < dist[e.to];

export default function BellmanMission({ mission, onDone }) {
  const graph = GRAPHS[mission.graph];
  const edges = graph.edgeOrder || graph.edges;
  const V = graph.nodes.length;
  const passes = mission.cycle ? V : V - 1;
  const truth = useMemo(() => bellmanFord(graph, mission.start), [graph, mission]);
  const m = useMission(mission);

  const [s, setS] = useState(() => {
    const dist = {};
    const parent = {};
    graph.nodes.forEach((n) => {
      dist[n.id] = INF;
      parent[n.id] = null;
    });
    dist[mission.start] = 0;
    return { dist, parent, p: 0, i: 0, snaps: [{ ...dist }], marks: [], changed: [], extraImproved: [] };
  });
  const [phase, setPhase] = useState("run");
  const [selected, setSelected] = useState(() => new Set());
  const [route, setRoute] = useState([mission.target]);
  const [answer, setAnswer] = useState(null);

  const target = mission.target;
  const inExtra = mission.cycle && s.p === V - 1;
  const edge = edges[s.i];

  /* One relaxation step on a copy of the state. */
  const stepState = (cur, doUpdate) => {
    const e = edges[cur.i];
    const dist = { ...cur.dist };
    const parent = { ...cur.parent };
    const changed = [...cur.changed];
    const extraImproved = [...cur.extraImproved];
    if (doUpdate) {
      dist[e.to] = dist[e.from] + e.w;
      parent[e.to] = e.from;
      changed.push(`${e.from}>${e.to}`);
      if (mission.cycle && cur.p === V - 1) extraImproved.push(e.to);
    }
    const marks = [...cur.marks, doUpdate ? "u" : "k"];
    let { p, i } = cur;
    const snaps = [...cur.snaps];
    i += 1;
    if (i === edges.length) {
      snaps.push({ ...dist });
      return { dist, parent, p: p + 1, i: 0, snaps, marks: [], changed: [], extraImproved };
    }
    return { dist, parent, p, i, snaps, marks, changed, extraImproved };
  };

  const finishRun = (next) => {
    if (mission.cycle) {
      if (next.extraImproved.length > 0) {
        setPhase("identify");
        m.say(
          "alert",
          "NEGATIVE CYCLE DETECTED. After V - 1 rounds every distance should be final, but the extra pass still found an improvement. Click the planets that form the energy loop, then confirm."
        );
      } else {
        setPhase("question");
        m.say("info", "The extra pass improved nothing.");
      }
    } else {
      setPhase("route");
      m.say(
        "success",
        `All ${V - 1} rounds done. The cheapest cost to Planet ${target} is ${fmt(next.dist[target])}. Now rebuild the route: start at Planet ${target} and follow the parent array backwards.`
      );
    }
  };

  const decide = (wantUpdate) => {
    if (phase !== "run" || s.p >= passes) return;
    const should = improves(s.dist, edge);
    const du = s.dist[edge.from];
    const calc =
      du === INF
        ? `dist[${edge.from}] is still ∞, so this route cannot improve anything yet`
        : `dist[${edge.from}] + ${edge.w} = ${du + edge.w}, current dist[${edge.to}] = ${fmt(s.dist[edge.to])}`;

    if (wantUpdate !== should) {
      m.decision(false);
      m.mistake(
        "step",
        should
          ? `${inExtra ? "It still improves" : "Update needed"}. ${calc}. ${du + edge.w} is smaller than ${fmt(s.dist[edge.to])}.`
          : `${inExtra ? "No change" : "Keep it"}. ${calc}.${du === INF ? "" : ` ${du + edge.w} is not smaller than ${fmt(s.dist[edge.to])}.`}`
      );
      return;
    }

    m.decision(true);
    const next = stepState(s, should);
    setS(next);
    m.say(
      should ? "success" : "info",
      should
        ? `Correct! ${calc}. dist[${edge.to}] becomes ${du + edge.w}${du + edge.w < 0 ? " (a negative portal gave us energy)" : ""}.`
        : `Correct! ${calc}. Nothing changes.`
    );
    if (next.p >= passes) finishRun(next);
  };

  const autoRound = () => {
    if (phase !== "run" || s.p >= passes) return;
    let cur = s;
    const startPass = cur.p;
    while (cur.p === startPass) {
      cur = stepState(cur, improves(cur.dist, edges[cur.i]));
    }
    setS(cur);
    m.say("info", `The AI ran ${inExtra ? "the extra pass" : `round ${startPass + 1}`} for you. Check the table to see which distances changed.`);
    if (cur.p >= passes) finishRun(cur);
  };

  /* ---------------- cycle identification ---------------- */

  const toggle = (id) => {
    if (phase !== "identify") return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const confirmCycle = () => {
    const ok = selected.size === truth.cycle.length && truth.cycle.every((id) => selected.has(id));
    if (!ok) {
      m.mistake(
        "step",
        "That is not the loop. A cycle is a closed chain of routes that returns to its starting planet, and its costs must add up to less than zero. Follow the arrows."
      );
      return;
    }
    const total = edges.filter((e) => truth.cycle.includes(e.from) && truth.cycle.includes(e.to)).reduce((sum, e) => sum + e.w, 0);
    setPhase("question");
    m.say("success", `Correct! The loop ${truth.cycle.join(", ")} costs ${total} per lap, so every lap makes the route cheaper. Can a finite shortest route to Planet ${target} exist?`);
  };

  const answerQuestion = (yes) => {
    const exists = !truth.affected.has(target);
    if (yes === exists) {
      setAnswer(yes);
      setPhase("end");
      m.say(
        "success",
        exists
          ? `Correct. Planet ${target} cannot be reached through the cycle, so its shortest distance is final.`
          : `Correct. Planet ${target} can be reached from the negative cycle, so you could loop forever and the distance goes to -∞. NO shortest route exists. Bellman-Ford detected this with just one extra pass.`
      );
    } else {
      m.mistake(
        "step",
        exists
          ? `Not quite. Planet ${target} cannot be reached from the cycle, so looping never helps and a finite shortest route exists.`
          : `Not quite. Planet ${target} can be reached from the negative cycle: go around the loop as many times as you like and then continue to ${target}. The cost never stops dropping.`
      );
    }
  };

  /* ---------------- route reconstruction ---------------- */

  const pickRoute = (id) => {
    if (phase !== "route") return;
    const last = route[route.length - 1];
    const expected = s.parent[last];
    if (id !== expected) {
      m.mistake("step", `Look at the parent array: parent[${last}] = ${expected}. The route to ${last} came from Planet ${expected}.`);
      return;
    }
    const next = [...route, id];
    setRoute(next);
    if (id === mission.start) {
      setPhase("end");
      m.say("success", `Route rebuilt: ${pathText([...next].reverse())} with total cost ${fmt(s.dist[target])}.`);
    } else {
      m.say("info", `parent[${last}] = ${id}. Keep following the parents back to Planet ${mission.start}.`);
    }
  };

  /* ---------------- drawing ---------------- */

  const nodeKinds = {};
  const nodeSubs = {};
  graph.nodes.forEach((n) => {
    nodeKinds[n.id] = s.dist[n.id] !== INF ? "queued" : "default";
    nodeSubs[n.id] = distSub(s.dist[n.id]);
  });
  nodeKinds[mission.start] = "start";

  const edgeKinds = {};
  s.changed.forEach((key) => {
    edgeKinds[key] = "relaxed";
  });
  if (phase === "run" && s.p < passes) edgeKinds[`${edge.from}>${edge.to}`] = "active";

  if (phase === "identify") {
    selected.forEach((id) => {
      nodeKinds[id] = "selected";
    });
  }
  if (phase === "route" || (phase === "end" && !mission.cycle)) {
    route.forEach((id) => {
      nodeKinds[id] = "done";
    });
    for (let i = 0; i + 1 < route.length; i += 1) edgeKinds[`${route[i + 1]}>${route[i]}`] = "path";
  }
  if (mission.cycle && (phase === "question" || phase === "end")) {
    truth.cycle.forEach((id) => {
      nodeKinds[id] = "danger";
    });
    edges.forEach((e) => {
      if (truth.cycle.includes(e.from) && truth.cycle.includes(e.to)) edgeKinds[`${e.from}>${e.to}`] = "danger";
    });
  }

  const onNodeClick = phase === "identify" ? toggle : phase === "route" ? pickRoute : undefined;
  const tags = { [mission.start]: { text: "SHIP", color: "#fb923c" }, [target]: { text: "GOAL", color: "#f87171" } };

  const roundLabel = s.p >= passes ? "All passes finished" : inExtra ? "Extra pass: negative cycle check" : `Round ${s.p + 1} of ${V - 1}`;

  return (
    <MissionLayout
      map={
        <>
          <GalaxyMap graph={graph} showWeights nodeKinds={nodeKinds} nodeSubs={nodeSubs} edgeKinds={edgeKinds} nodeTags={tags} onNodeClick={onNodeClick} />
          <MissionHud m={m} />
        </>
      }
      side={
        <>
          <SidePanel title="Relaxation" right={<span className={chip}>{roundLabel}</span>}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {edges.map((e, index) => {
                const done = s.p >= passes || index < s.i;
                const mark = s.marks[index];
                const here = phase === "run" && s.p < passes && index === s.i;
                return (
                  <span
                    key={`${e.from}${e.to}`}
                    className={`rounded-md border px-2 py-1 font-mono text-xs ${
                      here
                        ? "border-amber-300 bg-amber-500/20 text-amber-100"
                        : done && mark === "u"
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 bg-black/30 text-slate-400"
                    }`}
                  >
                    {e.from}→{e.to} ({e.w})
                  </span>
                );
              })}
            </div>

            {phase === "run" && s.p < passes ? (
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="font-mono text-sm text-slate-100">
                  Route {edge.from} → {edge.to}, cost {edge.w}
                </div>
                <div className="mt-1 font-mono text-xs text-slate-400">
                  {s.dist[edge.from] === INF
                    ? `dist[${edge.from}] = ∞`
                    : `dist[${edge.from}] + ${edge.w} = ${s.dist[edge.from] + edge.w}`}
                  {"  vs  "}dist[{edge.to}] = {fmt(s.dist[edge.to])}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className={btnPrimary} onClick={() => decide(true)}>
                    {inExtra ? "Still improves" : "Update"}
                  </button>
                  <button type="button" className={btnGhost} onClick={() => decide(false)}>
                    {inExtra ? "No change" : "Keep"}
                  </button>
                  <button type="button" className={`${btnGhost} ml-auto`} onClick={autoRound}>
                    Auto-run {inExtra ? "extra pass" : "round"}
                  </button>
                </div>
              </div>
            ) : null}

            {phase === "identify" && (
              <div>
                <p className="m-0 text-sm text-red-200">Click every planet on the loop ({selected.size} selected).</p>
                <button type="button" className={`${btnPrimary} mt-3`} onClick={confirmCycle}>
                  Confirm cycle
                </button>
              </div>
            )}

            {phase === "question" && (
              <div>
                <p className="m-0 text-sm text-slate-200">Does a finite shortest route from Planet {mission.start} to Planet {target} exist?</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" className={btnPrimary} onClick={() => answerQuestion(true)}>
                    Yes
                  </button>
                  <button type="button" className={btnGhost} onClick={() => answerQuestion(false)}>
                    No
                  </button>
                </div>
              </div>
            )}

            {phase === "route" && (
              <p className="m-0 text-sm text-slate-200">
                Route so far (backwards): <strong className="font-mono text-orange-300">{route.join(" ← ")}</strong>. Click the parent of Planet {route[route.length - 1]}.
              </p>
            )}

            {phase === "end" && (
              <div>
                <p className="m-0 text-sm text-slate-200">
                  {mission.cycle
                    ? answer === false
                      ? `Planet ${target}: shortest distance = -∞ (no shortest route).`
                      : `Planet ${target}: distance ${fmt(s.dist[target])}.`
                    : `Cheapest route: ${pathText([...route].reverse())} costing ${fmt(s.dist[target])}.`}
                </p>
                <button type="button" className={`${btnPrimary} mt-3`} onClick={() => onDone(m.stats)}>
                  Continue
                </button>
              </div>
            )}
          </SidePanel>

          <SidePanel title="Distance and parent arrays">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center font-mono text-xs text-slate-200">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400">
                    <th className="py-1 text-left">Planet</th>
                    {s.snaps.map((_, k) => (
                      <th key={k}>{k === 0 ? "Start" : mission.cycle && k === V ? "Extra" : `R${k}`}</th>
                    ))}
                    {s.p < passes && <th className="text-amber-300">Now</th>}
                    <th>parent</th>
                  </tr>
                </thead>
                <tbody>
                  {graph.nodes.map((n) => (
                    <tr key={n.id} className="border-t border-white/5">
                      <td className="py-1 text-left font-bold text-orange-200">{n.id}</td>
                      {s.snaps.map((snap, k) => {
                        const changed = k > 0 && snap[n.id] !== s.snaps[k - 1][n.id];
                        return (
                          <td key={k} className={changed ? "font-bold text-emerald-300" : snap[n.id] === INF ? "text-slate-600" : ""}>
                            {fmt(snap[n.id])}
                          </td>
                        );
                      })}
                      {s.p < passes && <td className="text-amber-200">{fmt(s.dist[n.id])}</td>}
                      <td className="text-slate-400">{s.parent[n.id] || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SidePanel>
        </>
      }
    />
  );
}
