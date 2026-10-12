import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, Loader, Search } from "lucide-react";
import api from "../lib/axios";
import Skyline from "../components/Skyline";
import ComplaintCard from "../components/ComplaintCard";
import { categories } from "../lib/categories";
import { glow } from "../lib/ui";

export default function HomePage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [complaints, setComplaints] = useState([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api.get("/complaints/stats/counts").then((res) => setCounts(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (category) params.category = category;
    if (status) params.status = status;
    setLoading(true);
    api
      .get("/complaints", { params })
      .then((res) => setComplaints(res.data))
      .catch(() => setNotice("Could not load complaints. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [category, status]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q) ||
          (c.address || "").toLowerCase().includes(q)
      )
      .sort((a, b) => b.upvotes - a.upvotes || new Date(a.createdAt) - new Date(b.createdAt));
  }, [complaints, search]);

  const handleUpvote = async (id) => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    try {
      const res = await api.patch(`/complaints/${id}/upvote`);
      setComplaints((list) => list.map((c) => (c._id === id ? { ...c, upvotes: res.data.upvotes } : c)));
      setNotice("");
    } catch (err) {
      setNotice(err.response?.data?.message || "Could not upvote");
    }
  };

  const stats = [
    { label: "Total Complaints", value: counts.total, icon: ClipboardList, color: "text-slate-700 dark:text-slate-200" },
    { label: "Pending", value: counts.pending, icon: Clock3, color: "text-amber-600" },
    { label: "In Progress", value: counts.inProgress, icon: Loader, color: "text-blue-600" },
    { label: "Resolved", value: counts.resolved, icon: CheckCircle2, color: "text-emerald-600" },
  ];

  const selectClass =
    "rounded-lg border border-slate-300 bg-white p-2.5 text-sm dark:border-slate-600 dark:bg-slate-800";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-sky-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Skyline className="absolute inset-x-0 bottom-0 h-3/4 w-full text-emerald-900/10 dark:text-emerald-400/10" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-xs font-semibold tracking-widest text-emerald-700 dark:text-emerald-400">
            CLEANER CITIES • BRIGHTER TOMORROWS
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-extrabold leading-tight md:text-6xl">
            Your Voice For a <span className="text-emerald-600">Better City</span>
          </h1>
          <p className="mt-4 max-w-md text-slate-600 dark:text-slate-300">
            Report civic issues, track progress, and be a part of a cleaner, safer and smarter city.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/create" className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-700">
              Report a Complaint <ArrowRight size={18} />
            </Link>
            <Link to="/track" className="rounded-lg border border-emerald-600 px-5 py-3 font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800">
              Track Complaint
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative mx-auto -mt-8 max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${glow}`}
            >
              <Icon className={color} size={24} />
              <p className="mt-2 text-2xl font-bold">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-xl font-bold">Report Issues in Your Area</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Pick a category to see its complaints</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categories.map(({ label, value, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => setCategory(category === value ? "" : value)}
              className={`flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-sm font-medium dark:bg-slate-800 ${glow} ${
                category === value
                  ? "border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-800"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <span className={`rounded-lg p-3 ${color}`}><Icon size={26} /></span>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Complaints */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Recent Complaints</h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or address"
                className={`${selectClass} pl-9`}
              />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
              <option value="">All status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>
        </div>

        {notice && <p className="mb-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">{notice}</p>}

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : visible.length === 0 ? (
          <p className="text-slate-500">No complaints found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <ComplaintCard key={c._id} complaint={c} onUpvote={handleUpvote} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}