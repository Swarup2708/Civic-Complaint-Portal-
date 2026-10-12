import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import api, { API_ROOT } from "../lib/axios";
import StatusBadge from "../components/StatusBadge";
import Comments from "../components/Comments";
import { categories } from "../lib/categories";

const steps = ["Pending", "In Progress", "Resolved"];
const ID_PATTERN = /^[a-f\d]{24}$/i;
const img = (p) => `${API_ROOT}/${p.replace(/\\/g, "/")}`;

export default function TrackPage() {
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("id") || "");
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (value) => {
    const clean = value.trim();
    setComplaint(null);

    if (!clean) {
      setError("Please enter a tracking ID.");
      return;
    }
    if (!ID_PATTERN.test(clean)) {
      setError("Invalid tracking ID. It should be 24 characters (letters and numbers). Copy it from the confirmation screen or Profile → My Complaints.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/complaints/${clean}`);
      setComplaint(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("No complaint found with this tracking ID.");
      } else {
        setError(err.response?.data?.message || err.message || "Could not fetch the complaint.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get("id")) search(params.get("id"));
    // eslint-disable-next-line
  }, []);

  const current = complaint ? steps.indexOf(complaint.status) : -1;
  const cat = complaint ? categories.find((c) => c.value === complaint.category) || categories[4] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Track Your Complaint</h1>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        Enter the tracking ID you received after submitting the complaint.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(id);
        }}
        className="flex gap-2"
      >
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Paste your 24-character tracking ID"
          className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-800"
        />
        <button
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <Search size={18} /> {loading ? "Searching..." : "Track"}
        </button>
      </form>

      {error && (
        <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30">{error}</p>
      )}

      {complaint && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold">{complaint.title}</h2>
            <StatusBadge status={complaint.status} />
          </div>

          <p className="mt-1 flex items-start gap-1 text-sm text-slate-500 dark:text-slate-400">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            <span>
              {complaint.address || complaint.area}
              {complaint.address && <span className="capitalize"> • Area: {complaint.area}</span>}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {cat.label} • Reported on {new Date(complaint.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-3 text-sm">{complaint.description}</p>

          {/* Progress timeline */}
          <div className="my-6 flex items-center">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                      i <= current ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="mt-1 text-xs">{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`mx-2 mb-5 h-1 flex-1 rounded ${
                      i < current ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p><span className="text-slate-500 dark:text-slate-400">Assigned to:</span> {complaint.assignedTo}</p>
            <p><span className="text-slate-500 dark:text-slate-400">Upvotes:</span> {complaint.upvotes}</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {complaint.photoUrl && (
              <div>
                <p className="mb-1 text-xs text-slate-500">Reported photo</p>
                <img src={img(complaint.photoUrl)} alt="Complaint" className="h-40 w-full rounded-lg object-cover" />
              </div>
            )}
            {complaint.resolutionPhoto && (
              <div>
                <p className="mb-1 text-xs text-slate-500">Resolution proof</p>
                <img src={img(complaint.resolutionPhoto)} alt="Resolution" className="h-40 w-full rounded-lg object-cover" />
              </div>
            )}
          </div>

          <Comments complaintId={complaint._id} />
        </div>
      )}
    </div>
  );
}