import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";

const copy = {
  Student: { title: "Code Quest", sub: "Continue your coding journey", idLabel: "Email Address", idPh: "name@example.com", btn: "SIGN IN TO QUEST" },
  Company: { title: "Welcome back, Partner", sub: "Manage your tech talent pipeline with ease.", idLabel: "Work Email", idPh: "name@company.com", btn: "Login to Dashboard" },
  Admin: { title: "Code Quest", sub: "Platform Management Portal", idLabel: "Admin ID / Private Code", idPh: "Enter your unique ID", btn: "Secure Login" },
};

export default function Login() {
  const [role, setRole] = useState("Student");
  const c = copy[role];

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: call your login API here
  };

  return (
    <AuthLayout role={role} setRole={setRole}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-2xl text-white shadow-lg">
          {role === "Admin" ? ">_" : "◆"}
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">{c.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{c.sub}</p>
      </div>

      <form onSubmit={onSubmit} className="w-full max-w-md space-y-5 rounded-xl bg-white p-8 shadow-xl">
        <Field label={c.idLabel} placeholder={c.idPh} type={role === "Admin" ? "text" : "email"} />
        <Field
          label="Password"
          type="password"
          placeholder="••••••••"
          right={<a href="#" className="text-xs font-bold text-orange-600">Forgot Password?</a>}
        />
        <button className="w-full rounded-lg bg-orange-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-300/50 hover:bg-orange-700">
          {c.btn}
        </button>

        {role !== "Admin" && (
          <>
            <div className="flex items-center gap-3 text-xs tracking-widest text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> OR CONTINUE WITH <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="rounded-lg border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50">Google</button>
              <button type="button" className="rounded-lg border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50">
                {role === "Company" ? "SSO" : "GitHub"}
              </button>
            </div>
            <p className="text-center text-sm text-slate-500">
              New here? <Link to="/signup" className="font-semibold text-orange-600">Create an account</Link>
            </p>
          </>
        )}
        {role === "Admin" && (
          <p className="text-center text-xs font-semibold text-emerald-700">256-BIT ENCRYPTED CONNECTION</p>
        )}
      </form>
    </AuthLayout>
  );
}