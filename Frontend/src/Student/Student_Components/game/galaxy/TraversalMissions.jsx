import { useMemo, useState } from "react";
import GalaxyMap from "./GalaxyMap";
import { GRAPHS } from "./galaxyGraphs";
import { bfsRoute, buildAdj, dfsRoute, pathFromParent, reachableFrom } from "./graphAlgos";
import { AlgoChoice, MissionHud, MissionLayout, SidePanel, btnGhost, btnPrimary, chip, useMission } from "./missionUi";

const jumpsOf = (path) => (path ? path.length - 1 : 0);
const pathText = (path) => path.join(" → ");

const tagsFor = (mission) => ({
  [mission.start]: { text: "SHIP", color: "#fb923c" },
  [mission.target]: { text: "SOS", color: "#f87171" },
});

function Chips({ items, emptyText, active }) {
  if (items.length === 0) return <span className="text-xs text-slate-500">{emptyText}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((id) => (
        <span
          key={id}
          className={`rounded-md border px-2.5 py-1 font-mono text-sm font-bold ${
            id === active ? "border-amber-300 bg-amber-500/20 text-amber-100" : "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
          }`}
        >
          {id}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DFS run                                                              */
/* ------------------------------------------------------------------ */

function DfsRun({ graph, mission, m, onFound, finishNode, start, target }) {
  const adj = useMemo(() => buildAdj(graph), [graph]);
  const [stack, setStack] = useState([start]);
  const [visited, setVisited] = useState(() => new Set([start]));
  const [dead, setDead] = useState(() => new Set());
  const [won, setWon] = useState(false);

  const current = stack[stack.length - 1];
  const options = adj[current].map((x) => x.to).filter((id) => !visited.has(id));
  const deadEnd = !won && options.length === 0 && stack.length > 1;

  const go = (id) => {
    if (won || id === current) return;

    if (!adj[current].some((x) => x.to === id)) {
      m.mistake("step", `There is no direct route from ${current} to ${id}. DFS can only move along a route that leaves the planet you are standing on.`);
      return;
    }
    if (visited.has(id)) {
      m.mistake("step", `Planet ${id} is already visited. DFS keeps a visited array so it never walks in circles. Choose an unvisited neighbour, or backtrack.`);
      return;
    }
    if (id !== options[0]) {
      m.mistake("step", `Your navigation computer checks neighbours in alphabetical order, and DFS goes deep into the FIRST one. Go to ${options[0]} first.`);
      return;
    }

    const nextStack = [...stack, id];
    setStack(nextStack);
    setVisited(new Set([...visited, id]));

    if (id === target) {
      setWon(true);
      onFound(nextStack);
    } else {
      m.say("info", `Moved to ${id}. Pushed ${id} onto the stack. Keep going deeper.`);
    }
  };

  const backtrack = () => {
    if (won) return;
    if (options.length > 0) {
      m.mistake("step", `DFS goes as deep as possible first. ${current} still has an unexplored route to ${options[0]}, so you cannot backtrack yet.`);
      return;
    }
    if (stack.length === 1) {
      m.mistake("step", "There is nowhere left to go back to.");
      return;
    }
    const popped = stack[stack.length - 1];
    setDead(new Set([...dead, popped]));
    setStack(stack.slice(0, -1));
    m.say("info", `Dead end at ${popped}. Popped it off the stack and backtracked to ${stack[stack.length - 2]}.`);
  };

  const nodeKinds = {};
  visited.forEach((id) => {
    nodeKinds[id] = dead.has(id) ? "visited" : "stack";
  });
  nodeKinds[start] = won || stack.includes(start) ? "stack" : "start";
  nodeKinds[current] = won ? "done" : "current";

  const edgeKinds = {};
  for (let i = 0; i + 1 < stack.length; i += 1) edgeKinds[`${stack[i]}>${stack[i + 1]}`] = won ? "path" : "relaxed";

  return (
    <MissionLayout
      map={
        <>
          <GalaxyMap graph={graph} nodeKinds={nodeKinds} edgeKinds={edgeKinds} nodeTags={tagsFor(mission)} onNodeClick={go} />
          <MissionHud m={m} />
        </>
      }
      side={
        <>
          <SidePanel title="Stack" right={<span className={chip}>{jumpsOf(stack)} jumps</span>}>
            <p className="m-0 mb-2 text-xs text-slate-400">Your current route. The last planet is where the ship is.</p>
            <Chips items={stack} active={current} />
          </SidePanel>
          <SidePanel title="Visited array">
            <Chips items={[...visited].sort()} emptyText="Nothing yet" />
          </SidePanel>
          <SidePanel title="Navigation controls">
            {won ? (
              finishNode
            ) : (
              <>
                <p className="m-0 mb-2 text-xs text-slate-400">
                  Unvisited neighbours of {current}, in alphabetical order:
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((id) => (
                    <button key={id} type="button" onClick={() => go(id)} className={btnGhost}>
                      Go to {id}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={backtrack}
                    className={`${btnPrimary} ${deadEnd ? "animate-pulse" : ""}`}
                  >
                    Backtrack
                  </button>
                </div>
                {deadEnd && (
                  <p className="m-0 mt-2 text-xs text-amber-200">Dead end! Every neighbour of {current} is visited.</p>
                )}
              </>
            )}
          </SidePanel>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* BFS run                                                              */
/* ------------------------------------------------------------------ */

function BfsRun({ graph, mission, m, onFound, finishNode, start, target }) {
  const adj = useMemo(() => buildAdj(graph), [graph]);
  const [queue, setQueue] = useState([start]);
  const [seen, setSeen] = useState(() => ({ [start]: { parent: null, layer: 0 } }));
  const [scanned, setScanned] = useState([]);
  const [won, setWon] = useState(false);

  const front = queue[0];

  const scan = (id) => {
    if (won) return;

    if (id !== front) {
      if (queue.includes(id)) {
        m.mistake("step", `BFS uses a queue: first in, first out. Planet ${front} was discovered earlier than ${id}, so ${front} must be scanned first.`);
      } else if (scanned.includes(id)) {
        m.mistake("step", `Planet ${id} was already scanned. BFS never scans a planet twice.`);
      } else if (seen[id]) {
        m.mistake("step", `Planet ${id} is not at the front of the queue.`);
      } else {
        m.mistake("step", `Planet ${id} has not been discovered yet. You can only scan planets that are in the queue.`);
      }
      return;
    }

    const nextSeen = { ...seen };
    const found = [];
    adj[id].forEach(({ to }) => {
      if (!nextSeen[to]) {
        nextSeen[to] = { parent: id, layer: seen[id].layer + 1 };
        found.push(to);
      }
    });

    const nextQueue = [...queue.slice(1), ...found];
    setSeen(nextSeen);
    setQueue(nextQueue);
    setScanned([...scanned, id]);

    if (found.includes(target)) {
      setWon(true);
      const parent = Object.fromEntries(Object.entries(nextSeen).map(([k, v]) => [k, v.parent]));
      onFound(pathFromParent(parent, target), nextSeen);
      return;
    }

    m.say(
      "info",
      found.length
        ? `Scanned ${id}. Discovered ${found.join(", ")} (${nextSeen[found[0]].layer} jump${nextSeen[found[0]].layer === 1 ? "" : "s"} from the ship) and added them to the back of the queue.`
        : `Scanned ${id}. Nothing new was discovered.`
    );
  };

  const nodeKinds = {};
  Object.keys(seen).forEach((id) => {
    nodeKinds[id] = "queued";
  });
  scanned.forEach((id) => {
    nodeKinds[id] = "visited";
  });
  if (!won && front) nodeKinds[front] = "current";
  if (won) {
    const parent = Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v.parent]));
    pathFromParent(parent, target).forEach((id) => {
      nodeKinds[id] = "done";
    });
  }

  const nodeSubs = {};
  Object.entries(seen).forEach(([id, info]) => {
    nodeSubs[id] = { text: `jump ${info.layer}`, color: "#7dd3fc" };
  });

  const edgeKinds = {};
  Object.entries(seen).forEach(([id, info]) => {
    if (info.parent) edgeKinds[`${info.parent}>${id}`] = "relaxed";
  });
  if (won) {
    const parent = Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v.parent]));
    const path = pathFromParent(parent, target);
    for (let i = 0; i + 1 < path.length; i += 1) edgeKinds[`${path[i]}>${path[i + 1]}`] = "path";
  }

  return (
    <MissionLayout
      map={
        <>
          <GalaxyMap graph={graph} nodeKinds={nodeKinds} nodeSubs={nodeSubs} edgeKinds={edgeKinds} nodeTags={tagsFor(mission)} onNodeClick={scan} />
          <MissionHud m={m} />
        </>
      }
      side={
        <>
          <SidePanel title="Queue" right={<span className={chip}>{queue.length} waiting</span>}>
            <p className="m-0 mb-2 text-xs text-slate-400">Discovered planets waiting to be scanned. Click the front one.</p>
            <div className="flex flex-wrap items-center gap-2">
              {queue.length === 0 && <span className="text-xs text-slate-500">Queue is empty</span>}
              {queue.map((id, index) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scan(id)}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 font-mono text-sm font-bold ${
                    index === 0 && !won
                      ? "border-amber-300 bg-amber-500/20 text-amber-100"
                      : "border-sky-400/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20"
                  }`}
                >
                  {id}
                  {index === 0 && !won && <span className="ml-1.5 text-[10px] font-semibold uppercase text-amber-300">front</span>}
                </button>
              ))}
            </div>
          </SidePanel>
          <SidePanel title="Scanned so far">
            <Chips items={scanned} emptyText="Nothing scanned yet" />
          </SidePanel>
          <SidePanel title="Navigation controls">
            {won ? (
              finishNode
            ) : (
              <button type="button" className={btnPrimary} onClick={() => scan(front)}>
                Scan front planet ({front})
              </button>
            )}
          </SidePanel>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Missions                                                             */
/* ------------------------------------------------------------------ */

export function DfsMission({ mission, onDone }) {
  const graph = GRAPHS[mission.graph];
  const m = useMission(mission);
  const [route, setRoute] = useState(null);
  const shortest = jumpsOf(bfsRoute(graph, mission.start, mission.target).path);

  const found = (path) => {
    setRoute(path);
    m.say(
      "success",
      `Astronaut found! DFS route: ${pathText(path)} (${jumpsOf(path)} jumps). DFS found A route, but nobody promised it is the shortest one.`
    );
  };

  return (
    <DfsRun
      graph={graph}
      mission={mission}
      m={m}
      start={mission.start}
      target={mission.target}
      onFound={found}
      finishNode={
        route && (
          <div>
            <p className="m-0 text-sm text-slate-300">
              Route {pathText(route)} uses <strong className="text-orange-300">{jumpsOf(route)} jumps</strong>.
              {jumpsOf(route) > shortest && " Hmm, that feels long. Could there be a quicker way?"}
            </p>
            <button type="button" className={`${btnPrimary} mt-3`} onClick={() => onDone(m.stats)}>
              Continue
            </button>
          </div>
        )
      }
    />
  );
}

export function BfsMission({ mission, onDone }) {
  const graph = GRAPHS[mission.graph];
  const m = useMission(mission);
  const [route, setRoute] = useState(null);
  const dfs = jumpsOf(dfsRoute(graph, mission.start, mission.target).path);

  const found = (path) => {
    setRoute(path);
    m.say(
      "success",
      `Astronaut found in ${jumpsOf(path)} jumps: ${pathText(path)}. DFS needed ${dfs} jumps. BFS explored level by level, so the first time it reached Planet ${mission.target} was the shortest route.`
    );
  };

  return (
    <BfsRun
      graph={graph}
      mission={mission}
      m={m}
      start={mission.start}
      target={mission.target}
      onFound={found}
      finishNode={
        route && (
          <div>
            <p className="m-0 text-sm text-slate-300">
              Route {pathText(route)}: <strong className="text-orange-300">{jumpsOf(route)} jumps</strong> (DFS: {dfs}).
            </p>
            <button type="button" className={`${btnPrimary} mt-3`} onClick={() => onDone(m.stats)}>
              Continue
            </button>
          </div>
        )
      }
    />
  );
}

export function RescueMission({ mission, onDone }) {
  const graph = GRAPHS[mission.graph];
  const m = useMission(mission);
  const [phase, setPhase] = useState("choose");
  const [picked, setPicked] = useState(null);
  const [route, setRoute] = useState(null);
  const [marked, setMarked] = useState(() => new Set());
  const [scanDone, setScanDone] = useState(false);

  const dfsPath = useMemo(() => dfsRoute(graph, mission.start, mission.target).path, [graph, mission]);
  const bfsPath = useMemo(() => bfsRoute(graph, mission.start, mission.target).path, [graph, mission]);
  const reach = useMemo(() => reachableFrom(graph, mission.start), [graph, mission]);
  const unreachable = graph.nodes.map((n) => n.id).filter((id) => !reach.has(id));

  const choose = (id) => {
    setPicked(id);
    if (id === "dfs") {
      m.mistake(
        "algo",
        `Commander, the astronaut is only ${jumpsOf(bfsPath)} jumps away. DFS found a route with ${jumpsOf(dfsPath)} jumps (${pathText(dfsPath)}), and the oxygen lasts for ${mission.oxygen}. DFS does not guarantee the shortest path. Can you find a better route?`
      );
      return;
    }
    setPhase("run");
    m.say("success", "BFS it is. It explores layer by layer, so the first time it reaches the astronaut is the fewest-jumps route. Scan the front of the queue.");
  };

  const toggle = (id) => {
    if (phase !== "scan" || scanDone) return;
    const next = new Set(marked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setMarked(next);
  };

  const confirmScan = () => {
    const ok = marked.size === unreachable.length && unreachable.every((id) => marked.has(id));
    if (!ok) {
      m.mistake(
        "step",
        "Not quite. An unreachable planet is one that the search from your ship never discovers: no chain of routes leads to it. Check which planets BFS reached (they have a jump number)."
      );
      return;
    }
    setScanDone(true);
    m.say("success", `Correct! Planets ${unreachable.join(" and ")} are cut off from the rest of the galaxy. BFS and DFS can only discover planets that are connected to the start.`);
  };

  if (phase === "choose") {
    return (
      <MissionLayout
        map={
          <>
            <GalaxyMap graph={graph} nodeTags={tagsFor(mission)} nodeKinds={{ [mission.start]: "start" }} />
            <MissionHud m={m} />
          </>
        }
        side={
          <>
            <SidePanel title="Objective">
              <p className="m-0 text-sm leading-relaxed text-slate-300">
                Rescue the astronaut at Planet {mission.target} before the oxygen runs out. Oxygen lasts for{" "}
                <strong className="text-orange-300">{mission.oxygen} jumps</strong>.
              </p>
            </SidePanel>
            <AlgoChoice
              question="Which navigation mode finds the route with the fewest jumps?"
              options={[
                { id: "dfs", label: "DFS", sub: "dive deep, use a stack" },
                { id: "bfs", label: "BFS", sub: "layer by layer, use a queue" },
              ]}
              picked={picked}
              onPick={choose}
            />
          </>
        }
      />
    );
  }

  if (phase === "run") {
    return (
      <BfsRun
        graph={graph}
        mission={mission}
        m={m}
        start={mission.start}
        target={mission.target}
        onFound={(path) => {
          setRoute(path);
          m.say("success", `Astronaut reached in ${jumpsOf(path)} jumps (${pathText(path)}), within the ${mission.oxygen} jump oxygen limit. Rescue complete!`);
        }}
        finishNode={
          route && (
            <div>
              <p className="m-0 text-sm text-slate-300">
                Rescue route: {pathText(route)} (<strong className="text-orange-300">{jumpsOf(route)} jumps</strong>). One last task: scan the galaxy for planets you can never reach.
              </p>
              <button
                type="button"
                className={`${btnPrimary} mt-3`}
                onClick={() => {
                  setPhase("scan");
                  m.say("info", "Click every planet that cannot be reached from the ship, then confirm.");
                }}
              >
                Scan the galaxy
              </button>
            </div>
          )
        }
      />
    );
  }

  const kinds = {};
  graph.nodes.forEach((n) => {
    kinds[n.id] = reach.has(n.id) ? "visited" : "default";
  });
  marked.forEach((id) => {
    kinds[id] = scanDone ? "danger" : "selected";
  });
  kinds[mission.start] = "start";

  return (
    <MissionLayout
      map={
        <>
          <GalaxyMap graph={graph} nodeKinds={kinds} nodeTags={{ [mission.start]: { text: "SHIP", color: "#fb923c" } }} onNodeClick={toggle} />
          <MissionHud m={m} />
        </>
      }
      side={
        <SidePanel title="Galaxy scan" right={<span className={chip}>{marked.size} marked</span>}>
          <p className="m-0 text-sm leading-relaxed text-slate-300">
            Click every planet that is <strong>unreachable</strong> from Planet {mission.start}.
          </p>
          {scanDone ? (
            <button type="button" className={`${btnPrimary} mt-3`} onClick={() => onDone(m.stats)}>
              Continue
            </button>
          ) : (
            <button type="button" className={`${btnPrimary} mt-3`} onClick={confirmScan}>
              Confirm
            </button>
          )}
        </SidePanel>
      }
    />
  );
}
