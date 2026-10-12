import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../lib/axios";
import { categories } from "../lib/categories";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const palette = ["#059669", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];
const statusColors = { Pending: "#f59e0b", "In Progress": "#3b82f6", Resolved: "#10b981" };
const titleCase = (s) => s.replace(/\b\w/g, (m) => m.toUpperCase());
const catLabel = (name) => categories.find((c) => c.value === name)?.label || name;

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/reports/analytics")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message));
  }, []);

  const dark = document.documentElement.classList.contains("dark");
  const textColor = dark ? "#cbd5e1" : "#334155";
  const gridColor = dark ? "#334155" : "#e2e8f0";

  const barOptions = (horizontal = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
      y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
    },
  });

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { color: textColor } } },
  };

  const card = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800";

  if (error) {
    return <p className="m-8 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30">{error}</p>;
  }
  if (!data) {
    return <p className="m-8 text-slate-500">Loading analytics...</p>;
  }

  const topArea = data.byArea[0];
  const topCategory = data.byCategory[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Which areas and categories get the most complaints.
      </p>

      {/* Insights */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <p className="text-xs text-slate-500">Most complained area</p>
          <p className="mt-1 text-xl font-bold">
            {topArea ? `${titleCase(topArea.name)} (${topArea.count})` : "No data"}
          </p>
        </div>
        <div className={card}>
          <p className="text-xs text-slate-500">Most reported category</p>
          <p className="mt-1 text-xl font-bold">
            {topCategory ? `${catLabel(topCategory.name)} (${topCategory.count})` : "No data"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <h2 className="mb-3 font-semibold">Complaints by Category</h2>
          <div className="h-64">
            <Bar
              options={barOptions()}
              data={{
                labels: data.byCategory.map((x) => catLabel(x.name)),
                datasets: [
                  {
                    data: data.byCategory.map((x) => x.count),
                    backgroundColor: palette,
                    borderRadius: 6,
                  },
                ],
              }}
            />
          </div>
        </div>

        <div className={card}>
          <h2 className="mb-3 font-semibold">Most-Complained Areas</h2>
          <div className="h-64">
            <Bar
              options={barOptions(true)}
              data={{
                labels: data.byArea.map((x) => titleCase(x.name)),
                datasets: [
                  {
                    data: data.byArea.map((x) => x.count),
                    backgroundColor: "#059669",
                    borderRadius: 6,
                  },
                ],
              }}
            />
          </div>
        </div>

        <div className={`${card} lg:col-span-2`}>
          <h2 className="mb-3 font-semibold">Status Overview</h2>
          <div className="mx-auto h-64 max-w-sm">
            <Doughnut
              options={doughnutOptions}
              data={{
                labels: data.byStatus.map((x) => x.name),
                datasets: [
                  {
                    data: data.byStatus.map((x) => x.count),
                    backgroundColor: data.byStatus.map((x) => statusColors[x.name] || "#94a3b8"),
                    borderWidth: 0,
                  },
                ],
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}