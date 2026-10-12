import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Building2, Menu, Moon, Sun, X } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setOpen(false);
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium hover:text-emerald-600 ${
      isActive ? "text-emerald-600" : "text-slate-700 dark:text-slate-200"
    }`;

  const close = () => setOpen(false);

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={close}>Home</NavLink>
      <NavLink to="/create" className={linkClass} onClick={close}>Report</NavLink>
      <NavLink to="/track" className={linkClass} onClick={close}>Track</NavLink>
      <NavLink to="/gallery" className={linkClass} onClick={close}>Gallery</NavLink>
      {token && role !== "admin" && (
        <NavLink to="/profile" className={linkClass} onClick={close}>Profile</NavLink>
      )}
      {role === "admin" && (
        <NavLink to="/admin" className={linkClass} onClick={close}>Admin</NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-emerald-700 dark:text-emerald-400">
          <Building2 size={24} /> Civic Complaint Portal
        </Link>

        <nav className="hidden items-center gap-6 md:flex">{links}</nav>

        <div className="flex items-center gap-1">
          {token && role !== "admin" && <NotificationBell />}

          <button
            onClick={() => setDark(!dark)}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {token ? (
            <button onClick={logout} className="ml-1 hidden rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 md:block">
              Logout
            </button>
          ) : (
            <Link to="/login" className="ml-1 hidden rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 md:block">
              Login
            </Link>
          )}

          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 md:hidden" aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 dark:border-slate-700 md:hidden">
          {links}
          {token ? (
            <button onClick={logout} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Logout</button>
          ) : (
            <Link to="/login" onClick={close} className="rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white">Login</Link>
          )}
        </div>
      )}
    </header>
  );
}