import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, BellOff } from "lucide-react";
import api from "../lib/axios";

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};

export default function NotificationBell() {
  const location = useLocation();
  const box = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const load = () =>
    api
      .get("/notifications")
      .then((res) => setItems(res.data))
      .catch(() => {});

  // Page badalne par list refresh karo aur dropdown band karo
  useEffect(() => {
    load();
    setOpen(false);
  }, [location.pathname]);

  // Bahar click karne par dropdown band
  useEffect(() => {
    const handler = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const toggle = () => {
    if (!open) load();
    setOpen(!open);
  };

  const markRead = async (n) => {
    if (n.read) return;
    setItems((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
    try {
      await api.patch(`/notifications/${n._id}/read`);
    } catch {
      /* ignore */
    }
  };

  const markAll = async () => {
    const pending = items.filter((n) => !n.read);
    setItems((list) => list.map((x) => ({ ...x, read: true })));
    await Promise.all(
      pending.map((n) => api.patch(`/notifications/${n._id}/read`).catch(() => {}))
    );
  };

  return (
    <div className="relative" ref={box}>
      <button
        onClick={toggle}
        className="relative rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-sm text-slate-500">
                <BellOff size={24} />
                No notifications yet
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => markRead(n)}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40 ${
                    n.read ? "" : "bg-emerald-50 dark:bg-emerald-900/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                    <div>
                      <p>{n.message}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}