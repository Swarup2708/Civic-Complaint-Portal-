import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ImageOff, MapPin, X } from "lucide-react";
import api, { API_ROOT } from "../lib/axios";
import StatusBadge from "../components/StatusBadge";
import { glow } from "../lib/ui";


const img = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;

  return `${API_ROOT}/${p.replace(/\\/g, "/").replace(/^\/+/, "")}`;
};


function Panel({ label, photo, tone, onZoom }) {
  const chip = tone === "after" ? "bg-emerald-600" : "bg-slate-800/80";
  return (
    <div className="relative">
      {photo ? (
        <img
          src={img(photo)}
          alt={label}
          onClick={() => onZoom(img(photo))}
          className="h-44 w-full cursor-zoom-in object-cover sm:h-56"
        />
      ) : (
        <div className="flex h-44 w-full flex-col items-center justify-center gap-2 bg-slate-100 px-2 text-center text-xs text-slate-400 dark:bg-slate-700/50 sm:h-56">
          <ImageOff size={24} />
          {label} photo not uploaded
        </div>
      )}
      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${chip}`}>
        {label}
      </span>
    </div>
  );
}

export default function GalleryPage() {
  const [complaints, setComplaints] = useState([]);
  const [tab, setTab] = useState("pairs");
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState("");

  useEffect(() => {
    api
      .get("/complaints")
      .then((res) => setComplaints(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pairs = useMemo(
    () =>
      complaints
        .filter((c) => c.status === "Resolved" || c.resolutionPhoto)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [complaints]
  );

  const allPhotos = useMemo(
    () =>
      complaints.flatMap((c) =>
        [
          c.photoUrl && { src: c.photoUrl, label: "Reported", complaint: c },
          c.resolutionPhoto && { src: c.resolutionPhoto, label: "Resolved", complaint: c },
        ].filter(Boolean)
      ),
    [complaints]
  );

  const tabClass = (name) =>
    `rounded-full px-4 py-1.5 text-sm font-medium ${
      tab === name
        ? "bg-emerald-600 text-white"
        : "bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300"
    }`;

  const card = `overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ${glow}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Complaint Gallery</h1>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        See how reported issues were fixed: the same complaint's Before and After photos, side by side.
      </p>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("pairs")} className={tabClass("pairs")}>Before &amp; After</button>
        <button onClick={() => setTab("all")} className={tabClass("all")}>All Photos</button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : tab === "pairs" ? (
        pairs.length === 0 ? (
          <p className="text-slate-500">
            No resolved complaints yet. When an admin marks a complaint Resolved with a proof photo, it appears here.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {pairs.map((c) => (
              <div key={c._id} className={card}>
                <div className="relative grid grid-cols-2 gap-0.5">
                  <Panel label="Before" photo={c.photoUrl} tone="before" onZoom={setZoom} />
                  <Panel label="After" photo={c.resolutionPhoto} tone="after" onZoom={setZoom} />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-4 ring-white dark:ring-slate-800">
                    <ArrowRight size={18} />
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-tight">{c.title}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 flex items-start gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin size={12} className="mt-0.5 shrink-0" /> {c.address || c.area}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Fixed by: {c.assignedTo} • Resolved on {new Date(c.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : allPhotos.length === 0 ? (
        <p className="text-slate-500">No photos to show yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allPhotos.map((p, i) => (
            <div key={`${p.complaint._id}-${i}`} className={card}>
              <div className="relative">
                <img
                  src={img(p.src)}
                  alt={p.complaint.title}
                  onClick={() => setZoom(img(p.src))}
                  className="h-44 w-full cursor-zoom-in object-cover"
                />
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${
                    p.label === "Resolved" ? "bg-emerald-600" : "bg-slate-800/80"
                  }`}
                >
                  {p.label}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold leading-tight">{p.complaint.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin size={12} /> {p.complaint.address || p.complaint.area}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {zoom && (
        <div onClick={() => setZoom("")} className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
          <button className="absolute right-4 top-4 text-white" onClick={() => setZoom("")}>
            <X size={28} />
          </button>
          <img src={zoom} alt="Zoomed" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}