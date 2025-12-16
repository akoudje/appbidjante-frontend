// src/components/layout/HeaderAdmin.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/useTheme";
import { useSidebarContext } from "../context/SidebarContext";
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  LifebuoyIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  SunIcon as SunIconSolid,
  MoonIcon as MoonIconSolid,
} from "@heroicons/react/24/solid";

const HeaderAdmin = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { open: sidebarOpen, toggle: toggleSidebar } = useSidebarContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Notifications factices pour la démonstration
  const notifications = [
    { id: 1, text: "Nouveau paiement reçu", time: "5 min", read: false },
    { id: 2, text: "3 membres ajoutés", time: "1h", read: false },
    { id: 3, text: "Rapport mensuel disponible", time: "2h", read: true },
  ];

  const userMenuItems = [
    {
      label: "Mon Profil",
      icon: UserCircleIcon,
      path: "/profile",
      description: "Gérer votre compte",
    },
    {
      label: "Paramètres",
      icon: Cog6ToothIcon,
      path: "/admin/configurations",
      description: "Personnaliser l'application",
    },
    {
      label: "Aide & Support",
      icon: LifebuoyIcon,
      path: "/help",
      description: "Centre d'aide et support",
    },
  ];

  // Fermer les menus en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = currentUser?.username?.slice(0, 2).toUpperCase() || "AD";
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <header className="header-white sticky top-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* PARTIE GAUCHE */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-stone-800 
                md:hidden transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? (
                <XMarkIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Bars3Icon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Titre */}
            <div className="ml-4 hidden md:block">
              <h1 className="text-xl font-semibold text-gray-900">
                APPLICATION DE GESTION DES CONTRIBUTION FINANCIERE DE BIDJANTE
              </h1>
              <p className="text-xs text-gray-600">
                Bienvenue, {currentUser?.username || "Administrateur"}
              </p>
            </div>
          </div>

          {/* PARTIE DROITE */}
          <div className="flex items-center gap-2">
            {/* Bouton notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-stone-800 
                  relative transition-colors duration-200"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                {unreadNotifications > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 
                    text-white text-xs rounded-full flex items-center justify-center 
                    animate-pulse shadow-sm"
                  >
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Dropdown notifications - AMÉLIORÉ */}
              {isNotificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 dropdown-contrast 
                  rounded-lg shadow-xl z-50 animate-slideDown"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-stone-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {unreadNotifications} non lues
                      </span>
                    </div>
                  </div>
                  {/* ... reste du dropdown ... */}
                </div>
              )}
            </div>

            {/* Toggle thème - SIMPLIFIÉ */}
            <div className="relative">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-stone-800 
                  transition-colors duration-200"
                aria-label={`Basculer en mode ${
                  theme === "light" ? "sombre" : "clair"
                }`}
              >
                {theme === "light" ? (
                  <MoonIcon className="h-5 w-5 text-gray-700" />
                ) : (
                  <SunIcon className="h-5 w-5 text-gray-300" />
                )}
              </button>
            </div>

            {/* Menu utilisateur - AMÉLIORÉ */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="group flex items-center gap-3 p-2 rounded-lg 
                  hover:bg-gray-100 dark:hover:bg-stone-800 
                  transition-all duration-200"
              >
                {/* Avatar simple */}
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-full bg-gradient-to-br 
                    from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500 
                    flex items-center justify-center text-white font-semibold 
                    shadow-sm"
                  >
                    {userInitials}
                  </div>
                  {/* Statut en ligne */}
                  <div
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 
                    rounded-full border-2 border-white dark:border-stone-900"
                  ></div>
                </div>

                {/* Informations utilisateur */}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                    {currentUser?.username || "Administrateur"}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-tight">
                    {currentUser?.role || "Admin"}
                  </p>
                </div>

                {/* Flèche */}
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-600 dark:text-gray-400 
                    transition-transform duration-200 ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* DROPDOWN UTILISATEUR - AMÉLIORÉ ET PLUS VISIBLE */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 
    border border-gray-200 dark:border-stone-700 rounded-lg shadow-xl z-50 
    animate-slideDown"
                >
                  {/* Header du dropdown */}
                  <div className="p-5 border-b border-gray-200 dark:border-stone-700">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-full bg-gradient-to-br 
            from-amber-600 to-orange-600 flex items-center justify-center 
            text-white font-bold text-lg"
                        >
                          {userInitials}
                        </div>
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 
            rounded-full border-2 border-white dark:border-stone-900"
                        ></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-base truncate">
                          {currentUser?.username}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {currentUser?.email}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className="inline-flex items-center px-2 py-0.5 
              rounded text-xs font-medium bg-amber-100 text-amber-800 
              dark:bg-amber-900 dark:text-amber-200"
                          >
                            {currentUser?.role}
                          </span>
                          <span
                            className="flex items-center gap-1 text-xs text-gray-500 
              dark:text-gray-400"
                          >
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            En ligne
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items du menu - CORRECTION ICI */}
                  <div className="py-2">
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            navigate(item.path);
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 
              hover:bg-gray-50 dark:hover:bg-stone-800 
              transition-colors duration-150 border-b 
              border-gray-100 dark:border-stone-700 last:border-0"
                        >
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-stone-800">
                            <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                          </div>
                          <div className="flex-1 text-left">
                            {/* TITRE BIEN VISIBLE */}
                            <p className="font-semibold text-orange-900 dark:text-white text-sm">
                              {item.label}
                            </p>
                            {/* DESCRIPTION */}
                            <p className="text-xs text-orange-600 dark:text-gray-400 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Déconnexion */}
                  <div className="p-4 border-t border-gray-200 dark:border-stone-700">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 
          text-sm font-medium text-red-600 dark:text-red-400 
          hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderAdmin;
