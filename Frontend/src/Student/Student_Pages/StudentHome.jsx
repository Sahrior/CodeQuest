import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
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
  practice: "/student/practice",
  compete: "/student/compete",
  apply: "/student/apply",
  interview: "/student/interview",
  editProfile: "/student/edit-profile",
  profile: (id) => `/student/profile/${id}`,
};

const BAND_TEXT = { easy: "text-emerald-600", medium: "text-amber-600", hard: "text-red-600" };

const VERDICTS = {
  accepted: { label: "Accepted", cls: "text-emerald-600" },
  wrong_answer: { label: "Wrong Answer", cls: "text-red-600" },
  time_limit: { label: "Time Limit", cls: "text-amber-600" },
  memory_limit: { label: "Memory Limit", cls: "text-amber-600" },
  runtime_error: { label: "Runtime Error", cls: "text-red-600" },
  compile_error: { label: "Compile Error", cls: "text-red-600" },
  pending: { label: "Pending", cls: "text-stone-500" },
};

const JOB_TYPES = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  contract: "Contract",
};

const bandOf = (rating) => {
  if (rating < 1200) return { label: "Easy", key: "easy" };
  if (rating < 1800) return { label: "Medium", key: "medium" };
  return { label: "Hard", key: "hard" };
};

const timeUntil = (value) => {
  const diff = new Date(value) - new Date();
  if (diff <= 0) return "now";
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

const timeAgo = (value) => {
  const minutes = Math.max(1, Math.floor((new Date() - new Date(value)) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const durationOf = (start, end) => {
  const minutes = Math.round((new Date(end) - new Date(start)) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
};

const buildActivity = (activity, today, days = 30) => {
  const byDay = {};
  activity.forEach((a) => {
    byDay[a.day] = a;
  });

  const end = new Date(`${today}T00:00:00Z`);
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({
      date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }),
      submissions: byDay[key]?.count || 0,
      accepted: byDay[key]?.accepted || 0,
    });
  }

  return result;
};

const btnSolid =
  "inline-block whitespace-nowrap rounded-lg bg-orange-500 px-3.5 py-1.5 text-sm font-semibold text-white no-underline hover:bg-orange-600";
const btnOutline =
  "inline-block whitespace-nowrap rounded-lg border border-orange-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-orange-600 no-underline hover:bg-orange-50";

const StudentHome = () => {
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

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/student/home`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Could not load your dashboard");
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
  }, [navigate]);

  const Navbar = data?.profile.is_premium ? StudentNavbarPreminum : StudentNavbar;

  if (!data) {
    return (
      <div className="min-h-screen bg-orange-50">
        <StudentNavbar />
        <p className="py-24 text-center text-stone-500">{error || "Loading your dashboard..."}</p>
      </div>
    );
  }

  const { profile, stats } = data;
  const tier = tierOf(profile.contest_rating);
  const firstName = profile.name.split(" ")[0];
  const subtitle =
    profile.headline ||
    [profile.university, profile.city, profile.country].filter(Boolean)[0] ||
    "Keep solving, keep climbing.";

  const activityData = buildActivity(data.activity, data.today);
  const activityTotal = activityData.reduce((sum, d) => sum + d.submissions, 0);

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

  const skillGroups = skillGroupsOf(profile);

  return (
    <div className="min-h-screen bg-orange-50 text-stone-900">
      <Navbar />

      <main className="mx-auto max-w-[1240px] px-5 pb-14 pt-6">
        <div className="mb-5">
          <StudentSearch />
        </div>

        <section className="mb-5 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar name={profile.name} src={profile.profile_pic_url} size={68} />
              <div>
                <h1 className="m-0 text-2xl font-bold text-stone-900">Welcome back, {firstName}</h1>
                <p className="m-0 mt-1 text-sm text-stone-500">{subtitle}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border bg-white px-3 py-0.5 text-xs font-semibold"
                    style={{ color: tier.color, borderColor: tier.color }}
                  >
                    {tier.name}
                  </span>
                  {profile.is_premium && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-700">
                      Premium
                    </span>
                  )}
                  {profile.open_to_work && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                      Open to work
                    </span>
                  )}
                  <Link to={ROUTES.editProfile} className={linkSmall}>
                    Edit profile
                  </Link>
                </div>
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
                <div className="mt-1 text-xs text-stone-500">of {stats.total_students} students</div>
              </div>
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-5 py-3">
                <div className="text-2xl font-bold leading-none text-stone-900">{stats.streak}</div>
                <div className="mt-1 text-xs text-stone-500">Day streak</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Problems solved", value: stats.solved },
                { label: "Acceptance rate", value: `${stats.acceptance_rate}%` },
                { label: "Contests joined", value: stats.contests_joined },
                { label: "Solved this week", value: stats.solved_this_week },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-orange-100 border-l-4 border-l-orange-500 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="text-xs text-stone-500">{item.label}</div>
                  <div className="mt-1 text-2xl font-bold text-stone-900">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <Card
                title="Rating history"
                subtitle="Your rating after each finished contest"
                className="lg:col-span-2"
              >
                {ratingData.length === 0 ? (
                  <Empty>Join a contest to start your rating graph.</Empty>
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
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <Card
                title="Activity"
                subtitle={`${activityTotal} submissions in the last 30 days`}
                className="lg:col-span-2"
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillSubmissions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="fillAccepted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#ffedd5" vertical={false} />
                      <XAxis
                        dataKey="date"
                        interval={4}
                        tick={{ fontSize: 11, fill: "#78716c" }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#78716c" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="submissions"
                        name="Submissions"
                        stroke="#ea580c"
                        strokeWidth={2}
                        fill="url(#fillSubmissions)"
                      />
                      <Area
                        type="monotone"
                        dataKey="accepted"
                        name="Accepted"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#fillAccepted)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Strongest topics" subtitle="Problems solved per tag">
                {data.topics.length < 3 ? (
                  <Empty>Solve problems from at least 3 topics to see your radar.</Empty>
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

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <Card
                title="Skills and stack"
                action={<Link to={ROUTES.editProfile} className={linkSmall}>Edit</Link>}
                className="lg:col-span-2"
              >
                {skillGroups.length === 0 ? (
                  <Empty>
                    Add your tech stack, skills and favourite algorithms in{" "}
                    <Link to={ROUTES.editProfile} className={linkSmall}>Edit profile</Link>.
                  </Empty>
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
            </div>

            <Card
              title="Contests"
              action={<Link to={ROUTES.compete} className={linkSmall}>View all</Link>}
            >
              {data.upcoming_contests.length === 0 ? (
                <Empty>No upcoming contests right now. Check back soon.</Empty>
              ) : (
                <div className="divide-y divide-orange-100">
                  {data.upcoming_contests.map((c) => (
                    <div
                      key={c.contest_id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {c.contest_name}
                          {c.is_job_contest && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              Hiring
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-stone-500">
                          {formatDateTime(c.start_time)} · {durationOf(c.start_time, c.end_time)} ·{" "}
                          {c.problem_count} problems · {c.participants} registered
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                            c.status === "live" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {c.status === "live" ? "Live now" : `Starts in ${timeUntil(c.start_time)}`}
                        </span>
                        <Link to={ROUTES.compete} className={btnOutline}>
                          {c.registered ? "Registered" : "View"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card
              title="Recommended for you"
              subtitle="Unsolved problems close to your rating"
              action={<Link to={ROUTES.practice} className={linkSmall}>All problems</Link>}
            >
              {data.recommended_problems.length === 0 ? (
                <Empty>No new problems to recommend. You have solved everything available.</Empty>
              ) : (
                <div className="divide-y divide-orange-100">
                  {data.recommended_problems.map((p) => {
                    const band = bandOf(p.problem_rating);
                    return (
                      <div
                        key={p.problem_id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">{p.problem_name}</div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {p.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold ${BAND_TEXT[band.key]}`}>
                            {band.label} · {p.problem_rating}
                          </span>
                          <Link to={ROUTES.practice} className={btnSolid}>
                            Solve
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card title="Recent submissions">
              {data.recent_submissions.length === 0 ? (
                <Empty>You have not submitted anything yet. Pick a problem and give it a try.</Empty>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-stone-500">
                        <th className="pb-2 pr-3 font-semibold">Problem</th>
                        <th className="pb-2 pr-3 font-semibold">Verdict</th>
                        <th className="pb-2 pr-3 font-semibold">Language</th>
                        <th className="pb-2 font-semibold">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_submissions.map((s) => {
                        const verdict = VERDICTS[s.verdict] || { label: s.verdict, cls: "text-stone-500" };
                        return (
                          <tr key={s.submission_id} className="border-t border-orange-100">
                            <td className="py-2.5 pr-3">{s.problem_name}</td>
                            <td className={`py-2.5 pr-3 font-semibold ${verdict.cls}`}>{verdict.label}</td>
                            <td className="py-2.5 pr-3">{s.language}</td>
                            <td className="py-2.5 text-stone-500">{timeAgo(s.submitted_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            <Card
              title="Latest jobs"
              action={<Link to={ROUTES.apply} className={linkSmall}>View all</Link>}
            >
              {data.jobs.length === 0 ? (
                <Empty>No open jobs at the moment.</Empty>
              ) : (
                <div className="divide-y divide-orange-100">
                  {data.jobs.map((job) => (
                    <div key={job.job_id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar name={job.company_name} src={job.logo_url} size={40} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{job.job_name}</div>
                        <div className="mt-0.5 text-xs text-stone-500">
                          {job.company_name}
                          {job.location ? ` · ${job.location}` : ""}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                            {JOB_TYPES[job.job_type] || job.job_type}
                          </span>
                          {job.has_contest && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              Contest round
                            </span>
                          )}
                          {job.applied && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              Applied
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Top students">
              {data.leaderboard.length === 0 ? (
                <Empty>No rankings yet.</Empty>
              ) : (
                <div className="divide-y divide-orange-100">
                  {data.leaderboard.map((s) => (
                    <Link
                      key={s.id}
                      to={ROUTES.profile(s.id)}
                      className="flex items-center gap-3 py-2.5 text-inherit no-underline first:pt-0 last:pb-0 hover:opacity-80"
                    >
                      <span className="w-5 text-center text-sm font-bold text-orange-500">{s.rank}</span>
                      <Avatar name={s.name} src={s.profile_pic_url} size={34} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-stone-900">{s.name}</div>
                        <div className="text-xs text-stone-500">{s.country || "-"}</div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: tierOf(s.contest_rating).color }}>
                        {s.contest_rating}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <section className="rounded-2xl border border-orange-200 bg-orange-100/60 p-5">
              <h2 className="m-0 mb-1.5 text-lg font-semibold text-stone-900">
                {profile.is_premium ? "Mock interviews" : "Go Premium"}
              </h2>
              <p className="m-0 mb-4 text-sm leading-relaxed text-stone-600">
                {profile.is_premium
                  ? "Book a 1-on-1 mock interview with a CodeQuest admin and get detailed feedback."
                  : "Unlock 1-on-1 mock interviews with CodeQuest admins and get detailed feedback."}
              </p>
              <Link to={ROUTES.interview} className={btnSolid}>
                {profile.is_premium ? "Book an interview" : "Learn more"}
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default StudentHome;