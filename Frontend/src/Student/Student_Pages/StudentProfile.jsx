import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import StudentNavbar from "../Student_Components/StudentNavbar";
import StudentNavbarPreminum from "../Student_Components/StudentNavbarPreminum";
import StudentSearch from "../Student_Components/StudentSearch";
import {
  Avatar,
  Card,
  Chips,
  Empty,
  DIFF_COLORS,
  formatShortDate,
  linkSmall,
  skillGroupsOf,
  tierOf,
  tooltipStyle,
} from "../Student_Components/shared";
import { API_URL } from "../../api";

const ROUTES = {
  home: "/student",
  editProfile: "/student/edit-profile",
};

const EXTERNAL_LINKS = [
  { key: "github", label: "GitHub", build: (v) => v },
  { key: "linkedin", label: "LinkedIn", build: (v) => v },
  { key: "portfolio", label: "Portfolio", build: (v) => v },
  { key: "leetcode", label: "LeetCode", build: (v) => `https://leetcode.com/u/${encodeURIComponent(v)}/` },
  { key: "codeforces", label: "Codeforces", build: (v) => `https://codeforces.com/profile/${encodeURIComponent(v)}` },
  { key: "codechef", label: "CodeChef", build: (v) => `https://www.codechef.com/users/${encodeURIComponent(v)}` },
  { key: "hackerrank", label: "HackerRank", build: (v) => `https://www.hackerrank.com/profile/${encodeURIComponent(v)}` },
];

const formatMonthYear = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    let cancelled = false;
    setData(null);
    setError("");

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/student/profile/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Could not load this profile");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message === "Failed to fetch"
              ? "Cannot reach the server. Is the backend running?"
              : err.message
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const Navbar = data?.viewer_is_premium ? StudentNavbarPreminum : StudentNavbar;

  if (!data) {
    return (
      <div className="min-h-screen bg-orange-50">
        <StudentNavbar />
        <main className="mx-auto max-w-[1100px] px-5 pt-6">
          <Link to={ROUTES.home} className={linkSmall}>
            ← Back to home
          </Link>
          <p className="py-24 text-center text-stone-500">{error || "Loading profile..."}</p>
        </main>
      </div>
    );
  }

  const { profile, stats } = data;
  const tier = tierOf(profile.contest_rating);
  const skillGroups = skillGroupsOf(profile);

  const place = [profile.city, profile.country].filter(Boolean).join(", ");
  const education = [profile.degree, profile.university, profile.graduation_year]
    .filter(Boolean)
    .join(" · ");

  const links = EXTERNAL_LINKS.filter((item) => profile.links[item.key]).map((item) => ({
    label: item.label,
    href: item.build(profile.links[item.key]),
  }));

  const ratingData = data.rating_history.map((r) => ({
    ...r,
    label: formatShortDate(r.date),
  }));

  const difficultyData = [
    { name: "Easy", value: stats.easy_solved, color: DIFF_COLORS.easy },
    { name: "Medium", value: stats.medium_solved, color: DIFF_COLORS.medium },
    { name: "Hard", value: stats.hard_solved, color: DIFF_COLORS.hard },
  ];
  const nothingSolved = stats.solved === 0;

  return (
    <div className="min-h-screen bg-orange-50 text-stone-900">
      <Navbar />

      <main className="mx-auto max-w-[1100px] px-5 pb-14 pt-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <Link to={ROUTES.home} className={linkSmall}>
            ← Back to home
          </Link>
          <StudentSearch />
        </div>

        {data.is_self && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-100/60 px-4 py-3 text-sm text-stone-700">
            <span>This is how other students see your profile.</span>
            <Link to={ROUTES.editProfile} className={linkSmall}>
              Edit profile
            </Link>
          </div>
        )}

        <section className="mb-5 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <Avatar name={profile.name} src={profile.profile_pic_url} size={88} />
              <div className="min-w-0">
                <h1 className="m-0 text-2xl font-bold text-stone-900">{profile.name}</h1>
                {profile.headline && <p className="m-0 mt-1 text-sm text-stone-600">{profile.headline}</p>}
                <div className="mt-1.5 text-xs text-stone-500">
                  {[education, place].filter(Boolean).join("  |  ") || "CodeQuest student"}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border bg-white px-3 py-0.5 text-xs font-semibold"
                    style={{ color: tier.color, borderColor: tier.color }}
                  >
                    {tier.name}
                  </span>
                  {profile.open_to_work && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                      Open to work
                    </span>
                  )}
                  {profile.education_level && (
                    <span className="rounded-full bg-stone-100 px-3 py-0.5 text-xs font-medium text-stone-600">
                      {profile.education_level}
                    </span>
                  )}
                </div>
                {links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-600 no-underline hover:bg-orange-50"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-5 py-3">
                <div className="text-2xl font-bold leading-none" style={{ color: tier.color }}>
                  {profile.contest_rating}
                </div>
                <div className="mt-1 text-xs text-stone-500">Contest rating</div>
              </div>
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-5 py-3">
                <div className="text-2xl font-bold leading-none text-stone-900">#{stats.rank}</div>
                <div className="mt-1 text-xs text-stone-500">of {stats.total_students}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
            {profile.bio && (
              <Card title="About">
                <p className="m-0 text-sm leading-relaxed text-stone-700">{profile.bio}</p>
              </Card>
            )}

            <Card title="Rating history" subtitle="Rating after each finished contest">
              {ratingData.length === 0 ? (
                <Empty>No contests played yet.</Empty>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ratingData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                      <CartesianGrid stroke="#ffedd5" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} />
                      <YAxis
                        domain={["dataMin - 50", "dataMax + 50"]}
                        tick={{ fontSize: 11, fill: "#78716c" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelFormatter={(label, payload) => payload?.[0]?.payload.contest || label}
                        formatter={(value, name, item) => [
                          `${value} (${item.payload.change >= 0 ? "+" : ""}${item.payload.change})`,
                          "Rating",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#ea580c"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Skills and stack">
              {skillGroups.length === 0 ? (
                <Empty>{profile.name.split(" ")[0]} has not added any skills yet.</Empty>
              ) : (
                <div className="flex flex-col gap-4">
                  {skillGroups.map((group) => (
                    <div key={group.label}>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        {group.label}
                      </div>
                      <Chips items={group.items} tone={group.tone} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Strongest topics" subtitle="Problems solved per tag">
              {data.topics.length < 3 ? (
                <Empty>Not enough solved problems yet to show topics.</Empty>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data.topics} outerRadius="70%">
                      <PolarGrid stroke="#fed7aa" />
                      <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: "#78716c" }} />
                      <Radar
                        dataKey="solved"
                        name="Solved"
                        stroke="#ea580c"
                        fill="#f97316"
                        fillOpacity={0.45}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            <Card title="Solved by difficulty">
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nothingSolved ? [{ name: "None", value: 1, color: "#ffedd5" }] : difficultyData}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={78}
                      paddingAngle={nothingSolved ? 0 : 3}
                      stroke="none"
                    >
                      {(nothingSolved ? [{ color: "#ffedd5" }] : difficultyData).map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    {!nothingSolved && <Tooltip contentStyle={tooltipStyle} />}
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold leading-none text-stone-900">{stats.solved}</span>
                  <span className="mt-1 text-xs text-stone-500">of {stats.total_problems}</span>
                </div>
              </div>
              <div className="mt-2 flex justify-center gap-4 text-xs text-stone-600">
                {difficultyData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name} {d.value}
                  </span>
                ))}
              </div>
            </Card>

            <Card title="Stats">
              <dl className="m-0 divide-y divide-orange-100 text-sm">
                {[
                  { label: "Problems solved", value: stats.solved },
                  { label: "Acceptance rate", value: `${stats.acceptance_rate}%` },
                  { label: "Total submissions", value: stats.total_submissions },
                  { label: "Contests joined", value: stats.contests_joined },
                  { label: "Member since", value: formatMonthYear(profile.joined) },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                    <dt className="text-stone-500">{row.label}</dt>
                    <dd className="m-0 font-semibold text-stone-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card title="Languages used" subtitle="Submissions per language">
              {data.languages.length === 0 ? (
                <Empty>No submissions yet.</Empty>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.languages}
                      layout="vertical"
                      margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#ffedd5" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#78716c" }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="language"
                        width={78}
                        tick={{ fontSize: 11, fill: "#78716c" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#fff7ed" }} />
                      <Bar dataKey="count" name="Submissions" fill="#f97316" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;