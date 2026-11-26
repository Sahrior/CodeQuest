import { INF_VALUE } from "./exprEval";

/* ------------------------------------------------------------------ */
/* Levels                                                              */
/* ------------------------------------------------------------------ */

export const LEVELS = [
  {
    id: 1,
    name: "The Lost Astronaut",
    algo: "DFS / BFS",
    difficulty: "Beginner",
    question: "Can I reach the destination?",
    blurb: "Explore planets and rescue astronauts. Learn graph traversal and shortest paths in unweighted graphs.",
    problem: "I just need to find a way to reach the destination.",
  },
  {
    id: 2,
    name: "The Dangerous Galaxy",
    algo: "Dijkstra",
    difficulty: "Intermediate",
    question: "Which path costs the least?",
    blurb: "Manage fuel and find the cheapest route. Learn weighted shortest paths with non-negative weights.",
    problem: "Routes have different costs now. I need the cheapest route.",
  },
  {
    id: 3,
    name: "The Forbidden Galaxy",
    algo: "Bellman-Ford",
    difficulty: "Advanced",
    question: "What if some routes give us energy?",
    blurb: "Navigate energy portals and dangerous cycles. Learn negative weights and negative-cycle detection.",
    problem: "Some routes give energy back. I need an algorithm that survives negative weights and detects negative cycles.",
  },
];

export const RANKS = [
  { min: 0, name: "Cadet" },
  { min: 150, name: "Pilot" },
  { min: 350, name: "Navigator" },
  { min: 550, name: "Senior Navigator" },
];

export const SKILLS = [
  { id: "DFS", label: "DFS", mission: "1A" },
  { id: "BFS", label: "BFS", mission: "1C" },
  { id: "Dijkstra", label: "Dijkstra", mission: "2C" },
  { id: "Bellman-Ford", label: "Bellman-Ford", mission: "3D" },
];

/* ------------------------------------------------------------------ */
/* Missions                                                            */
/* ------------------------------------------------------------------ */

export const MISSIONS = [
  {
    id: "1A",
    level: 1,
    kind: "dfs",
    title: "Mission 1A: DFS Navigation",
    short: "Explore one route as deep as it goes, backtrack at dead ends.",
    graph: "lostAstronaut",
    start: "A",
    target: "G",
    xp: 50,
    updateXp: 0,
    coins: 20,
    challenge: "dfs",
    story: [
      "An astronaut is stranded on an unknown planet. Your spaceship is at Planet A and the astronaut is waiting at Planet G.",
      "The galaxy map shows which planets are connected by space routes. Some planets, like J and K, are completely isolated from the rest.",
      "For now every route is treated equally. We only care about one thing: can we reach Planet G?",
    ],
    objective:
      "Operate the DFS navigation computer. Go deep into one route, and backtrack when you hit a dead end. Your computer checks neighbours in alphabetical order.",
    aiIntro: "Commander, Planet G is out there somewhere. Pick a neighbouring planet to start exploring.",
    hints: [
      "DFS goes as deep as possible. Always move to the first unvisited neighbour (alphabetical order).",
      "A planet with no unvisited neighbours is a dead end. Press Backtrack to return to the previous planet on the stack.",
      "The stack on the right is your current route. The planet on top is where you are standing.",
    ],
    after: "DFS found the astronaut. Remember: it found A route, but is it the shortest one? Let's find out in the next mission.",
  },
  {
    id: "1B",
    level: 1,
    kind: "bfs",
    title: "Mission 1B: BFS Navigation",
    short: "Explore nearby planets first, layer by layer.",
    graph: "lostAstronaut",
    start: "A",
    target: "G",
    xp: 50,
    updateXp: 0,
    coins: 20,
    challenge: "bfs",
    learn: "dfsBfs",
    story: [
      "Mission control calls in: \"Commander, the astronaut's oxygen is running low. Can you find the astronaut using the fewest number of space jumps?\"",
      "DFS dives deep into one route, so it can wander far from the target. This time we need a different plan: explore all the nearby planets first, then move one layer further out.",
    ],
    objective:
      "Operate the BFS navigation computer. Scan planets in the order they were discovered (first in, first out) until the astronaut is found.",
    aiIntro: "Commander, BFS keeps a queue of discovered planets. Scan the planet at the front of the queue.",
    hints: [
      "A queue is first in, first out. The planet that was discovered earliest must be scanned first.",
      "The planet at the front of the queue is highlighted in the queue panel.",
      "Scanning a planet adds all of its unvisited neighbours to the back of the queue, one jump further away.",
    ],
    after: "BFS found the astronaut with the fewest jumps. Compare the two algorithms below.",
  },
  {
    id: "1C",
    level: 1,
    kind: "rescue",
    boss: true,
    title: "Boss mission: The Rescue",
    short: "A bigger galaxy. Choose the right algorithm for the objective.",
    graph: "rescue",
    start: "A",
    target: "L",
    oxygen: 5,
    xp: 80,
    updateXp: 0,
    coins: 40,
    unlock: "BFS",
    story: [
      "A second astronaut is stranded at Planet L, deep inside a much larger galaxy with many possible routes.",
      "Their oxygen only lasts for 5 space jumps. You must reach them in as few jumps as possible, and then scan the galaxy for planets that can never be reached from your ship.",
    ],
    objective: "Pick the navigation mode that fits the objective, rescue the astronaut, then mark every unreachable planet.",
    aiIntro: "Commander, this galaxy is huge. Which navigation mode should I use for this rescue?",
    hints: [
      "The astronaut's oxygen is limited by the NUMBER OF JUMPS. Which algorithm guarantees the fewest jumps?",
      "BFS scans layer by layer, so the first time it reaches Planet L is also the shortest route.",
      "Unreachable planets are the ones that BFS or DFS from Planet A never discovers.",
    ],
    after: "Rescue complete. Level 2 is waiting.",
    whyNext: {
      title: "Why do we need Level 2?",
      lines: [
        "After the rescue, a new problem appears. Not every space route takes the same amount of time. One route takes 2 minutes, another takes 15 minutes, and another takes 30 minutes.",
        "BFS finds the path with the fewest edges, but that does not mean the path with the lowest total travel cost. We need a smarter navigation system. That is where Dijkstra comes in.",
      ],
    },
  },
  {
    id: "2A",
    level: 2,
    kind: "dijkstra",
    title: "Mission 2A: Fuel Optimization",
    short: "Operate the navigation console and always pick the closest planet.",
    graph: "fuelA",
    start: "A",
    target: "D",
    xp: 50,
    updateXp: 30,
    coins: 25,
    briefing: "routes",
    story: [
      "The astronaut has been rescued, but a distress signal comes from another galaxy. Your spaceship must reach Planet D before its oxygen runs out.",
      "This time every space route has a different fuel cost, and fuel is precious. BFS only counts jumps, so it can pick a route that burns far more fuel.",
    ],
    objective:
      "Operate the navigation console. Each turn: select the unvisited planet with the smallest known distance, then decide for each of its routes whether the distance should be updated.",
    aiIntro: "Commander, we start at Planet A with distance 0. Every other planet is at infinity. Select the planet with the smallest distance.",
    hints: [
      "Dijkstra always selects the unvisited planet with the smallest known distance. Infinity means 'not discovered yet'.",
      "For each route u to v with cost w, compute dist[u] + w. Update only if that is smaller than the current dist[v].",
      "You are finished when the destination planet D is selected: its distance can no longer improve.",
    ],
    after: "You reached Planet D with the least fuel. Now let's write the navigation code.",
  },
  {
    id: "2B",
    level: 2,
    kind: "code",
    title: "Mission 2B: Write the Navigation Code",
    short: "Turn the console into C++ with dist[], priority_queue and relaxation.",
    xp: 60,
    updateXp: 0,
    coins: 25,
    challenge: "dijkstra",
    story: [
      "The console worked, but a real ship's computer needs code. The navigation system needs three things: a dist[] array, a priority_queue that always hands out the closest planet, and relaxation to improve distances.",
    ],
    objective: "Complete the C++ implementation of Dijkstra's algorithm.",
    aiIntro: "Commander, fill in the missing pieces of the navigation program.",
    hints: [
      "Unknown distances start at a huge number called INF, never at 0.",
      "Relaxation: if the route through u is cheaper, then dist[u] + w < dist[v].",
      "When the condition is true, set dist[v] to that cheaper value.",
    ],
    after: "The navigation program is ready.",
  },
  {
    id: "2C",
    level: 2,
    kind: "dijkstra",
    boss: true,
    title: "Boss mission: The Fuel Crisis",
    short: "A 10-planet galaxy. Find the cheapest route before the fuel runs out.",
    graph: "fuelCrisis",
    start: "A",
    target: "J",
    fuelLimit: 18,
    xp: 50,
    updateXp: 30,
    coins: 50,
    unlock: "Dijkstra",
    choice: {
      question: "The ship only carries 18 fuel. Which navigation algorithm should plan this route?",
      options: [
        { id: "dfs", label: "DFS", sub: "dive deep" },
        { id: "bfs", label: "BFS", sub: "fewest jumps" },
        { id: "dijkstra", label: "Dijkstra", sub: "cheapest total cost" },
      ],
      correct: "dijkstra",
    },
    story: [
      "A large galaxy lies between you and the next distress signal. It has 10 planets and many routes, each with its own fuel cost.",
      "Your tanks hold only 18 fuel. Any route that costs more strands the ship in the middle of nowhere.",
    ],
    objective: "Choose the right algorithm, then run it on the navigation console until Planet J is reached.",
    aiIntro: "Commander, fuel is critical. Which algorithm should I use?",
    hints: [
      "The ship burns fuel, not jumps. Which algorithm adds up edge costs?",
      "Each turn select the unvisited planet with the smallest known distance. If two planets tie, either one is fine.",
      "Relax every route leaving the selected planet: update only when dist[u] + w is smaller than dist[v].",
    ],
    after: "Fuel crisis solved.",
    ai: "Commander, BFS was excellent when every route had the same cost. But now that routes have different costs, we need an algorithm that considers the total travel cost. Dijkstra solves this problem efficiently when all edge weights are non-negative.",
    whyNext: {
      title: "Why do we need Level 3?",
      lines: [
        "A transmission arrives from an abandoned civilization. Some space routes contain energy portals. They give your ship energy instead of consuming it, so those routes have NEGATIVE weights.",
        "Dijkstra assumes that once a planet is finalized as the closest, no cheaper route to it can appear later. A negative route breaks that assumption. Your navigation system needs another upgrade.",
      ],
    },
  },
  {
    id: "3A",
    level: 3,
    kind: "bellman",
    title: "Mission 3A: Repair the Navigation System",
    short: "Relax every route again and again until the distances settle.",
    graph: "portalIntro",
    start: "A",
    target: "D",
    xp: 50,
    updateXp: 30,
    coins: 30,
    briefing: "dijkstraFails",
    challenge: "relax",
    story: [
      "Your spaceship enters the Forbidden Galaxy. Normal routes consume fuel, but energy portals restore it. Some routes now have negative travel costs.",
      "Dijkstra's navigation is broken here, so you have to repair it. The new system does not choose the nearest planet. Instead it scans every route, again and again, improving distances each time.",
    ],
    objective:
      "Perform route relaxation. In every round, go through all routes in the listed order and decide whether each one improves a distance. Repeat V - 1 rounds.",
    aiIntro: "Commander, relax every route in order. A route u to v with cost w improves things only if dist[u] + w is smaller than dist[v].",
    hints: [
      "You cannot relax a route that starts at a planet whose distance is still infinity. Nothing is known about it yet.",
      "Negative weights are fine: a cost of -6 simply makes the total smaller.",
      "A planet's distance can improve in a LATER round, which is exactly why we repeat the whole scan.",
    ],
    after: "The navigation system is repaired.",
  },
  {
    id: "3B",
    level: 3,
    kind: "bellman",
    title: "Mission 3B: The Negative Portal",
    short: "A bigger map with several negative routes and a route to rebuild.",
    graph: "negativePortal",
    start: "A",
    target: "E",
    xp: 60,
    updateXp: 30,
    coins: 30,
    challenge: "rounds",
    story: [
      "Deeper in the galaxy there are more energy portals. Several routes now restore fuel, and the cheapest way to Planet E is not obvious at all.",
      "Complete every relaxation round, then use the parent array to rebuild the route your ship should fly.",
    ],
    objective: "Run all V - 1 relaxation rounds, read the final distance array, and reconstruct the route to Planet E from the parent array.",
    aiIntro: "Commander, this map has 5 planets, so we need 4 full rounds. Relax the routes in the order shown.",
    hints: [
      "With V planets, a shortest route has at most V - 1 edges, so V - 1 rounds are always enough.",
      "When a distance improves, remember where the improvement came from: parent[v] = u.",
      "You can let the AI run a round for you once you understand it, with the 'Auto-run round' button.",
    ],
    after: "You found the cheapest route through the negative portals.",
  },
  {
    id: "3C",
    level: 3,
    kind: "bellman",
    cycle: true,
    boss: true,
    title: "Boss mission: The Infinite Energy Trap",
    short: "Detect a negative-weight cycle with one extra pass.",
    graph: "energyTrap",
    start: "A",
    target: "D",
    xp: 70,
    updateXp: 30,
    coins: 50,
    challenge: "cycle",
    story: [
      "Here is the final twist. Some portals form a loop: A to B costs 2, B to C costs -5, and C back to A costs 1. One lap of the loop costs 2 - 5 + 1 = -2.",
      "Every lap makes the total even cheaper. There is no cheapest route at all if such a loop is reachable and can lead to the destination.",
    ],
    objective:
      "Run V - 1 rounds, then perform one extra pass. If any distance still improves, a negative cycle exists. Find the cycle and decide whether a finite shortest route to D exists.",
    aiIntro: "Commander, we need to check this network for infinite energy loops. Start relaxing.",
    hints: [
      "After V - 1 rounds all shortest distances should be final. If one more pass still improves something, something is wrong.",
      "In the extra pass, answer 'Still improves' when dist[u] + w < dist[v].",
      "A negative cycle is a loop of routes whose costs add up to less than zero. Click the planets that form the loop.",
    ],
    after: "Negative cycle identified.",
  },
  {
    id: "3D",
    level: 3,
    kind: "final",
    boss: true,
    title: "Final boss: Save the Galaxy",
    short: "A huge map with positive and negative routes and a hidden cycle.",
    graph: "forbidden",
    start: "A",
    target: "H",
    xp: 100,
    updateXp: 0,
    coins: 80,
    unlock: "Bellman-Ford",
    choice: {
      question: "The galaxy contains negative routes and maybe even a negative cycle. Which algorithm should we trust?",
      options: [
        { id: "bfs", label: "BFS", sub: "fewest jumps" },
        { id: "dijkstra", label: "Dijkstra", sub: "non-negative weights only" },
        { id: "bellman", label: "Bellman-Ford", sub: "handles negative weights" },
      ],
      correct: "bellman",
    },
    story: [
      "This is the Forbidden Galaxy's core: positive routes, negative routes, many possible paths, and somewhere a hidden energy loop.",
      "Two beacons need you. Planet H is the safe base. Some other planets might be trapped behind an infinite loop. Decide which is which.",
    ],
    objective: "Choose the right algorithm, watch it run, then find the planets that have no finite shortest route and calculate the cheapest fuel cost to Planet H.",
    aiIntro: "Commander, this is the final navigation test. Which algorithm should I run?",
    hints: [
      "Negative weights rule out Dijkstra, and BFS ignores costs completely. Only one algorithm is left.",
      "After V - 1 rounds, any planet that STILL improves in the extra pass is part of, or reachable from, a negative cycle.",
      "Planet H cannot be reached through the cycle, so its distance after the rounds is its true shortest distance.",
    ],
    after: "You have become a Galactic Navigator!",
  },
];

/* ------------------------------------------------------------------ */
/* Code challenges                                                     */
/* ------------------------------------------------------------------ */

const relaxTests = ({ withInf, withD }) => {
  const mk = (dist, u, v, w, why) => ({ env: { dist, u, v, w, ...(withD ? { d: dist[u] } : {}) }, why });
  const tests = [
    mk([0, 10], 0, 1, 3, "The route through u is cheaper (0 + 3 < 10), so this condition should be true."),
    mk([0, 2], 0, 1, 3, "The new route costs 3, which is MORE than the current 2. Only update when the new route is cheaper."),
    mk([0, 3], 0, 1, 3, "A route with equal cost is not an improvement. Use < and not <=."),
    mk([4, 9], 0, 1, -6, "With a negative weight the new cost is 4 + (-6) = -2, which is cheaper than 9. This should be true."),
    mk([9, 4], 0, 1, 2, "Compare the NEW cost (through u) with dist[v], not the other way round."),
  ];
  if (withInf) {
    tests.push(
      mk(
        [INF_VALUE, INF_VALUE],
        0,
        1,
        -6,
        "Careful: dist[u] is still INF, so INF + (-6) looks 'cheaper' than INF. You must skip routes that start at an unreached planet: check dist[u] != INF first."
      )
    );
  }
  return tests;
};

export const CHALLENGES = {
  dfs: {
    title: "Code challenge: DFS",
    intro: "Complete the DFS function. It must never enter a planet that was already visited.",
    level: "1 blank",
    code: `vector<int> graph[N];
bool visited[N];

void dfs(int u) {
    visited[u] = true;            // mark this planet
    for (int next : graph[u]) {
        if (___1___) {            // only unexplored planets
            dfs(next);
        }
    }
}`,
    blanks: [
      {
        id: 1,
        kind: "expr",
        type: "bool",
        placeholder: "condition",
        answer: "!visited[next]",
        hint: "You want planets that are NOT visited yet. Use ! in front of visited[next].",
        tests: [
          { env: { visited: [0, 1], next: 0, u: 1 }, why: "next = 0 is not visited, so DFS should go there. Use ! (not) in front of visited[next]." },
          { env: { visited: [1, 1], next: 0, u: 1 }, why: "A visited planet must be skipped, otherwise DFS can loop forever." },
        ],
      },
    ],
  },
  bfs: {
    title: "Code challenge: BFS",
    intro: "Complete the BFS loop. BFS uses a queue and counts one more jump for every layer.",
    level: "2 blanks",
    code: `queue<int> q;
q.push(start);
visited[start] = true;

while (!q.empty()) {
    int u = ___1___;               // planet at the front of the queue
    q.pop();
    for (int next : graph[u]) {
        if (!visited[next]) {
            visited[next] = true;
            jumps[next] = jumps[u] + 1;
            q.___2___;             // discover it
        }
    }
}`,
    blanks: [
      {
        id: 1,
        kind: "text",
        placeholder: "code",
        accept: ["q.front()"],
        wrong: {
          "q.top()": "top() belongs to a stack or priority_queue. A queue gives its first element with front().",
          "q.back()": "back() is the NEWEST element. BFS must take the OLDEST one, the front.",
        },
        fallback: "BFS needs the first element of the queue (first in, first out).",
        hint: "A std::queue has front() and back(). Which end do we take from?",
      },
      {
        id: 2,
        kind: "text",
        placeholder: "code",
        accept: ["push(next)"],
        wrong: { "push(u)": "u was already scanned. Add the newly discovered planet: next." },
        fallback: "Add the newly discovered planet to the back of the queue: push(next).",
        hint: "Which planet did we just discover? Push that planet.",
      },
    ],
  },
  dijkstra: {
    title: "Code challenge: Dijkstra",
    intro: "Complete the navigation program. The priority_queue always hands out the planet with the smallest distance.",
    level: "3 blanks",
    code: `vector<int> dist(n, ___1___);          // unknown distance
priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;

dist[start] = 0;
pq.push({0, start});

while (!pq.empty()) {
    int d = pq.top().first;
    int u = pq.top().second;
    pq.pop();
    if (d > dist[u]) continue;         // outdated entry

    for (auto edge : graph[u]) {
        int v = edge.first;
        int w = edge.second;
        if (___2___) {                 // is the route through u cheaper?
            ___3___;                   // relaxation
            pq.push({dist[v], v});
        }
    }
}`,
    blanks: [
      {
        id: 1,
        kind: "text",
        placeholder: "value",
        accept: ["INF", "1e9", "1000000000", "INT_MAX"],
        wrong: { "0": "0 would mean every planet is already free to reach. Unknown distances must start at infinity (INF)." },
        fallback: "Unknown planets start at 'infinity': use a very large number such as INF.",
        hint: "Every planet except the start is unreachable at first. Which huge value means 'not yet known'?",
      },
      {
        id: 2,
        kind: "expr",
        type: "bool",
        placeholder: "condition",
        answer: "dist[u] + w < dist[v]",
        tests: relaxTests({ withInf: false, withD: true }),
        hint: "Compare the cost of going through u (dist[u] + w) with the best known dist[v].",
      },
      {
        id: 3,
        kind: "assign",
        placeholder: "assignment",
        answer: "dist[v] = dist[u] + w",
        tests: [
          { env: { dist: [2, 9], u: 0, v: 1, w: 3, d: 2 }, why: "After relaxing, dist[v] must become the cheaper cost: dist[u] + w." },
          { env: { dist: [7, 20], u: 0, v: 1, w: 4, d: 7 }, why: "dist[v] should hold the total cost from the start, so add w to dist[u]." },
        ],
        hint: "Set dist[v] to the new cheaper total: dist[u] + w.",
      },
    ],
  },
  relax: {
    title: "Code challenge: Relaxation",
    intro: "Complete the relaxation step that you just performed by hand. It has one new danger: INF plus a negative number.",
    level: "2 blanks",
    code: `for (auto e : edges) {
    int u = e.from, v = e.to, w = e.weight;
    if (___1___) {          // can this route improve dist[v]?
        ___2___;            // relax
        parent[v] = u;      // remember how we got here
    }
}`,
    blanks: [
      {
        id: 1,
        kind: "expr",
        type: "bool",
        placeholder: "condition",
        answer: "dist[u] != INF && dist[u] + w < dist[v]",
        tests: relaxTests({ withInf: true, withD: false }),
        hint: "Two checks joined with &&: the start planet must be reached (dist[u] != INF) and the route must be cheaper.",
      },
      {
        id: 2,
        kind: "assign",
        placeholder: "assignment",
        answer: "dist[v] = dist[u] + w",
        tests: [
          { env: { dist: [4, 9], u: 0, v: 1, w: -6 }, why: "dist[v] must become dist[u] + w, even when w is negative." },
          { env: { dist: [2, 9], u: 0, v: 1, w: 3 }, why: "dist[v] must become the new total cost: dist[u] + w." },
        ],
        hint: "Update dist[v] to the cheaper total cost.",
      },
    ],
  },
  rounds: {
    title: "Code challenge: Bellman-Ford",
    intro: "Complete the repeated rounds and the route reconstruction using the parent array.",
    level: "2 blanks",
    code: `for (int i = 0; i < ___1___; i++) {      // repeat the whole scan
    for (auto e : edges) {
        int u = e.from, v = e.to, w = e.weight;
        if (dist[u] != INF && dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            parent[v] = u;
        }
    }
}

// rebuild the route from the target back to the start (parent[start] = -1)
for (int at = target; at != -1; at = ___2___) {
    route.push_back(at);
}`,
    blanks: [
      {
        id: 1,
        kind: "expr",
        type: "num",
        placeholder: "rounds",
        answer: "V - 1",
        tests: [
          { env: { V: 4 }, why: "A shortest route has at most V - 1 edges, so V - 1 rounds are enough (and needed)." },
          { env: { V: 5 }, why: "With V planets, repeat V - 1 times." },
          { env: { V: 8 }, why: "With V planets, repeat V - 1 times." },
        ],
        hint: "How many edges can a shortest route have at most, if there are V planets?",
      },
      {
        id: 2,
        kind: "text",
        placeholder: "code",
        accept: ["parent[at]"],
        wrong: { "parent[target]": "That always jumps to the same planet. Follow the chain: the parent of the CURRENT planet 'at'." },
        fallback: "Walk backwards: the next planet is the parent of the current planet, parent[at].",
        hint: "From the current planet 'at', jump to the planet we came from.",
      },
    ],
  },
  cycle: {
    title: "Code challenge: Negative cycle detection",
    intro: "Complete the full Bellman-Ford with the extra pass that detects a negative cycle.",
    level: "2 blanks",
    code: `for (int i = 0; i < ___1___; i++) {
    relaxAllEdges();                      // normal rounds
}

// one extra pass
for (auto e : edges) {
    int u = e.from, v = e.to, w = e.weight;
    if (dist[u] != INF && ___2___) {
        cout << "NEGATIVE CYCLE DETECTED";
        return 0;
    }
}`,
    blanks: [
      {
        id: 1,
        kind: "expr",
        type: "num",
        placeholder: "rounds",
        answer: "V - 1",
        tests: [
          { env: { V: 4 }, why: "Do the normal rounds V - 1 times. The extra pass is the V-th pass." },
          { env: { V: 7 }, why: "Do the normal rounds V - 1 times. The extra pass is the V-th pass." },
        ],
        hint: "The normal rounds are the same as before.",
      },
      {
        id: 2,
        kind: "expr",
        type: "bool",
        placeholder: "condition",
        answer: "dist[u] + w < dist[v]",
        tests: relaxTests({ withInf: false, withD: false }).slice(0, 5),
        hint: "If a distance can STILL be improved after V - 1 rounds, there is a negative cycle. It is the same relaxation test.",
      },
    ],
  },
};
