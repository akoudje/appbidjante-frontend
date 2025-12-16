// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  UserCircleIcon,
  KeyIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  BellIcon,
  GlobeAltIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import {
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const { currentUser, updateProfile, changePassword, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    phone: "",
    avatar: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    darkMode: true,
    language: "fr",
    twoFactorAuth: false,
  });

  // Initialize form with user data
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        username: currentUser.username || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        avatar: currentUser.avatar || "",
      });
      
      // Initialize settings from localStorage or defaults
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    }
  }, [currentUser]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateProfile(profileForm);
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du profil");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      toast.success("Mot de passe changé avec succès");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Erreur lors du changement de mot de passe");
      console.error("Password change error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    toast.success("Paramètres mis à jour");
  };

  const handleLogout = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      try {
        await logout();
        toast.success("Déconnexion réussie");
      } catch (error) {
        toast.error("Erreur lors de la déconnexion");
      }
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm(prev => ({ ...prev, avatar: reader.result }));
      toast.success("Photo de profil mise à jour");
    };
    reader.readAsDataURL(file);
  };

  const getInitials = () => {
    if (currentUser?.username) {
      return currentUser.username
        .split(" ")
        .map(s => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return "SU";
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      user: "bg-green-100 text-green-800",
      editor: "bg-purple-100 text-purple-800",
    };
    return colors[role?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: "Administrateur",
      manager: "Gestionnaire",
      user: "Utilisateur",
      editor: "Éditeur",
    };
    return labels[role?.toLowerCase()] || role;
  };

  const tabs = [
    { id: "profile", label: "Profil", icon: UserCircleIcon },
    { id: "security", label: "Sécurité", icon: ShieldCheckIcon },
    { id: "settings", label: "Paramètres", icon: BellIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mon Profil
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gérez vos informations personnelles et vos paramètres
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Déconnexion
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                    {profileForm.avatar ? (
                      <img
                        src={profileForm.avatar}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials()
                    )}
                  </div>
                  <label className="absolute bottom-2 right-2 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <CameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profileForm.username}
                </h2>
                
                <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(currentUser?.role)}`}>
                  {getRoleLabel(currentUser?.role)}
                </div>
                
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  <p className="flex items-center justify-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Membre depuis {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">42</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Activités</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">7</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Projets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">98%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Succès</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 last:mb-0 transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
              >
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Informations personnelles
                      </h3>
                      <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CheckIcon className="w-4 h-4" />
                        )}
                        Sauvegarder
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <div className="flex items-center gap-2">
                            <UserCircleIcon className="w-4 h-4" />
                            Nom d'utilisateur
                          </div>
                        </label>
                        <input
                          type="text"
                          value={profileForm.username}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, username: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                          placeholder="Votre nom d'utilisateur"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4" />
                            Adresse email
                          </div>
                        </label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, email: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                          placeholder="votre@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4" />
                            Téléphone
                          </div>
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                          placeholder="+33 1 23 45 67 89"
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio / Description
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="Parlez-nous un peu de vous..."
                      />
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Sécurité et authentification
                    </h3>

                    {/* Change Password */}
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <LockClosedIcon className="w-4 h-4" />
                                Mot de passe actuel
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {showCurrentPassword ? (
                                  <EyeSlashIcon className="w-4 h-4" />
                                ) : (
                                  <EyeIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </label>
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="••••••••"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <KeyIcon className="w-4 h-4" />
                                Nouveau mot de passe
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {showPassword ? (
                                  <EyeSlashIcon className="w-4 h-4" />
                                ) : (
                                  <EyeIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="••••••••"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <KeyIcon className="w-4 h-4" />
                                Confirmer le mot de passe
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {showConfirmPassword ? (
                                  <EyeSlashIcon className="w-4 h-4" />
                                ) : (
                                  <EyeIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </label>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <CheckIcon className="w-4 h-4" />
                          )}
                          Changer le mot de passe
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPasswordForm({
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            })
                          }
                          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4 inline mr-2" />
                          Annuler
                        </button>
                      </div>
                    </form>

                    {/* Security Features */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Fonctionnalités de sécurité
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Authentification à deux facteurs
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Ajoutez une couche de sécurité supplémentaire à votre compte
                            </div>
                          </div>
                          <button
                            onClick={() => handleSettingsUpdate('twoFactorAuth', !settings.twoFactorAuth)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Connexions actives
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              2 appareils connectés
                            </div>
                          </div>
                          <button className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Gérer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Paramètres de l'application
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            Notifications par email
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Recevez des notifications par email
                          </div>
                        </div>
                        <button
                          onClick={() => handleSettingsUpdate('emailNotifications', !settings.emailNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            Notifications SMS
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Recevez des notifications par SMS
                          </div>
                        </div>
                        <button
                          onClick={() => handleSettingsUpdate('smsNotifications', !settings.smsNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.smsNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            Mode sombre
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Interface en mode sombre
                          </div>
                        </div>
                        <button
                          onClick={() => handleSettingsUpdate('darkMode', !settings.darkMode)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <label className="block font-medium text-gray-900 dark:text-white mb-2">
                          <div className="flex items-center gap-2">
                            <GlobeAltIcon className="w-4 h-4" />
                            Langue
                          </div>
                        </label>
                        <select
                          value={settings.language}
                          onChange={(e) => handleSettingsUpdate('language', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                        >
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-6 border-t border-red-200 dark:border-red-900">
                      <h4 className="text-lg font-medium text-red-700 dark:text-red-400 mb-4">
                        Zone de danger
                      </h4>
                      
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
                              toast.error("Fonctionnalité non implémentée");
                            }
                          }}
                          className="w-full text-left p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <div className="font-medium">Supprimer mon compte</div>
                          <div className="text-sm mt-1">
                            Supprime définitivement votre compte et toutes vos données
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter de tous les appareils ?")) {
                              toast.success("Déconnexion de tous les appareils effectuée");
                            }
                          }}
                          className="w-full text-left p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                        >
                          <div className="font-medium">Déconnexion de tous les appareils</div>
                          <div className="text-sm mt-1">
                            Déconnecte toutes les sessions actives sur d'autres appareils
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}