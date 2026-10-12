import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ImagePlus } from "lucide-react";
import api from "../lib/axios";
import { categories } from "../lib/categories";

export default function CreatePage() {
  const [form, setForm] = useState({ title: "", address: "", area: "", description: "" });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    setPhoto(file || null);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("address", form.address);
      data.append("area", form.area);
      data.append("description", form.description);
      if (photo) data.append("photo", photo);

      const res = await api.post("/complaints", data);
      setCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit complaint");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({ title: "", address: "", area: "", description: "" });
    setPhoto(null);
    setPreview("");
    setCreated(null);
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-800";

  // Success screen
  if (created) {
    const cat = categories.find((c) => c.value === created.category) || categories[4];
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
          <h2 className="mt-3 text-xl font-bold">Complaint Submitted</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Category detected: <span className="font-medium">{cat.label}</span>
          </p>

          <div className="mt-4 rounded-lg bg-slate-100 p-3 dark:bg-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-300">Your Tracking ID</p>
            <p className="break-all font-mono text-sm font-semibold">{created._id}</p>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Save this ID. You can use it to track your complaint.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={reset}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-600"
            >
              Report another
            </button>
            <Link
              to={`/track?id=${created._id}`}
              className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
            >
              Track
            </Link>
            <Link
              to="/"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Report a Complaint</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Describe the issue. The category is detected automatically from your description.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g. Streetlight not working"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            rows={2}
            placeholder="House / building, street, landmark (e.g. Near Shiv Mandir, Station Road)"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Area / Locality</label>
          <input
            name="area"
            value={form.area}
            onChange={handleChange}
            required
            placeholder="e.g. Sector 7 or Badlapur East"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Used to group complaints area-wise in the municipal report.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Describe the problem in detail"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Photo (optional)</label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-4 text-sm text-slate-500 hover:border-emerald-600 dark:border-slate-600">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
            ) : (
              <>
                <ImagePlus size={28} />
                Click to upload a photo
              </>
            )}
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
        </div>

        <button
          disabled={loading}
          className="rounded-lg bg-emerald-600 p-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}