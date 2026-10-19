import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Download, FileText, Pencil, Send, Trash2, X } from "lucide-react";
import api, { API_ROOT } from "../lib/axios";
import StatusBadge from "../components/StatusBadge";
import { categories } from "../lib/categories";

const departments = [
  "Electrician",
  "Water Department",
  "Sanitation Department",
  "Road Maintenance Team",
  "General Administration",
];
const suggested = {
  Streetlight: "Electrician",
  Water: "Water Department",
  Garbage: "Sanitation Department",
  Road: "Road Maintenance Team",
  Other: "General Administration",
};


const img = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;

  return `${API_ROOT}/${p.replace(/\\/g, "/").replace(/^\/+/, "")}`;
};


export default function AdminPage() {
  const [complaints, setComplaints] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ status: "Pending", assignedTo: "", file: null });
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const previewUrl = useMemo(
    () => (form.file ? URL.createObjectURL(form.file) : ""),
    [form.file]
  );

  const loadCounts = () =>
    api.get("/complaints/stats/counts").then((r) => setCounts(r.data)).catch(() => {});

  useEffect(() => {
    loadCounts();
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/complaints", { params: filter ? { status: filter } : {} })
      .then((r) => setComplaints(r.data))
      .catch(() => setError("Could not load complaints"))
      .finally(() => setLoading(false));
  }, [filter]);

  const sorted = useMemo(
    () =>
      [...complaints].sort(
        (a, b) => b.upvotes - a.upvotes || new Date(a.createdAt) - new Date(b.createdAt)
      ),
    [complaints]
  );

  const openEdit = (c) => {
    setEditing(c);
    setModalError("");
    setForm({
      status: c.status,
      assignedTo: c.assignedTo === "Not Assigned" ? suggested[c.category] || departments[0] : c.assignedTo,
      file: null,
    });
  };

  const save = async () => {
    setModalError("");

    if (form.status === "Resolved" && !form.file && !editing.resolutionPhoto) {
      setModalError("Please upload a resolution photo as proof before marking this complaint Resolved.");
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append("status", form.status);
      data.append("assignedTo", form.assignedTo);
      if (form.status === "Resolved" && form.file) data.append("resolutionPhoto", form.file);

      const res = await api.patch(`/complaints/${editing._id}/status`, data);
      setComplaints((list) => list.map((c) => (c._id === editing._id ? res.data : c)));
      setEditing(null);
      loadCounts();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || "Could not update complaint");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this complaint permanently?")) return;
    try {
      await api.delete(`/complaints/${id}`);
      setComplaints((list) => list.filter((c) => c._id !== id));
      loadCounts();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not delete complaint");
    }
  };

  const downloadPdf = async (c) => {
    setError("");
    try {
      const res = await api.get(`/complaints/${c._id}/report`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Complaint-${c._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not download the PDF report");
    }
  };

  const forward = async (c) => {
    setError("");
    setNotice("");
    try {
      const res = await api.post(`/complaints/${c._id}/forward`);
      setNotice(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not forward complaint");
    }
  };

  const generateReport = async () => {
    setReportLoading(true);
    setReport(null);
    setError("");
    setNotice("");
    try {
      const res = await api.get("/reports/consolidated");
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800";
  const field = "w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm dark:border-slate-600 dark:bg-slate-800";
  const iconBtn = "rounded border border-slate-300 p-1.5 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/analytics"
            className="flex items-center gap-2 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
          >
            <Activity size={16} /> Analytics
          </Link>
          <button
            onClick={generateReport}
            disabled={reportLoading}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <FileText size={16} />
            {reportLoading ? "Generating..." : "Generate & Email Consolidated Report"}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30">{error}</p>}
      {notice && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{notice}</p>}

      {/* Counts */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Total", counts.total],
          ["Pending", counts.pending],
          ["In Progress", counts.inProgress],
          ["Resolved", counts.resolved],
        ].map(([label, value]) => (
          <div key={label} className={card}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Report result */}
      {report && (
        <div className={`${card} mb-6`}>
          <p className={`mb-3 text-sm font-medium ${report.emailSent ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600"}`}>
            {report.message}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="p-2">Area</th><th className="p-2">Category</th><th className="p-2">Total</th>
                  <th className="p-2">Pending</th><th className="p-2">In Progress</th><th className="p-2">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {report.summary.map((r, i) => (
                  <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2 capitalize">{r._id.area}</td>
                    <td className="p-2">{r._id.category}</td>
                    <td className="p-2">{r.count}</td>
                    <td className="p-2">{r.pending}</td>
                    <td className="p-2">{r.inProgress}</td>
                    <td className="p-2">{r.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complaints table */}
      <div className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Complaints</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${field} !w-auto`}>
            <option value="">All status</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : sorted.length === 0 ? (
          <p className="text-slate-500">No complaints found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="p-2">Photo</th><th className="p-2">Complaint</th><th className="p-2">Category</th>
                  <th className="p-2">Upvotes</th><th className="p-2">Status</th><th className="p-2">Assigned To</th>
                  <th className="p-2">Proof</th><th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c._id} className="border-t border-slate-200 align-top dark:border-slate-700">
                    <td className="p-2">
                      {c.photoUrl ? (
                        <img src={img(c.photoUrl)} alt="" className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-slate-200 dark:bg-slate-700" />
                      )}
                    </td>
                    <td className="p-2">
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-slate-500">{c.address || "-"}</p>
                      <p className="text-xs capitalize text-slate-400">Area: {c.area}</p>
                    </td>
                    <td className="p-2">{(categories.find((x) => x.value === c.category) || categories[4]).label}</td>
                    <td className="p-2">{c.upvotes}</td>
                    <td className="p-2"><StatusBadge status={c.status} /></td>
                    <td className="p-2">{c.assignedTo}</td>
                    <td className="p-2">
                      {c.resolutionPhoto ? (
                        <img src={img(c.resolutionPhoto)} alt="Proof" className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(c)} className={iconBtn} title="Update status / assign">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => downloadPdf(c)} className={iconBtn} title="Download PDF report">
                          <Download size={14} />
                        </button>
                        <button onClick={() => forward(c)} className={iconBtn} title="Email to municipal office">
                          <Send size={14} />
                        </button>
                        <button onClick={() => remove(c._id)} className="rounded border border-red-300 p-1.5 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-800">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Update Complaint</h3>
                <p className="text-xs text-slate-500">{editing.title}</p>
              </div>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>

            {modalError && (
              <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/30">{modalError}</p>
            )}

            <label className="mb-1 block text-sm font-medium">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`${field} mb-3`}>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>

            <label className="mb-1 block text-sm font-medium">Assign to department</label>
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className={`${field} mb-3`}>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>

            {form.status === "Resolved" && (
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Resolution photo (proof) <span className="text-red-500">*</span>
                </label>

                {editing.resolutionPhoto && !form.file && (
                  <img src={img(editing.resolutionPhoto)} alt="Existing proof" className="mb-2 h-24 rounded-lg object-cover" />
                )}
                {previewUrl && (
                  <img src={previewUrl} alt="Selected proof" className="mb-2 h-24 rounded-lg object-cover" />
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, file: e.target.files[0] || null })}
                  className="text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {editing.resolutionPhoto
                    ? "Proof already uploaded. Choose a file only to replace it."
                    : "Upload an 'after' photo showing the issue is fixed."}
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600">Cancel</button>
              <button onClick={save} disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}