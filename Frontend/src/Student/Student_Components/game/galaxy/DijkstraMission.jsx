import { useMemo, useState } from "react";
import GalaxyMap, { distSub } from "./GalaxyMap";
import { GRAPHS } from "./galaxyGraphs";
import { INF, bfsRoute, buildAdj, dfsRoute, dijkstra, fmt, pathCost, pathFromParent } from "./graphAlgos";
import { AlgoChoice, MissionHud, MissionLayout, SidePanel, btnGhost, btnPrimary, chip, useMission } from "./missionUi";

const pathText = (path) => path.join(" → ");

export default function DijkstraMission({ mission, onDone }) {
  const graph = GRAPHS[mission.graph];
  const adj = useMemo(() => buildAdj(graph), [graph]);
  const best = useMemo(() => dijkstra(graph, mission.start), [graph, mission]);
  const m = useMission(mission);

  const [phase, setPhase] = useState(mission.choice ? "choose" : "run");
  const [picked, setPicked] = useState(null);
  const [dist, setDist] = useState(() => {
    const d = {};
    graph.nodes.forEach((n) => {
      d[n.id] = INF;
    });
    d[mission.start] = 0;
    return d;
  });
  const [parent, setParent] = useState(() => Object.fromEntries(graph.nodes.map((n) => [n.id, null])));
  const [done, setDone] = useState(() => new Set());
  const [current, setCurrent] = useState(null);
  const [rows, setRows] = useState([]);
  const [finished, setFinished] = useState(false);

  const target = mission.target;
  const optimal = best.dist[target];
  const unresolved = rows.filter((r) => r.state === null).length;

  /* ---------------- algorithm choice (boss only) ---------------- */

  const choose = (id) => {
    setPicked(id);
    if (id === "dijkstra") {
      setPhase("run");
      m.say("success", "Dijkstra it is. Every route has a fuel cost, so we need the cheapest TOTAL cost, not the fewest jumps. Select the closest planet.");
      return;
    }
    const route = id === "bfs" ? bfsRoute(graph, mission.start, target).path : dfsRoute(graph, mission.start, target).path;
    const cost = pathCost(graph, route);
    const name = id === "bfs" ? "BFS" : "DFS";
    const why =
      id === "bfs"
        ? "You used BFS, but it only counts jumps and ignores fuel."
        : "You used DFS, but it doesn't guarantee the shortest path, and it ignores fuel completely.";
    m.mistake(
      "algo",
      `${why} ${name} found ${pathText(route)} with ${route.length - 1} jumps, which burns ${cost} fuel${
        mission.fuelLimit ? (cost > mission.fuelLimit ? `. The tanks only hold ${mission.fuelLimit}, so the ship would be stranded` : ` (limit ${mission.fuelLimit})`) : ""
      }. The cheapest route costs ${optimal}. Try another algorithm.`
    );
  };

  /* ---------------- select the closest planet ---------------- */

  const select = (id) => {
    if (phase !== "run" || finished) return;

    if (unresolved > 0) {
      m.mistake("step", `Finish the distance updates for Planet ${current} first (${unresolved} route${unresolved === 1 ? "" : "s"} left), then select the next planet.`);
      return;
    }
    if (done.has(id)) {
      m.mistake("step", `Planet ${id} is already finalized. Its distance cannot improve any more, so pick an unvisited planet.`);
      return;
    }
    if (dist[id] === INF) {
      m.mistake("step", `Planet ${id} has distance ∞, so we have not found any route to it yet. Select an unvisited planet with a known distance.`);
      return;
    }
    const open = graph.nodes.map((n) => n.id).filter((x) => !done.has(x) && dist[x] !== INF);
    const min = Math.min(...open.map((x) => dist[x]));
    if (dist[id] > min) {
      const smallest = open.filter((x) => dist[x] === min);
      m.mistake("step", `Dijkstra always selects the unvisited planet with the SMALLEST distance. Planet ${smallest[0]} has ${min}, which is smaller than ${dist[id]}.`);
      return;
    }

    const nextDone = new Set([...done, id]);
    setDone(nextDone);
    setCurrent(id);

    if (id === target) {
      setFinished(true);
      setRows([]);
      const path = pathFromParent(parent, target);
      m.say(
        "success",
        `Planet ${target} selected with distance ${dist[target]}, so it can never improve. Cheapest route: ${pathText(path)} (${dist[target]} fuel).${mission.ai ? ` ${mission.ai}` : ""}`
      );
      return;
    }

    const list = adj[id].map((x) => ({ to: x.to, w: x.w, state: null }));
    setRows(list);
    m.say(
      "info",
      list.length
        ? `Selected Planet ${id} (distance ${dist[id]}). Now check every route leaving it: is dist[${id}] + cost smaller than the current distance?`
        : `Selected Planet ${id}. It has no outgoing routes, so choose the next closest planet.`
    );
  };

  /* ---------------- update decisions ---------------- */

  const decide = (index, wantUpdate) => {
    const row = rows[index];
    if (!row || row.state !== null) return;

    const candidate = dist[current] + row.w;
    const should = candidate < dist[row.to];
    const calc = `dist[${current}] + ${row.w} = ${candidate}, current dist[${row.to}] = ${fmt(dist[row.to])}`;

    if (wantUpdate !== should) {
      m.decision(false);
      m.mistake(
        "step",
        should
          ? `Update needed. ${calc}. ${candidate} is smaller than ${fmt(dist[row.to])}, so the new route is cheaper.`
          : `Keep it. ${calc}. ${candidate} is NOT smaller than ${fmt(dist[row.to])}, so the route you already know is at least as good.`
      );
      return;
    }

    m.decision(true);
    if (should) {
      setDist({ ...dist, [row.to]: candidate });
      setParent({ ...parent, [row.to]: current });
      m.say("success", `Correct! ${calc}. Updated dist[${row.to}] to ${candidate} (reached through ${current}).`);
    } else {
      m.say("info", `Correct! ${calc}. No improvement, so the distance stays.`);
    }
    setRows(rows.map((r, i) => (i === index ? { ...r, state: should ? "updated" : "kept" } : r)));
  };

  /* ---------------- drawing ---------------- */

  const nodeKinds = {};
  const nodeSubs = {};
  graph.nodes.forEach((n) => {
    nodeKinds[n.id] = done.has(n.id) ? "done" : dist[n.id] !== INF ? "queued" : "default";
    nodeSubs[n.id] = distSub(dist[n.id]);
  });
  nodeKinds[mission.start] = done.has(mission.start) ? "done" : "start";
  if (current && !finished) nodeKinds[current] = "current";

  const edgeKinds = {};
  rows.forEach((r) => {
    edgeKinds[`${current}>${r.to}`] = r.state === "updated" ? "relaxed" : r.state === "kept" ? "dim" : "active";
  });
  if (finished) {
    const path = pathFromParent(parent, target);
    for (let i = 0; i + 1 < path.length; i += 1) edgeKinds[`${path[i]}>${path[i + 1]}`] = "path";
  }

  const tags = { [mission.start]: { text: "SHIP", color: "#fb923c" }, [target]: { text: "GOAL", color: "#f87171" } };

  if (phase === "choose") {
    return (
      <MissionLayout
        map={
          <>
            <GalaxyMap graph={graph} showWeights nodeTags={tags} nodeKinds={{ [mission.start]: "start" }} />
            <MissionHud m={m} />
          </>
        }
        side={
          <>
            <SidePanel title="Fuel status">
              <p className="m-0 text-sm leading-relaxed text-slate-300">
                Your tanks hold <strong className="text-orange-300">{mission.fuelLimit} fuel</strong>. Each number on a route is the fuel it burns.
              </p>
            </SidePanel>
            <AlgoChoice question={mission.choice.question} options={mission.choice.options} picked={picked} onPick={choose} />
          </>
        }
      />
    );
  }

  return (
    <MissionLayout
      map={
        <>
          <GalaxyMap graph={graph} showWeights nodeKinds={nodeKinds} nodeSubs={nodeSubs} edgeKinds={edgeKinds} nodeTags={tags} onNodeClick={select} />
          <MissionHud m={m} />
        </>
      }
      side={
        <>
          <SidePanel title="Distance table" right={<span className={chip}>Planet {target} = goal</span>}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center font-mono text-sm text-slate-200">
                <thead>
                  <tr className="text-[11px] uppercase text-slate-400">
                    <th className="py-1 text-left">Planet</th>
                    <th>dist[]</th>
                    <th>from</th>
                    <th>visited</th>
                  </tr>
                </thead>
                <tbody>
                  {graph.nodes.map((n) => (
                    <tr key={n.id} className={`border-t border-white/5 ${n.id === current && !finished ? "bg-amber-500/10" : ""}`}>
                      <td className="py-1 text-left font-bold text-orange-200">{n.id}</td>
                      <td className={dist[n.id] === INF ? "text-slate-500" : "text-cyan-200"}>{fmt(dist[n.id])}</td>
                      <td className="text-slate-400">{parent[n.id] || "-"}</td>
                      <td>{done.has(n.id) ? <span className="text-emerald-300">yes</span> : <span className="text-slate-600">no</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SidePanel>

          <SidePanel title={current && !finished ? `Routes leaving Planet ${current}` : "Navigation console"}>
            {finished ? (
              <div>
                <p className="m-0 text-sm text-slate-300">
                  Cheapest route: <strong className="text-orange-300">{pathText(pathFromParent(parent, target))}</strong> costing{" "}
                  <strong className="text-orange-300">{dist[target]} fuel</strong>.
                </p>
                <button type="button" className={`${btnPrimary} mt-3`} onClick={() => onDone(m.stats)}>
                  Continue
                </button>
              </div>
            ) : rows.length === 0 ? (
              <p className="m-0 text-sm text-slate-300">
                Click the unvisited planet with the smallest distance (on the map).
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {rows.map((r, index) => (
                  <div key={r.to} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <span className="font-mono text-sm text-slate-200">
                      {current} → {r.to} <span className="text-slate-500">cost {r.w}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        {dist[current]} + {r.w} = {dist[current] + r.w} vs {fmt(dist[r.to])}
                      </span>
                    </span>
                    {r.state === null ? (
                      <span className="flex gap-2">
                        <button type="button" className={`${btnPrimary} px-3 py-1 text-xs`} onClick={() => decide(index, true)}>
                          Update
                        </button>
                        <button type="button" className={`${btnGhost} px-3 py-1 text-xs`} onClick={() => decide(index, false)}>
                          Keep
                        </button>
                      </span>
                    ) : (
                      <span className={`text-xs font-bold ${r.state === "updated" ? "text-emerald-300" : "text-slate-400"}`}>
                        {r.state === "updated" ? "updated" : "kept"}
                      </span>
                    )}
                  </div>
                ))}
                {unresolved === 0 && <p className="m-0 text-xs text-emerald-300">All routes checked. Select the next closest planet.</p>}
              </div>
            )}
          </SidePanel>
        </>
      }
    />
  );
}
