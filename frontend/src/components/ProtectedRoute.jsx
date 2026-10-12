import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Login nahi hai to login page pe bhejo
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Admin page hai aur user admin nahi hai to Home pe bhejo
  if (adminOnly && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}