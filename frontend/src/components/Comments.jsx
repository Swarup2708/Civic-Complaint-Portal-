import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Trash2 } from "lucide-react";
import api from "../lib/axios";

export default function Comments({ complaintId }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get(`/comments/${complaintId}`)
      .then((res) => setComments(res.data))
      .catch(() => {});
  }, [complaintId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await api.post(`/comments/${complaintId}`, { text });
      setComments((list) => [...list, res.data]);
      setText("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not post comment");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments((list) => list.filter((c) => c._id !== id));
    } catch {
      setError("Could not delete comment");
    }
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <MessageSquare size={18} /> Comments ({comments.length})
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-slate-500">No comments yet. Be the first to add an update.</p>
      ) : (
        <ul className="mb-4 space-y-3">
          {comments.map((c) => (
            <li key={c._id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-700/40">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  {c.user?.name || "User"}
                  {c.user?.role === "admin" && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Official
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                  {role === "admin" && (
                    <button onClick={() => remove(c._id)} className="text-red-500" title="Delete comment">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1">{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {token ? (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Add an update, e.g. 'Still not fixed'"
            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-800"
          />
          <button
            disabled={sending}
            className="rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-500">
          <Link to="/login" className="font-medium text-emerald-600">Login</Link> to add a comment.
        </p>
      )}
    </div>
  );
}