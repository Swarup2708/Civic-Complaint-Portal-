import { useEffect, useState } from "react";
import { Bell, User } from "lucide-react";
import api from "../lib/axios";
import StatusBadge from "../components/StatusBadge";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/auth/profile").then((r) => setUser(r.data)).catch(() => {});
    api.get("/complaints/my-complaints").then((r) => setComplaints(r.data)).catch(() => {});
    api.get("/notifications").then((r) => setNotifications(r.data)).catch(() => {});
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {
      /* ignore */
    }
  };

  const card = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* User info */}
      <div className={`${card} flex items-center gap-4`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <User size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold">{user?.name || "..."}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role}</p>
        </div>
      </div>

      {/* Notifications */}
      <div className={card}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Bell size={18} /> Notifications
        </h2>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`flex items-start justify-between gap-3 rounded-lg p-3 text-sm ${
                  n.read ? "bg-slate-50 dark:bg-slate-700/40" : "bg-emerald-50 dark:bg-emerald-900/30"
                }`}
              >
                <div>
                  <p>{n.message}</p>
                  <p className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n._id)} className="shrink-0 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* My complaints */}
      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold">My Complaints ({complaints.length})</h2>
        {complaints.length === 0 ? (
          <p className="text-sm text-slate-500">You haven't reported any complaints yet.</p>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c._id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{c.title}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  {c.area} • {c.category} • Assigned: {c.assignedTo} • {c.upvotes} upvotes
                </p>
                <p className="mt-1 break-all font-mono text-xs text-slate-400">ID: {c._id}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}