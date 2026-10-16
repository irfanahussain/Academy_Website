import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function RequireAuth({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <p className="state-message" style={{ padding: "3rem 1.5rem" }}>Loading…</p>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
