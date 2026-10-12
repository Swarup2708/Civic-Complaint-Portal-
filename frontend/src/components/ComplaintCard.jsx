import { Link } from "react-router-dom";
import { ArrowBigUp, MapPin, MessageSquare } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { categories } from "../lib/categories";
import { API_ROOT } from "../lib/axios";
import { glow } from "../lib/ui";

export default function ComplaintCard({ complaint, onUpvote }) {
  const cat = categories.find((c) => c.value === complaint.category) || categories[4];
  const Icon = cat.icon;
  const photo = complaint.photoUrl ? `${API_ROOT}/${complaint.photoUrl.replace(/\\/g, "/")}` : null;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ${glow}`}
    >
      {photo ? (
        <img src={photo} alt={complaint.title} className="h-40 w-full object-cover" />
      ) : (
        <div className={`flex h-40 items-center justify-center ${cat.color}`}>
          <Icon size={40} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{complaint.title}</h3>
          <StatusBadge status={complaint.status} />
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
          {complaint.description}
        </p>
        <div className="mt-3 flex items-start gap-1 text-xs text-slate-500 dark:text-slate-400">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          <span className="line-clamp-1">{complaint.address || complaint.area}</span>
          <span className="mx-1 shrink-0">•</span>
          <span className="shrink-0">{new Date(complaint.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.color}`}>
            {cat.label}
          </span>
          <button
            onClick={() => onUpvote(complaint._id)}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-emerald-50 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            <ArrowBigUp size={18} /> {complaint.upvotes}
          </button>
        </div>
        <Link
          to={`/track?id=${complaint._id}`}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          <MessageSquare size={14} /> Details &amp; comments
        </Link>
      </div>
    </div>
  );
}