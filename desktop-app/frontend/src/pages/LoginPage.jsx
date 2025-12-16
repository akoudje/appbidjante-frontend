// src/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import { ChartBarIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Récupérer les identifiants sauvegardés
  useEffect(() => {
    const savedUsername = localStorage.getItem("savedUsername");
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    
    if (rememberMe && savedUsername) {
      setForm(prev => ({
        ...prev,
        username: savedUsername,
        rememberMe: true,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(""); // Effacer les erreurs quand l'utilisateur tape
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!form.username.trim()) {
      toast.error("Veuillez saisir votre nom d'utilisateur");
      return;
    }
    
    if (!form.password) {
      toast.error("Veuillez saisir votre mot de passe");
      return;
    }

    setLoading(true);

    try {
      console.log("Tentative de connexion avec:", form.username);
      
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      const data = await response.json();
      console.log("Réponse du serveur:", { status: response.status, data });

      if (!response.ok) {
        // Erreur du serveur
        const errorMsg = data.error || "Identifiants incorrects";
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      // Vérifier la structure de la réponse
      if (!data.token || !data.user) {
        setError("Réponse serveur invalide");
        toast.error("Erreur technique. Veuillez réessayer.");
        setLoading(false);
        return;
      }

      // Connexion réussie
      handleSuccessfulLogin(data);
      
    } catch (err) {
      console.error("Erreur de connexion:", err);
      
      // Différencier les erreurs
      let errorMessage = "Erreur de connexion";
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        errorMessage = "Serveur non disponible. Vérifiez que le backend est démarré.";
      } else {
        errorMessage = err.message || "Erreur inconnue";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = (data) => {
    // Sauvegarder les identifiants si "Se souvenir de moi" est coché
    if (form.rememberMe) {
      localStorage.setItem("savedUsername", form.username);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("savedUsername");
      localStorage.removeItem("rememberMe");
    }

    // Connexion via AuthContext
    login(data.user, data.token);
    
    // Toast de succès avec rôle
    const roleName = getRoleName(data.user.role);
    toast.success(`Connexion réussie ! Bonjour ${data.user.username} (${roleName})`);
    
    // Redirection selon le rôle
    setTimeout(() => {
      navigate("/dashboard");
    }, 500);
  };

  const getRoleName = (role) => {
    const roles = {
      user: "Utilisateur",
      treasurer: "Trésorier",
      admin: "Administrateur",
      superadmin: "Super Administrateur"
    };
    return roles[role] || role;
  };

  const handleForgotPassword = () => {
    toast.info("Fonctionnalité de réinitialisation bientôt disponible");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Left side - Brand/Info */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full lg:w-2/5 space-y-8"
        >
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BuildingLibraryIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Bidjante Manager
                </h1>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  Gestion d'association
                </p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Solution complète de gestion des membres, finances et activités
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Tableaux de bord</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Suivi en temps réel</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <UserCircleIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Gestion des membres</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Fiches détaillées</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Sécurité renforcée</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rôles et permissions</div>
              </div>
            </div>
          </div>

          {/* SuperAdmin Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Super Administrateur</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Identifiant:</span>
                <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  superadmin
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mot de passe:</span>
                <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  admin123
                </code>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              ⚠️ À modifier après la première connexion
            </p>
          </div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-2/5"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Connexion
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Accédez à votre espace personnel
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username - INPUT DIRECT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <UserCircleIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    placeholder="superadmin"
                    value={form.username}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 dark:bg-gray-700 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password - INPUT DIRECT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="admin123"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 dark:bg-gray-700 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                    <ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={form.rememberMe}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Se souvenir de moi
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !form.username.trim() || !form.password}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Connexion...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Auto-fill for testing */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Pour tester rapidement :
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        username: "superadmin",
                        password: "admin123",
                        rememberMe: false,
                      });
                      toast.info("Identifiants SuperAdmin chargés");
                    }}
                    className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    SuperAdmin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        username: "user",
                        password: "user123",
                        rememberMe: false,
                      });
                      toast.info("Identifiants utilisateur chargés");
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Utilisateur
                  </button>
                </div>
              </div>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Premier accès ?{" "}
                <button
                  onClick={() => {
                    setForm({
                      username: "superadmin",
                      password: "admin123",
                      rememberMe: false,
                    });
                    toast.info("Utilisez superadmin / admin123");
                  }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Voir les identifiants
                </button>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                © {new Date().getFullYear()} Bidjante Manager
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Security Badge */}
      <div className="fixed bottom-4 right-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-full">
          <ShieldCheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-700 dark:text-green-400">Connexion sécurisée</span>
        </div>
      </div>
    </div>
  );
}