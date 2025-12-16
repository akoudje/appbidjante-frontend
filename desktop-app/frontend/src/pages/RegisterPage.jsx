import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function RegisterPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.username.length < 3) {
      toast.error("Le nom d'utilisateur doit contenir au moins 3 caractères.");
      return;
    }
    if (form.password.length < 4) {
      toast.error("Le mot de passe est trop court.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la création.");
      } else {
        toast.success("Utilisateur créé avec succès.");
        setForm({ username: "", password: "", role: "user" });
      }
    } catch (error) {
      toast.error("Erreur serveur, réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  if (currentUser?.role !== "superadmin") {
    return (
      <div className="p-10 text-center text-red-600 font-bold text-xl">
        Accès réservé au superadmin.
      </div>
    );
  }

  return (
    <div className="flex justify-center mt-10 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl border dark:border-gray-700 p-8 rounded-xl">

        <h2 className="text-3xl font-bold text-center mb-6 dark:text-white">
          Créer un utilisateur
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Username */}
          <div>
            <label className="font-medium block mb-1 dark:text-gray-200">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="ex: jean.dupont"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="font-medium block mb-1 dark:text-gray-200">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="font-medium block mb-1 dark:text-gray-200">
              Rôle
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Création..." : "Créer l'utilisateur"}
          </button>
        </form>
      </div>
    </div>
  );
}
