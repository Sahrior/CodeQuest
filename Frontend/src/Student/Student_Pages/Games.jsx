import { useState } from "react";
import { Link } from "react-router-dom";
import StudentNav from "../Student_Components/StudentNav";
import { linkSmall } from "../Student_Components/shared";

const GAMES = [
  {
    id: 1,
    title: "Space Defender",
    topic: "if / else",
    difficulty: "Beginner",
    levels: 3,
    description:
      "Enemy ships fly in pairs. Compare their distances with if / else and shoot the closest one before it crashes into you.",
    path: "/student/games/1",
  },
  {
    id: 2,
    title: "Cyber Vault Hacker",
    topic: "binary search",
    difficulty: "Intermediate",
    levels: 3,
    description:
      "Crack a secured digital vault. Cut the search range in half with a while loop before the security alarm locks you out.",
    path: "/student/games/2",
  },
  {
    id: 3,
    title: "Galactic Route",
    topic: "shortest paths",
    difficulty: "Advanced",
    levels: 3,
    description:
      "Command an exploration ship. Each galaxy breaks your last algorithm, so you upgrade from DFS and BFS to Dijkstra and finally Bellman-Ford.",
    path: "/student/games/3",
  },
];

function SpacePreview() {
  return (
    <svg viewBox="0 0 400 200" className="block h-auto w-full" role="img" aria-label="Space Defender preview">
      <defs>
        <linearGradient id="previewSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1024" />
          <stop offset="1" stopColor="#060913" />
        </linearGradient>
        <radialGradient id="previewGlow" cx="0.7" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#f97316" stopOpacity="0.28" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="200" fill="url(#previewSky)" />
      <rect width="400" height="200" fill="url(#previewGlow)" />

      <ellipse cx="220" cy="100" rx="170" ry="80" fill="none" stroke="#fb923c" strokeOpacity="0.25" />

      {[
        [30, 30],
        [90, 160],
        [150, 20],
        [260, 175],
        [330, 25],
        [370, 140],
        [60, 90],
        [310, 95],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="2" height="2" fill="#fed7aa" opacity="0.7" />
      ))}

      <line x1="70" y1="100" x2="230" y2="52" stroke="#fdba74" strokeOpacity="0.4" strokeDasharray="4 6" />
      <line x1="70" y1="100" x2="300" y2="150" stroke="#fdba74" strokeOpacity="0.4" strokeDasharray="4 6" />

      <polygon points="92,100 64,86 54,92 58,100 54,108 64,114" fill="#fed7aa" stroke="#f97316" strokeWidth="1.5" />
      <ellipse cx="68" cy="100" rx="6" ry="4" fill="#38bdf8" />

      <polygon points="212,52 238,40 252,46 246,52 252,58 238,64" fill="#f43f5e" stroke="#fff7ed" />
      <polygon points="282,150 308,138 322,144 316,150 322,156 308,162" fill="#a855f7" stroke="#fff7ed" />

      <line x1="96" y1="100" x2="226" y2="52" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
      <line x1="96" y1="100" x2="226" y2="52" stroke="#fff7ed" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function VaultPreview() {
  return (
    <svg viewBox="0 0 400 200" className="block h-auto w-full" role="img" aria-label="Cyber Vault Hacker preview">
      <defs>
        <linearGradient id="vaultPreviewSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1024" />
          <stop offset="1" stopColor="#050810" />
        </linearGradient>
        <radialGradient id="vaultPreviewGlow" cx="0.28" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.22" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="200" fill="url(#vaultPreviewSky)" />
      <rect width="400" height="200" fill="url(#vaultPreviewGlow)" />

      {[
        [210, 10],
        [240, 30],
        [275, 12],
        [310, 28],
        [350, 8],
        [380, 24],
        [225, 180],
        [300, 186],
        [365, 176],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" fill="#22d3ee" opacity="0.35" />
      ))}

      <circle cx="105" cy="100" r="78" fill="#141b36" stroke="#2c3a66" strokeWidth="2" />
      <circle cx="105" cy="100" r="68" fill="#3a4466" stroke="#5a6a99" strokeWidth="2" />
      <circle cx="105" cy="100" r="46" fill="#2d3556" stroke="#4a5784" />

      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={105 + Math.cos(angle) * 58}
            cy={100 + Math.sin(angle) * 58}
            r="3"
            fill="#1c2441"
          />
        );
      })}

      {[0, 120, 240].map((deg) => (
        <g key={deg} transform={`rotate(${deg + 20} 105 100)`}>
          <line x1="105" y1="100" x2="105" y2="68" stroke="#9aa6cf" strokeWidth="5" strokeLinecap="round" />
          <circle cx="105" cy="68" r="6" fill="#c7d0f0" />
          <circle cx="105" cy="68" r="2.4" fill="#22d3ee" />
        </g>
      ))}

      <circle cx="105" cy="100" r="17" fill="#0b1020" stroke="#22d3ee" strokeWidth="2" />
      <rect x="99" y="99" width="12" height="9" fill="#22d3ee" />
      <path d="M100 99 A5 5 0 0 1 110 99" fill="none" stroke="#22d3ee" strokeWidth="2" />

      <rect x="206" y="22" width="178" height="62" fill="#070b1a" stroke="#22d3ee" strokeOpacity="0.45" />
      <text x="218" y="42" fill="#22d3ee" fontSize="12" fontFamily="monospace" fontWeight="bold">
        LOW = 1
      </text>
      <text x="218" y="58" fill="#22d3ee" fontSize="12" fontFamily="monospace" fontWeight="bold">
        HIGH = 128
      </text>
      <text x="218" y="75" fill="#fbbf24" fontSize="12" fontFamily="monospace" fontWeight="bold">
        Enter your MID: 64
      </text>

      <rect x="206" y="98" width="178" height="30" fill="#070b1a" stroke="#22d3ee" strokeOpacity="0.45" />
      <rect x="216" y="108" width="158" height="10" fill="#0b1226" />
      <rect x="296" y="108" width="40" height="10" fill="#22d3ee" fillOpacity="0.6" />
      <polygon points="296,102 304,102 300,108" fill="#fbbf24" />

      <rect x="206" y="142" width="178" height="34" fill="#070b1a" stroke="#f87171" strokeOpacity="0.45" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={214 + i * 10.5}
          y="156"
          width="8"
          height="12"
          fill={i < 5 ? "#34d399" : i < 9 ? "#fbbf24" : "#ffffff"}
          fillOpacity={i < 9 ? 0.85 : 0.07}
        />
      ))}
      <text x="214" y="152" fill="#94a3b8" fontSize="7" fontFamily="monospace">
        SECURITY ALARM
      </text>
    </svg>
  );
}

function GalaxyPreview() {
  const nodes = { A: [50, 100], B: [140, 45], C: [140, 155], D: [250, 100], E: [350, 100] };
  const edges = [["A", "B", "4"], ["A", "C", "3"], ["B", "C", "-6"], ["B", "D", "6"], ["C", "D", "2"], ["D", "E", "-4"]];
  return (
    <svg viewBox="0 0 400 200" className="block h-auto w-full" role="img" aria-label="Galactic Route preview">
      <defs>
        <linearGradient id="galaxyPreviewSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1024" />
          <stop offset="1" stopColor="#050810" />
        </linearGradient>
        <radialGradient id="galaxyPreviewGlow" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill="url(#galaxyPreviewSky)" />
      <rect width="400" height="200" fill="url(#galaxyPreviewGlow)" />
      {[[30, 20], [90, 180], [200, 15], [310, 185], [380, 30], [370, 160], [20, 150], [260, 30]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="2" height="2" fill="#fed7aa" opacity="0.7" />
      ))}
      {edges.map(([a, b, w]) => {
        const [x1, y1] = nodes[a];
        const [x2, y2] = nodes[b];
        const neg = w.startsWith("-");
        return (
          <g key={a + b}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={neg ? "#34d399" : "#64748b"} strokeWidth="2" strokeOpacity="0.8" />
            <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} fill={neg ? "#6ee7b7" : "#cbd5e1"} fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {w}
            </text>
          </g>
        );
      })}
      {Object.entries(nodes).map(([id, [x, y]]) => (
        <g key={id}>
          <circle cx={x} cy={y} r="14" fill="#141b36" stroke={id === "A" ? "#fb923c" : "#818cf8"} strokeWidth="2" />
          <text x={x} y={y + 4} fill="#fff7ed" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            {id}
          </text>
        </g>
      ))}
      <text x="200" y="190" fill="#fbbf24" fontSize="10" fontFamily="monospace" textAnchor="middle">
        negative routes: Dijkstra fails
      </text>
    </svg>
  );
}

const PREVIEWS = { 1: SpacePreview, 2: VaultPreview, 3: GalaxyPreview };

const DIFFICULTY_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 };
const DIFFICULTIES = [...new Set(GAMES.map((g) => g.difficulty))].sort(
  (a, b) => (DIFFICULTY_ORDER[a] ?? 99) - (DIFFICULTY_ORDER[b] ?? 99)
);
const TOPICS = [...new Set(GAMES.map((g) => g.topic))];

const SORT_OPTIONS = [
  { value: "default", label: "Sort: Default" },
  { value: "title-asc", label: "Title (A–Z)" },
  { value: "title-desc", label: "Title (Z–A)" },
  { value: "difficulty-asc", label: "Difficulty (easiest first)" },
  { value: "difficulty-desc", label: "Difficulty (hardest first)" },
  { value: "levels-desc", label: "Most levels" },
  { value: "levels-asc", label: "Fewest levels" },
];

const compareGames = (sortBy) => (a, b) => {
  const diffA = DIFFICULTY_ORDER[a.difficulty] ?? 99;
  const diffB = DIFFICULTY_ORDER[b.difficulty] ?? 99;

  switch (sortBy) {
    case "title-asc":
      return a.title.localeCompare(b.title);
    case "title-desc":
      return b.title.localeCompare(a.title);
    case "difficulty-asc":
      return diffA - diffB;
    case "difficulty-desc":
      return diffB - diffA;
    case "levels-desc":
      return b.levels - a.levels;
    case "levels-asc":
      return a.levels - b.levels;
    default:
      return a.id - b.id;
  }
};

const selectClass =
  "cursor-pointer rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200";

const Games = () => {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [topic, setTopic] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const q = query.trim().toLowerCase();
  const hasActiveFilters = q !== "" || difficulty !== "all" || topic !== "all";

  const filteredGames = GAMES.filter((game) =>
    [game.title, game.topic, game.difficulty, game.description]
      .join(" ")
      .toLowerCase()
      .includes(q)
  )
    .filter((game) => difficulty === "all" || game.difficulty === difficulty)
    .filter((game) => topic === "all" || game.topic === topic)
    .sort(compareGames(sortBy));

  const clearFilters = () => {
    setQuery("");
    setDifficulty("all");
    setTopic("all");
    setSortBy("default");
  };

  return (
    <div className="min-h-screen bg-orange-50 text-stone-900">
      <StudentNav />

      <main className="mx-auto max-w-[1100px] px-5 pb-16 pt-6">
        <Link to="/student" className={linkSmall}>
          ← Back to home
        </Link>
        <h1 className="m-0 mt-2 text-2xl font-bold text-stone-900">Play and Learn</h1>
        <p className="m-0 mb-6 mt-1 text-sm text-stone-500">
          Learn problem solving by coding small games. Write the logic, press Submit and watch it play out.
        </p>

        <div className="mb-6 rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="M13 13l4 4" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search games by name, topic or level..."
                aria-label="Search games"
                className="w-full rounded-lg border border-orange-200 bg-orange-50/40 py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                aria-label="Filter by difficulty"
                className={selectClass}
              >
                <option value="all">All difficulties</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Filter by topic" className={selectClass}>
                <option value="all">All topics</option>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort games" className={selectClass}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {(hasActiveFilters || sortBy !== "default") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <p className="m-0 mt-2 px-1 text-xs text-stone-500">
            Showing {filteredGames.length} of {GAMES.length} games
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => {
            const Preview = PREVIEWS[game.id];

            return (
              <article
                key={game.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
              >
                <Preview />

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-700">
                      Game {game.id}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
                      {game.difficulty}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                      {game.topic}
                    </span>
                  </div>

                  <h2 className="m-0 mt-3 text-lg font-semibold text-stone-900">{game.title}</h2>
                  <p className="m-0 mt-1 flex-1 text-sm leading-relaxed text-stone-600">{game.description}</p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-stone-500">{game.levels} levels</span>
                    <Link
                      to={game.path}
                      className="inline-block rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white no-underline hover:bg-orange-600"
                    >
                      Play
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredGames.length === 0 && (
            <p className="col-span-full m-0 text-sm text-stone-500">
              No games match your search or filters.{" "}
              <button
                type="button"
                onClick={clearFilters}
                className="font-semibold text-orange-600 underline hover:text-orange-700"
              >
                Clear all
              </button>
            </p>
          )}

          {!hasActiveFilters && (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 p-6 text-center">
              <p className="m-0 text-sm font-semibold text-stone-700">More games coming soon</p>
              <p className="m-0 mt-1 text-xs text-stone-500">New games will appear here as soon as they are ready.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Games;