export const INF = Infinity;

export const fmt = (value) => (value === INF ? "∞" : value === -INF ? "-∞" : String(value));

// Neighbours are always stored in alphabetical order, so every algorithm
// (and the matching C++ code) visits planets in the same, predictable order.
export function buildAdj(graph) {
  const adj = {};
  graph.nodes.forEach((node) => {
    adj[node.id] = [];
  });

  graph.edges.forEach((edge) => {
    adj[edge.from].push({ to: edge.to, w: edge.w });
    if (!graph.directed) adj[edge.to].push({ to: edge.from, w: edge.w });
  });

  Object.values(adj).forEach((list) => list.sort((a, b) => (a.to < b.to ? -1 : a.to > b.to ? 1 : 0)));
  return adj;
}

export function pathFromParent(parent, target) {
  if (target === undefined || (parent[target] === undefined && parent[target] !== null)) return null;
  const path = [];
  let at = target;
  let guard = 0;
  while (at !== null && at !== undefined && guard < 100) {
    path.unshift(at);
    at = parent[at];
    guard += 1;
  }
  return path;
}

export function pathCost(graph, path) {
  let total = 0;
  for (let i = 0; i + 1 < path.length; i += 1) {
    const edge = graph.edges.find(
      (e) => (e.from === path[i] && e.to === path[i + 1]) || (!graph.directed && e.from === path[i + 1] && e.to === path[i])
    );
    total += edge ? edge.w : 0;
  }
  return total;
}

export function dfsRoute(graph, start, target) {
  const adj = buildAdj(graph);
  const visited = new Set();
  const order = [];
  const stack = [];
  let found = null;

  const go = (u) => {
    visited.add(u);
    order.push(u);
    stack.push(u);
    if (u === target) {
      found = [...stack];
      return true;
    }
    for (const { to } of adj[u]) {
      if (!visited.has(to) && go(to)) return true;
    }
    stack.pop();
    return false;
  };

  go(start);
  return { path: found, order };
}

export function bfsRoute(graph, start, target) {
  const adj = buildAdj(graph);
  const parent = { [start]: null };
  const layer = { [start]: 0 };
  const queue = [start];
  const order = [];

  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const { to } of adj[u]) {
      if (parent[to] === undefined) {
        parent[to] = u;
        layer[to] = layer[u] + 1;
        queue.push(to);
      }
    }
  }

  return { parent, layer, order, path: target in parent ? pathFromParent(parent, target) : null };
}

export function reachableFrom(graph, start) {
  const adj = buildAdj(graph);
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const u = queue.shift();
    adj[u].forEach(({ to }) => {
      if (!seen.has(to)) {
        seen.add(to);
        queue.push(to);
      }
    });
  }
  return seen;
}

export function dijkstra(graph, start) {
  const adj = buildAdj(graph);
  const dist = {};
  const parent = {};
  const done = new Set();
  const order = [];
  graph.nodes.forEach((n) => {
    dist[n.id] = INF;
    parent[n.id] = null;
  });
  dist[start] = 0;

  for (;;) {
    let best = null;
    graph.nodes.forEach((n) => {
      if (!done.has(n.id) && dist[n.id] < INF && (best === null || dist[n.id] < dist[best])) best = n.id;
    });
    if (best === null) break;
    done.add(best);
    order.push(best);
    adj[best].forEach(({ to, w }) => {
      if (dist[best] + w < dist[to]) {
        dist[to] = dist[best] + w;
        parent[to] = best;
      }
    });
  }

  return { dist, parent, order };
}

export function bellmanFord(graph, start) {
  const edges = graph.edgeOrder || graph.edges;
  const V = graph.nodes.length;
  const dist = {};
  const parent = {};
  graph.nodes.forEach((n) => {
    dist[n.id] = INF;
    parent[n.id] = null;
  });
  dist[start] = 0;

  const snapshots = [{ ...dist }];
  const changedByRound = [];

  const pass = () => {
    const changed = [];
    edges.forEach((e) => {
      if (dist[e.from] !== INF && dist[e.from] + e.w < dist[e.to]) {
        dist[e.to] = dist[e.from] + e.w;
        parent[e.to] = e.from;
        changed.push(e);
      }
    });
    return changed;
  };

  for (let i = 0; i < V - 1; i += 1) {
    changedByRound.push(pass());
    snapshots.push({ ...dist });
  }

  const afterRounds = { ...dist };
  const extra = pass();
  const negativeCycle = extra.length > 0;

  let cycle = [];
  const affected = new Set();

  if (negativeCycle) {
    let x = extra[extra.length - 1].to;
    for (let i = 0; i < V; i += 1) x = parent[x];
    const start0 = x;
    do {
      cycle.push(x);
      x = parent[x];
    } while (x !== start0 && cycle.length <= V);
    cycle = cycle.sort();

    const adj = buildAdj(graph);
    const queue = extra.map((e) => e.to);
    queue.forEach((id) => affected.add(id));
    while (queue.length) {
      const u = queue.shift();
      adj[u].forEach(({ to }) => {
        if (!affected.has(to)) {
          affected.add(to);
          queue.push(to);
        }
      });
    }
  }

  return { dist: afterRounds, parent, snapshots, changedByRound, extra, negativeCycle, cycle, affected };
}
