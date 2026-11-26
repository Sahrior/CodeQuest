import { useMemo } from "react";
import GalaxyMap from "./GalaxyMap";
import { GRAPHS } from "./galaxyGraphs";
import { bellmanFord, bfsRoute, dijkstra, pathCost } from "./graphAlgos";
import { LEVELS, SKILLS } from "./galaxyData";
import { panel, sectionTitle } from "./missionUi";

const pathText = (path) => path.join(" → ");

function Box({ title, children }) {
  return (
    <section className={`${panel} p-4`}>
      <h2 className={sectionTitle}>{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

/* Mission 2A briefing: why BFS is not enough any more. */
export function RoutesComparison() {
  const graph = GRAPHS.fuelA;
  const bfs = bfsRoute(graph, "A", "D").path;
  const best = dijkstra(graph, "A");
  const cheap = ["A", "C", "B", "D"];
  return (
    <Box title="Why BFS is no longer enough">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3">
          <div className="font-semibold text-red-200">Route 1: {pathText(bfs)}</div>
          <div className="font-mono text-xs">{bfs.length - 1} jumps, {pathCost(graph, bfs)} fuel</div>
          <div className="mt-1 text-xs text-slate-400">Fewest jumps, but it burns more fuel.</div>
        </div>
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
          <div className="font-semibold text-emerald-200">Route 2: {pathText(cheap)}</div>
          <div className="font-mono text-xs">{cheap.length - 1} jumps, {best.dist.D} fuel</div>
          <div className="mt-1 text-xs text-slate-400">More jumps, much less fuel.</div>
        </div>
      </div>
      <p className="m-0 mt-3">The spaceship must conserve fuel, not minimize jumps. That is why we need Dijkstra.</p>
    </Box>
  );
}

/* Mission 3A briefing: Dijkstra gives a wrong answer on a negative route. */
export function DijkstraFails() {
  const graph = GRAPHS.portalIntro;
  const wrong = useMemo(() => dijkstra(graph, "A"), [graph]);
  const right = useMemo(() => bellmanFord(graph, "A"), [graph]);
  return (
    <Box title="Why Dijkstra fails here">
      <p className="m-0">
        Dijkstra finalizes Planet C with distance {wrong.dist.C} because it is the closest planet. But the route A → B → C costs 4 + (-6) = -2, which is cheaper. A planet finalized too early can never be fixed.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3">
          <div className="font-semibold text-red-200">Dijkstra says D = {wrong.dist.D}</div>
          <div className="text-xs text-slate-400">Wrong: C was locked at {wrong.dist.C}.</div>
        </div>
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
          <div className="font-semibold text-emerald-200">Truth: D = {right.dist.D}</div>
          <div className="text-xs text-slate-400">A → B → C → D = 4 - 6 + 3 = 1</div>
        </div>
      </div>
      <p className="m-0 mt-3">We need an algorithm that keeps checking and improving ALL routes. That is Bellman-Ford.</p>
    </Box>
  );
}

export const BRIEFINGS = { routes: RoutesComparison, dijkstraFails: DijkstraFails };

/* Level 1 learning moment. */
export function DfsBfsTable() {
  const rows = [
    ["Explores deeply", "Explores level by level"],
    ["Uses a stack", "Uses a queue"],
    ["May find a longer path", "Finds the fewest-edge path"],
    ["Doesn't guarantee the shortest path", "Guarantees the shortest path in an unweighted graph"],
  ];
  return (
    <Box title="DFS vs BFS">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="text-orange-300">
            <th className="border-b border-white/10 py-2 pr-3">DFS</th>
            <th className="border-b border-white/10 py-2">BFS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <td className="border-b border-white/5 py-2 pr-3">{a}</td>
              <td className="border-b border-white/5 py-2">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

export const LEARN = { dfsBfs: DfsBfsTable };

/* Progression table for the hub and the ending. */
export function ProgressionTable() {
  const rows = [
    ["Level 1", "Find whether a destination is reachable", "DFS"],
    ["Level 1", "Find the path with minimum jumps", "BFS"],
    ["Level 2", "Cheapest path with different positive costs", "Dijkstra"],
    ["Level 3", "Cheapest path with negative edge weights", "Bellman-Ford"],
    ["Level 3 boss", "Detect negative-weight cycles", "Bellman-Ford"],
  ];
  return (
    <Box title="The evolution of pathfinding">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-orange-300">
              <th className="border-b border-white/10 py-2 pr-3">Stage</th>
              <th className="border-b border-white/10 py-2 pr-3">Problem introduced</th>
              <th className="border-b border-white/10 py-2">Algorithm needed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[1]}>
                {r.map((cell, i) => (
                  <td key={i} className={`border-b border-white/5 py-2 pr-3 ${i === 2 ? "font-semibold text-orange-200" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="m-0 mt-3 list-none space-y-2 p-0">
        {LEVELS.map((l) => (
          <li key={l.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-slate-400">Problem {l.id}</div>
            <div className="italic text-slate-200">"{l.problem}"</div>
            <div className="mt-1 font-semibold text-orange-200">{l.algo}</div>
          </li>
        ))}
      </ol>
    </Box>
  );
}

export function SkillBadges({ unlocked }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SKILLS.map((s) => {
        const on = unlocked.includes(s.id);
        return (
          <span
            key={s.id}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              on ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-black/30 text-slate-500"
            }`}
          >
            {on ? "Unlocked: " : "Locked: "}
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

export { GalaxyMap };
