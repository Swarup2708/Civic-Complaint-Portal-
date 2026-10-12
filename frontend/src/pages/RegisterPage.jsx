import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import AuthLayout from "../components/AuthLayout";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-800";

  return (
    <AuthLayout title="Create Account" subtitle="Join your city's voice. Register as a citizen.">
      {error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/30">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required className={inputClass} />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required className={inputClass} />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required className={inputClass} />
        <button className="rounded-lg bg-emerald-600 p-3 font-medium text-white hover:bg-emerald-700">
          Register
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Already have an account? <Link to="/login" className="font-medium text-emerald-600">Login</Link>
      </p>
    </AuthLayout>
  );
}