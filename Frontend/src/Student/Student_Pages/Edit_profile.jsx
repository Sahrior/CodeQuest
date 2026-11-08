import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentNavbar from "../Student_Components/StudentNavbar";
import StudentNavbarPreminum from "../Student_Components/StudentNavbarPreminum";
import { Avatar, Card, assetUrl, linkSmall } from "../Student_Components/shared";
import { API_URL } from "../../api";

const EDUCATION_LEVELS = ["High School", "Undergraduate", "Graduate", "Self-taught"];

const SUGGESTIONS = {
  tech_stack: ["React", "Node.js", "Express", "MySQL", "MongoDB", "PostgreSQL", "Docker", "Git", "TypeScript", "Next.js", "Django", "Spring Boot", "AWS", "Tailwind CSS"],
  skills: ["Problem Solving", "Teamwork", "Communication", "System Design", "Debugging", "Data Analysis", "Leadership", "Technical Writing"],
  preferred_languages: ["C++", "Python", "Java", "JavaScript", "C", "Go", "Rust", "Kotlin", "C#", "TypeScript"],
  algorithms: ["Dynamic Programming", "Graphs", "Binary Search", "Greedy", "Two Pointers", "Sorting", "Segment Tree", "Trees", "Backtracking", "Number Theory", "Hashing", "Bit Manipulation"],
};

const SECTIONS = [
  { id: "photo", label: "Profile photo" },
  { id: "basic", label: "Basic information" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills and stack" },
  { id: "links", label: "Links and coding profiles" },
  { id: "privacy", label: "Privacy and job preferences" },
  { id: "resume", label: "Resume" },
  { id: "security", label: "Security" },
];

const EMPTY_FORM = {
  name: "",
  headline: "",
  bio: "",
  phone: "",
  country: "",
  city: "",
  education_level: "",
  university: "",
  degree: "",
  graduation_year: "",
  skills: [],
  tech_stack: [],
  preferred_languages: [],
  algorithms: [],
  github_url: "",
  linkedin_url: "",
  portfolio_url: "",
  leetcode_username: "",
  codeforces_handle: "",
  codechef_username: "",
  hackerrank_username: "",
  open_to_work: false,
  is_profile_public: true,
};

const toForm = (profile) => {
  const form = {};
  Object.keys(EMPTY_FORM).forEach((key) => {
    form[key] = profile[key] ?? EMPTY_FORM[key];
  });
  form.graduation_year = profile.graduation_year ? String(profile.graduation_year) : "";
  return form;
};

const normalizeUrl = (value) => {
  const text = value.trim();
  if (!text) return "";
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
};

const buildPayload = (form) => ({
  ...form,
  github_url: normalizeUrl(form.github_url),
  linkedin_url: normalizeUrl(form.linkedin_url),
  portfolio_url: normalizeUrl(form.portfolio_url),
  graduation_year: form.graduation_year.trim(),
});

const syncStoredName = (name) => {
  try {
    const stored = JSON.parse(localStorage.getItem("user"));
    localStorage.setItem("user", JSON.stringify({ ...stored, name }));
  } catch {
    // nothing to update
  }
};

const request = async (navigate, path, { method = "GET", json, body } = {}) => {
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
  if (json) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_URL}/api/student${path}`, {
      method,
      headers,
      body: json ? JSON.stringify(json) : body,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    throw new Error("Your session has expired. Please log in again");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.fields = data.errors || {};
    throw error;
  }

  return data;
};

const inputClass = (hasError) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:ring-2 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-orange-200 focus:border-orange-400 focus:ring-orange-100"
  }`;

const btnSolid =
  "inline-block cursor-pointer whitespace-nowrap rounded-lg border border-orange-500 bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-block cursor-pointer whitespace-nowrap rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60";
const btnDanger =
  "inline-block cursor-pointer whitespace-nowrap rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

function Field({ label, hint, error, counter, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-stone-800">{label}</label>
        {counter && <span className="text-xs text-stone-400">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p className="m-0 mt-1 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="m-0 mt-1 text-xs text-stone-500">{hint}</p>
      )}
    </div>
  );
}

function PrefixInput({ prefix, value, onChange, placeholder, error }) {
  return (
    <div
      className={`flex overflow-hidden rounded-lg border bg-white focus-within:ring-2 ${
        error
          ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
          : "border-orange-200 focus-within:border-orange-400 focus-within:ring-orange-100"
      }`}
    >
      <span className="flex items-center whitespace-nowrap border-r border-orange-100 bg-orange-50 px-3 text-xs text-stone-500">
        {prefix}
      </span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400"
      />
    </div>
  );
}

function TagInput({ label, hint, value, onChange, suggestions, error }) {
  const [draft, setDraft] = useState("");

  const add = (raw) => {
    const text = raw.trim();
    if (!text) return;

    const exists = value.some((item) => item.toLowerCase() === text.toLowerCase());
    if (!exists && value.length < 20 && text.length <= 40) {
      onChange([...value, text]);
    }
    setDraft("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const available = suggestions
    .filter((item) => !value.some((v) => v.toLowerCase() === item.toLowerCase()))
    .slice(0, 8);

  return (
    <Field label={label} hint={hint} error={error} counter={`${value.length}/20`}>
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-lg border bg-white p-2 focus-within:ring-2 ${
          error
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
            : "border-orange-200 focus-within:border-orange-400 focus-within:ring-orange-100"
        }`}
      >
        {value.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 rounded-full bg-orange-100 py-1 pl-2.5 pr-1.5 text-xs font-medium text-orange-700"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== item))}
              className="cursor-pointer border-0 bg-transparent p-0 px-1 text-sm leading-none text-orange-500 hover:text-orange-800"
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? "Type and press Enter" : "Add more"}
          className="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-1 text-sm text-stone-900 outline-none placeholder:text-stone-400"
        />
      </div>
      {available.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-stone-400">Suggestions:</span>
          {available.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => add(item)}
              className="cursor-pointer rounded-full border border-orange-200 bg-white px-2.5 py-0.5 text-xs text-stone-600 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700"
            >
              + {item}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <div className="text-sm font-semibold text-stone-900">{label}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-stone-500">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-0 p-0 transition-colors ${
          checked ? "bg-orange-500" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

const Edit_profile = () => {
  const navigate = useNavigate();
  const photoInput = useRef(null);
  const cvInput = useRef(null);

  const [account, setAccount] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");

  const dirty = Boolean(form && saved) && JSON.stringify(form) !== JSON.stringify(saved);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    let cancelled = false;

    request(navigate, "/me/profile")
      .then((data) => {
        if (cancelled) return;
        const initial = toForm(data.profile);
        setAccount(data.profile);
        setForm(initial);
        setSaved(initial);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const Navbar = account?.is_premium ? StudentNavbarPreminum : StudentNavbar;

  if (!form || !account) {
    return (
      <div className="min-h-screen bg-orange-50">
        <StudentNavbar />
        <p className="py-24 text-center text-stone-500">{loadError || "Loading your profile..."}</p>
      </div>
    );
  }

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const text = (key) => ({
    value: form[key],
    onChange: (e) => setField(key, e.target.value),
  });

  const checks = [
    { label: "Add a profile photo", done: Boolean(account.profile_pic_url) },
    { label: "Write a headline", done: Boolean(form.headline.trim()) },
    { label: "Write a short bio", done: Boolean(form.bio.trim()) },
    { label: "Add your location", done: Boolean(form.country.trim() || form.city.trim()) },
    { label: "Choose your education level", done: Boolean(form.education_level) },
    { label: "Add your university", done: Boolean(form.university.trim()) },
    { label: "Add your skills", done: form.skills.length > 0 },
    { label: "Add your tech stack", done: form.tech_stack.length > 0 },
    {
      label: "Link GitHub, LinkedIn or a portfolio",
      done: Boolean(form.github_url.trim() || form.linkedin_url.trim() || form.portfolio_url.trim()),
    },
    {
      label: "Add a coding profile",
      done: Boolean(
        form.leetcode_username.trim() ||
          form.codeforces_handle.trim() ||
          form.codechef_username.trim() ||
          form.hackerrank_username.trim()
      ),
    },
    { label: "Upload your resume", done: Boolean(account.cv_url) },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const completeness = Math.round((doneCount / checks.length) * 100);
  const missing = checks.filter((c) => !c.done).slice(0, 3);

  const onSave = async (e) => {
    e.preventDefault();
    if (!dirty || saving) return;

    setSaving(true);
    setFieldErrors({});

    try {
      const data = await request(navigate, "/me/profile", { method: "PUT", json: buildPayload(form) });
      const fresh = toForm(data.profile);
      setAccount((current) => ({ ...current, ...data.profile }));
      setForm(fresh);
      setSaved(fresh);
      syncStoredName(data.profile.name);
      setNotice({ type: "ok", text: "Profile updated successfully" });
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length > 0) setFieldErrors(err.fields);
      setNotice({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const onDiscard = () => {
    setForm(saved);
    setFieldErrors({});
  };

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice({ type: "error", text: "Please choose a JPG, PNG or WebP image" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setNotice({ type: "error", text: "The photo must be 2 MB or smaller" });
      return;
    }

    setPhotoBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const data = await request(navigate, "/me/avatar", { method: "POST", body });
      setAccount((current) => ({ ...current, profile_pic_url: data.profile_pic_url }));
      setNotice({ type: "ok", text: "Profile photo updated" });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setPhotoBusy(false);
    }
  };

  const onRemovePhoto = async () => {
    setPhotoBusy(true);
    try {
      await request(navigate, "/me/avatar", { method: "DELETE" });
      setAccount((current) => ({ ...current, profile_pic_url: null }));
      setNotice({ type: "ok", text: "Profile photo removed" });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setPhotoBusy(false);
    }
  };

  const onPickCv = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      setNotice({ type: "error", text: "Your resume must be a PDF file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", text: "The resume must be 5 MB or smaller" });
      return;
    }

    setCvBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const data = await request(navigate, "/me/cv", { method: "POST", body });
      setAccount((current) => ({ ...current, cv_url: data.cv_url }));
      setNotice({ type: "ok", text: "Resume uploaded" });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setCvBusy(false);
    }
  };

  const onRemoveCv = async () => {
    setCvBusy(true);
    try {
      await request(navigate, "/me/cv", { method: "DELETE" });
      setAccount((current) => ({ ...current, cv_url: null }));
      setNotice({ type: "ok", text: "Resume removed" });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setCvBusy(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");

    if (pw.next.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }

    if (pw.next !== pw.confirm) {
      setPwError("The new passwords do not match");
      return;
    }

    setPwBusy(true);
    try {
      await request(navigate, "/me/password", {
        method: "PUT",
        json: { current_password: pw.current, new_password: pw.next },
      });
      setPw({ current: "", next: "", confirm: "" });
      setNotice({ type: "ok", text: "Password updated" });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 text-stone-900 [&_button]:font-[inherit] [&_input]:font-[inherit] [&_select]:font-[inherit] [&_textarea]:font-[inherit]">
      <Navbar />

      {notice && (
        <div
          role="status"
          className={`fixed right-5 top-20 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            notice.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      <main className="mx-auto max-w-[1100px] px-5 pb-28 pt-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link to="/student" className={linkSmall}>
              ← Back to home
            </Link>
            <h1 className="m-0 mt-2 text-2xl font-bold text-stone-900">Edit profile</h1>
            <p className="m-0 mt-1 text-sm text-stone-500">
              Everything here is optional except your name. A complete profile helps companies find you.
            </p>
          </div>
          <Link to={`/student/profile/${account.id}`} className={btnOutline.replace("inline-block", "inline-block no-underline")}>
            View public profile
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-900">Profile strength</span>
                <span className="text-sm font-bold text-orange-600">{completeness}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100">
                <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${completeness}%` }} />
              </div>
              {missing.length > 0 ? (
                <ul className="m-0 mt-3 list-none p-0 text-xs text-stone-500">
                  {missing.map((item) => (
                    <li key={item.label} className="py-0.5">
                      • {item.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 mt-3 text-xs text-emerald-600">Your profile is complete. Great work!</p>
              )}
            </Card>

            <nav className="hidden rounded-2xl border border-orange-100 bg-white p-2 shadow-sm lg:block" aria-label="Sections">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-600 no-underline hover:bg-orange-50 hover:text-orange-700"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-col gap-5">
            <form id="profile-form" onSubmit={onSave} className="flex min-w-0 flex-col gap-5" noValidate>
              <Card id="photo" title="Profile photo" subtitle="JPG, PNG or WebP, up to 2 MB. Saved as soon as you upload it.">
                <div className="flex flex-wrap items-center gap-5">
                  <Avatar name={form.name || account.name} src={account.profile_pic_url} size={96} />
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={photoInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={onPickPhoto}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInput.current?.click()}
                      disabled={photoBusy}
                      className={btnSolid}
                    >
                      {photoBusy ? "Working..." : account.profile_pic_url ? "Change photo" : "Upload photo"}
                    </button>
                    {account.profile_pic_url && (
                      <button type="button" onClick={onRemovePhoto} disabled={photoBusy} className={btnDanger}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </Card>

              <Card id="basic" title="Basic information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Full name" error={fieldErrors.name}>
                    <input {...text("name")} placeholder="Your full name" className={inputClass(fieldErrors.name)} />
                  </Field>
                  <Field label="Email" hint="Your email is used to log in and can't be changed here.">
                    <input
                      value={account.email}
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field
                      label="Headline"
                      hint="A short line shown under your name, like 'CS student | competitive programmer'."
                      error={fieldErrors.headline}
                      counter={`${form.headline.length}/150`}
                    >
                      <input
                        {...text("headline")}
                        maxLength={150}
                        placeholder="What best describes you?"
                        className={inputClass(fieldErrors.headline)}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="About you" error={fieldErrors.bio} counter={`${form.bio.length}/1000`}>
                      <textarea
                        {...text("bio")}
                        maxLength={1000}
                        rows={5}
                        placeholder="Tell other students and companies about your interests, projects and goals."
                        className={`${inputClass(fieldErrors.bio)} resize-y`}
                      />
                    </Field>
                  </div>
                  <Field label="Country" error={fieldErrors.country}>
                    <input {...text("country")} placeholder="e.g. Bangladesh" className={inputClass(fieldErrors.country)} />
                  </Field>
                  <Field label="City" error={fieldErrors.city}>
                    <input {...text("city")} placeholder="e.g. Dhaka" className={inputClass(fieldErrors.city)} />
                  </Field>
                  <Field label="Phone" hint="Only you can see your phone number." error={fieldErrors.phone}>
                    <input {...text("phone")} placeholder="+880 1XXX XXXXXX" className={inputClass(fieldErrors.phone)} />
                  </Field>
                </div>
              </Card>

              <Card id="education" title="Education">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Education level" error={fieldErrors.education_level}>
                    <select
                      value={form.education_level}
                      onChange={(e) => setField("education_level", e.target.value)}
                      className={inputClass(fieldErrors.education_level)}
                    >
                      <option value="">Select your level</option>
                      {EDUCATION_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="University or school" error={fieldErrors.university}>
                    <input
                      {...text("university")}
                      placeholder="e.g. University of Dhaka"
                      className={inputClass(fieldErrors.university)}
                    />
                  </Field>
                  <Field label="Degree" error={fieldErrors.degree}>
                    <input
                      {...text("degree")}
                      placeholder="e.g. B.Sc. in Computer Science"
                      className={inputClass(fieldErrors.degree)}
                    />
                  </Field>
                  <Field label="Graduation year" error={fieldErrors.graduation_year}>
                    <input
                      {...text("graduation_year")}
                      type="number"
                      min="1970"
                      max="2100"
                      placeholder="e.g. 2028"
                      className={inputClass(fieldErrors.graduation_year)}
                    />
                  </Field>
                </div>
              </Card>

              <Card
                id="skills"
                title="Skills and stack"
                subtitle="Press Enter or comma to add an item. Click a suggestion to add it quickly."
              >
                <div className="flex flex-col gap-5">
                  <TagInput
                    label="Tech stack"
                    hint="Frameworks, databases and tools you work with."
                    value={form.tech_stack}
                    onChange={(list) => setField("tech_stack", list)}
                    suggestions={SUGGESTIONS.tech_stack}
                    error={fieldErrors.tech_stack}
                  />
                  <TagInput
                    label="Skills"
                    value={form.skills}
                    onChange={(list) => setField("skills", list)}
                    suggestions={SUGGESTIONS.skills}
                    error={fieldErrors.skills}
                  />
                  <TagInput
                    label="Preferred languages"
                    hint="The programming languages you like to code in."
                    value={form.preferred_languages}
                    onChange={(list) => setField("preferred_languages", list)}
                    suggestions={SUGGESTIONS.preferred_languages}
                    error={fieldErrors.preferred_languages}
                  />
                  <TagInput
                    label="Algorithms and topics"
                    hint="The algorithm topics you practice most."
                    value={form.algorithms}
                    onChange={(list) => setField("algorithms", list)}
                    suggestions={SUGGESTIONS.algorithms}
                    error={fieldErrors.algorithms}
                  />
                </div>
              </Card>

              <Card
                id="links"
                title="Links and coding profiles"
                subtitle="Add the profiles you want others to see. Leave any of them empty."
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="GitHub" error={fieldErrors.github_url}>
                    <input
                      {...text("github_url")}
                      placeholder="https://github.com/username"
                      className={inputClass(fieldErrors.github_url)}
                    />
                  </Field>
                  <Field label="LinkedIn" error={fieldErrors.linkedin_url}>
                    <input
                      {...text("linkedin_url")}
                      placeholder="https://linkedin.com/in/username"
                      className={inputClass(fieldErrors.linkedin_url)}
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Portfolio or website" error={fieldErrors.portfolio_url}>
                      <input
                        {...text("portfolio_url")}
                        placeholder="https://yourname.dev"
                        className={inputClass(fieldErrors.portfolio_url)}
                      />
                    </Field>
                  </div>
                  <Field label="LeetCode" error={fieldErrors.leetcode_username}>
                    <PrefixInput
                      prefix="leetcode.com/u/"
                      placeholder="username"
                      error={fieldErrors.leetcode_username}
                      {...text("leetcode_username")}
                    />
                  </Field>
                  <Field label="Codeforces" error={fieldErrors.codeforces_handle}>
                    <PrefixInput
                      prefix="codeforces.com/profile/"
                      placeholder="handle"
                      error={fieldErrors.codeforces_handle}
                      {...text("codeforces_handle")}
                    />
                  </Field>
                  <Field label="CodeChef" error={fieldErrors.codechef_username}>
                    <PrefixInput
                      prefix="codechef.com/users/"
                      placeholder="username"
                      error={fieldErrors.codechef_username}
                      {...text("codechef_username")}
                    />
                  </Field>
                  <Field label="HackerRank" error={fieldErrors.hackerrank_username}>
                    <PrefixInput
                      prefix="hackerrank.com/profile/"
                      placeholder="username"
                      error={fieldErrors.hackerrank_username}
                      {...text("hackerrank_username")}
                    />
                  </Field>
                </div>
              </Card>

              <Card id="privacy" title="Privacy and job preferences">
                <div className="divide-y divide-orange-100">
                  <Toggle
                    checked={form.open_to_work}
                    onChange={(value) => setField("open_to_work", value)}
                    label="Open to work"
                    description="Show an Open to work badge on your profile so companies know you are looking."
                  />
                  <Toggle
                    checked={form.is_profile_public}
                    onChange={(value) => setField("is_profile_public", value)}
                    label="Public profile"
                    description="Let other students find your profile in search and rankings. Turn it off to hide your profile from everyone else."
                  />
                </div>
              </Card>
            </form>

            <Card id="resume" title="Resume" subtitle="PDF only, up to 5 MB. Companies see this when you apply to their jobs.">
              <input ref={cvInput} type="file" accept="application/pdf" onChange={onPickCv} className="hidden" />
              {account.cv_url ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-600">
                      PDF
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-stone-900">Resume uploaded</div>
                      <a
                        href={assetUrl(account.cv_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkSmall}
                      >
                        View resume
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => cvInput.current?.click()} disabled={cvBusy} className={btnOutline}>
                      {cvBusy ? "Working..." : "Replace"}
                    </button>
                    <button type="button" onClick={onRemoveCv} disabled={cvBusy} className={btnDanger}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => cvInput.current?.click()}
                  disabled={cvBusy}
                  className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 px-4 py-8 text-center hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-sm font-semibold text-orange-600">
                    {cvBusy ? "Uploading..." : "Click to upload your resume"}
                  </span>
                  <span className="text-xs text-stone-500">PDF, up to 5 MB</span>
                </button>
              )}
            </Card>

            <Card id="security" title="Security" subtitle="Choose a new password of at least 8 characters.">
              <form onSubmit={onChangePassword} className="grid grid-cols-1 gap-4 md:grid-cols-2" noValidate>
                <div className="md:col-span-2">
                  <Field label="Current password">
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={pw.current}
                      onChange={(e) => setPw((c) => ({ ...c, current: e.target.value }))}
                      className={inputClass(false)}
                    />
                  </Field>
                </div>
                <Field label="New password">
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pw.next}
                    onChange={(e) => setPw((c) => ({ ...c, next: e.target.value }))}
                    className={inputClass(false)}
                  />
                </Field>
                <Field label="Confirm new password">
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pw.confirm}
                    onChange={(e) => setPw((c) => ({ ...c, confirm: e.target.value }))}
                    className={inputClass(false)}
                  />
                </Field>
                {pwError && <p className="m-0 text-sm text-red-600 md:col-span-2">{pwError}</p>}
                <div className="md:col-span-2">
                  <button type="submit" disabled={pwBusy || !pw.current || !pw.next} className={btnSolid}>
                    {pwBusy ? "Updating..." : "Update password"}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-orange-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-5 py-3">
            <span className="text-sm text-stone-600">You have unsaved changes</span>
            <div className="flex gap-2">
              <button type="button" onClick={onDiscard} disabled={saving} className={btnOutline}>
                Discard
              </button>
              <button type="submit" form="profile-form" disabled={saving} className={btnSolid}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Edit_profile;