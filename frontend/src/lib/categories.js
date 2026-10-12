import { Construction, Lightbulb, Trash2, Droplets, LayoutGrid } from "lucide-react";

export const categories = [
  { label: "Road Issues", value: "Road", icon: Construction, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { label: "Street Lights", value: "Streetlight", icon: Lightbulb, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { label: "Cleanliness", value: "Garbage", icon: Trash2, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { label: "Water Supply", value: "Water", icon: Droplets, color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  { label: "Others", value: "Other", icon: LayoutGrid, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
];