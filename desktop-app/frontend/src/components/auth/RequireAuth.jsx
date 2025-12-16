// src/components/auth/RequireAuth.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth() {
  const { currentUser, loadingUser } = useAuth();

  // Pendant chargement du /auth/me
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement...
      </div>
    );
  }

  // Utilisateur non connecté → redirection login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Si tout va bien → afficher la route protégée
  return <Outlet />;
}
