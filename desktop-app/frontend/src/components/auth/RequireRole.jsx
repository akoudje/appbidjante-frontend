// src/components/auth/RequireRole.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireRole({ roles, children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;

  // pas connecté → login
  if (!currentUser) return <Navigate to="/login" replace />;

  const userRole = currentUser.role;

  // superadmin = accès total
  if (userRole === "superadmin") return children;

  // règle normale
  if (!roles.includes(userRole)) {
    return (
      <div className="p-4 text-red-500 font-semibold text-center">
        Accès refusé
      </div>
    );
  }

  return children;
}
