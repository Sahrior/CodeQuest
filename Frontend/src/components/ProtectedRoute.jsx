import { Navigate } from "react-router-dom";

const HOME = { Student: "/student", Company: "/company", Admin: "/admin" };

export default function ProtectedRoute({ role, children }) {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={HOME[user.role] || "/login"} replace />;
  }

  return children;
}