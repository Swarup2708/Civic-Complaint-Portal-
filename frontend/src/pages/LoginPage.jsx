import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../lib/axios";
import AuthLayout from "../components/AuthLayout";

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("citizen");
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      const role = res.data.user.role;

      if (tab === "official" && role !== "admin") {
        setError("This is not an official (admin) account");
        return;
      }
      if (tab === "citizen" && role === "admin") {
        setError("Officials, please use the Official tab");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", role);
      navigate(role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const tabClass = (name) =>
    `flex-1 border-b-2 pb-2 text-sm font-medium ${
      tab === name
        ? "border-emerald-600 text-emerald-600"
        : "border-transparent text-slate-500"
    }`;

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-800";

  return (
    <AuthLayout title="Welcome Back!" subtitle="Login to continue and make your city better.">
      <div className="mb-5 flex">
        <button type="button" onClick={() => setTab("citizen")} className={tabClass("citizen")}>Citizen</button>
        <button type="button" onClick={() => setTab("official")} className={tabClass("official")}>Official</button>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/30">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required className={inputClass} />
        <div className="relative">
          <input type={show ? "text" : "password"} name="password" placeholder="Password" value={form.password} onChange={handleChange} required className={inputClass} />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-slate-500">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button className="rounded-lg bg-emerald-600 p-3 font-medium text-white hover:bg-emerald-700">
          Login
        </button>
      </form>

      {tab === "citizen" && (
        <p className="mt-4 text-center text-sm">
          Don't have an account? <Link to="/register" className="font-medium text-emerald-600">Sign Up</Link>
        </p>
      )}
    </AuthLayout>
  );
}