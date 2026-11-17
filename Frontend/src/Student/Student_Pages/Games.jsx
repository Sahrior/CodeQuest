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
];

function GamePreview() {
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

const Games = () => {
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

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => (
            <article
              key={game.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
            >
              <GamePreview />

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
          ))}

          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 p-6 text-center">
            <p className="m-0 text-sm font-semibold text-stone-700">More games coming soon</p>
            <p className="m-0 mt-1 text-xs text-stone-500">New games will appear here as soon as they are ready.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Games;