import Skyline from "./Skyline";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-[calc(100vh-64px)] md:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          {children}
        </div>
      </div>

      <div className="relative hidden items-center overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-sky-800 p-12 text-white md:flex">
        <Skyline className="absolute inset-x-0 bottom-0 h-1/2 w-full text-emerald-950/30" />
        <p className="relative text-5xl font-bold italic leading-tight">
          Cleaner.<br />Safer.<br />Smarter.<br />Together.
        </p>
      </div>
    </div>
  );
}