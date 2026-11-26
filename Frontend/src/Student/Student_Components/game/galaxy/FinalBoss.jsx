import { useMemo, useState } from "react";
import GalaxyMap, { distSub } from "./GalaxyMap";
import { GRAPHS } from "./galaxyGraphs";
import { INF, bellmanFord, fmt } from "./graphAlgos";
import { AlgoChoice, MissionHud, MissionLayout, SidePanel, btnGhost, btnPrimary, chip, useMission } from "./missionUi";

export default function FinalBoss({ mission, onDone }) {
  const graph = GRAPHS[mission.graph];
  const edges = graph.edgeOrder || graph.edges;
  const V = graph.nodes.length;
  const truth = useMemo(() => bellmanFord(graph, mission.start), [graph, mission]);
  const m = useMission(mission);

  // every pass (V - 1 rounds + the extra pass) as a snapshot, with the planets that changed
  const passes = useMemo(() => {
    const dist = {};
    graph.nodes.forEach((n) => {
      dist[n.id] = INF;
    });
    dist[mission.start] = 0;
    const list = [{ dist: { ...dist }, changed: [] }];
    for (let p = 0; p < V; p += 1) {
      const changed = [];
      edges.forEach((e) => {
        if (dist[e.from] !== INF && dist[e.from] + e.w < dist[e.to]) {
          dist[e.to] = dist[e.from] + e.w;
          changed.push(e.to);
        }
      });
      list.push({ dist: { ...dist }, changed });
    }
    return list;
  }, [graph, edges, V, mission]);

  const [phase, setPhase] = useState("choose");
  const [picked, setPicked] = useState(null);
  const [shown, setShown] = useState(0);
  const [marked, setMarked] = useState(() => new Set());
  const [value, setValue] = useState("");

  const target = mission.target;
  const lastIndex = passes.length - 1; // the extra pass
  const label = (k) => (k === 0 ? "Start" : k === lastIndex ? "Extra" : `R${k}`);

  const choose = (id) => {
    setPicked(id);
    if (id === mission.choice.correct) {
      setPhase("watch");
      m.say("success", "Bellman-Ford it is. It relaxes every route V - 1 times, then does one extra pass to catch negative cycles. Step through the passes.");
    } else if (id === "bfs") {
      m.mistake("algo", "BFS found the fewest jumps, but you ignored fuel costs entirely. This galaxy has routes with different, even negative, costs.");
    } else {
      m.mistake("algo", "Dijkstra cannot guarantee correct results with negative edge weights. Routes like C → B (-1) and E → F (-4) break its assumption that a finalized planet never improves.");
    }
  };

  const next = () => {
    const k = shown + 1;
    setShown(k);
    if (k === lastIndex) {
      m.say(
        "alert",
        `NEGATIVE CYCLE DETECTED. The extra pass still improved ${[...new Set(passes[k].changed)].join(", ")}. Some part of this galaxy is an infinite energy loop.`
      );
    } else {
      m.say("info", `After round ${k}: ${passes[k].changed.length ? `distances changed for ${[...new Set(passes[k].changed)].join(", ")}.` : "nothing changed."}`);
    }
  };

  const toggle = (id) => {
    if (phase !== "affected") return;
    const s = new Set(marked);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setMarked(s);
  };

  const confirmAffected = () => {
    const want = truth.affected;
    const ok = marked.size === want.size && [...want].every((id) => marked.has(id));
    if (!ok) {
      m.mistake(
        "step",
        marked.has(target)
          ? `Planet ${target} is not affected: the cycle cannot reach it. You forgot to check which planets the cycle can lead to.`
          : "You forgot to check for a negative-weight cycle properly. Affected planets are the ones that still improved in the extra pass, plus every planet reachable from them."
      );
      return;
    }
    setPhase("distance");
    m.say("success", `Correct! No finite shortest route exists to ${[...want].sort().join(", ")}. Now compute the cheapest fuel cost to Planet ${target}.`);
  };

  const confirmDistance = () => {
    if (Number(value) !== truth.dist[target] || value.trim() === "") {
      m.mistake("step", `Not quite. Use the distance array after the V - 1 rounds: dist[${target}] is the cost of the cheapest route that avoids the loop.`);
      return;
    }
    setPhase("end");
    m.say("success", `Correct: ${truth.dist[target]} fuel. You detected the hidden negative cycle and found the safe shortest route. You have become a Galactic Navigator!`);
  };

  const cur = passes[shown];
  const nodeKinds = {};
  const nodeSubs = {};
  graph.nodes.forEach((n) => {
    nodeKinds[n.id] = cur.dist[n.id] !== INF ? "queued" : "default";
    nodeSubs[n.id] = distSub(phase === "end" && truth.affected.has(n.id) ? -INF : cur.dist[n.id]);
    if (cur.changed.includes(n.id)) nodeKinds[n.id] = "current";
  });
  nodeKinds[mission.start] = "start";
  marked.forEach((id) => {
    nodeKinds[id] = phase === "affected" ? "selected" : "danger";
  });
  if (phase === "end") truth.affected.forEach((id) => (nodeKinds[id] = "danger"));

  const tags = { [mission.start]: { text: "SHIP", color: "#fb923c" }, [target]: { text: "BASE", color: "#34d399" } };

  return (
    <MissionLayout
      map={
        <>
          <GalaxyMap graph={graph} showWeights nodeKinds={nodeKinds} nodeSubs={nodeSubs} nodeTags={tags} onNodeClick={phase === "affected" ? toggle : undefined} />
          <MissionHud m={m} />
        </>
      }
      side={
        <>
          {phase === "choose" && <AlgoChoice question={mission.choice.question} options={mission.choice.options} picked={picked} onPick={choose} />}

          {phase !== "choose" && (
            <SidePanel title="Relaxation rounds" right={<span className={chip}>{label(shown)}</span>}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center font-mono text-xs text-slate-200">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-400">
                      <th className="py-1 text-left">Planet</th>
                      {passes.slice(0, shown + 1).map((_, k) => (
                        <th key={k}>{label(k)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {graph.nodes.map((n) => (
                      <tr key={n.id} className="border-t border-white/5">
                        <td className="py-1 text-left font-bold text-orange-200">{n.id}</td>
                        {passes.slice(0, shown + 1).map((p, k) => {
                          const changed = k > 0 && p.changed.includes(n.id);
                          return (
                            <td key={k} className={changed ? (k === lastIndex ? "font-bold text-red-300" : "font-bold text-emerald-300") : p.dist[n.id] === INF ? "text-slate-600" : ""}>
                              {fmt(p.dist[n.id])}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {phase === "watch" && (
                <div className="mt-3">
                  {shown < lastIndex ? (
                    <button type="button" className={btnPrimary} onClick={next}>
                      {shown + 1 === lastIndex ? "Run the extra pass" : `Run round ${shown + 1}`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={btnPrimary}
                      onClick={() => {
                        setPhase("affected");
                        m.say("info", "Click every planet that has NO finite shortest route (on the cycle, or reachable from it), then confirm.");
                      }}
                    >
                      Analyse the result
                    </button>
                  )}
                </div>
              )}
            </SidePanel>
          )}

          {phase === "affected" && (
            <SidePanel title="Affected planets" right={<span className={chip}>{marked.size} marked</span>}>
              <p className="m-0 text-sm text-slate-300">Which planets have no finite shortest route from {mission.start}?</p>
              <button type="button" className={`${btnPrimary} mt-3`} onClick={confirmAffected}>
                Confirm
              </button>
            </SidePanel>
          )}

          {phase === "distance" && (
            <SidePanel title={`Cheapest fuel cost to Planet ${target}`}>
              <div className="flex flex-wrap gap-2">
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  inputMode="numeric"
                  aria-label="Distance to the base"
                  className="w-28 rounded-lg border border-orange-400/50 bg-black/40 px-3 py-2 font-mono text-orange-100 outline-none focus:border-orange-300"
                />
                <button type="button" className={btnPrimary} onClick={confirmDistance}>
                  Check
                </button>
              </div>
            </SidePanel>
          )}

          {phase === "end" && (
            <SidePanel title="Galaxy saved">
              <p className="m-0 text-sm text-slate-300">
                Planet {target}: <strong className="text-orange-300">{truth.dist[target]} fuel</strong>. Planets {[...truth.affected].sort().join(", ")} have no shortest route (-∞).
              </p>
              <button type="button" className={`${btnPrimary} mt-3`} onClick={() => onDone(m.stats)}>
                Continue
              </button>
            </SidePanel>
          )}
        </>
      }
    />
  );
}
