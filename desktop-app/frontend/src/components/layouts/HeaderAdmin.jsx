// HeaderAdmin.jsx
import { useState, useEffect, useRef } from "react";
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../theme/useTheme";

export default function HeaderAdmin({ user, onLogout, onCreateUser }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const dropdownRef = useRef(null);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b dark:border-gray-700/50 shadow-sm">
      
      {/* LEFT: Logo / Titre */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <ShieldCheckIcon className="w-5 h-5 text-white" />
        </div>
        <div className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Administration
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-3">
        
        {/* Thème */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={`Passer au thème ${theme === "dark" ? "clair" : "sombre"}`}
        >
          {theme === "dark" ? (
            <SunIcon className="w-5 h-5 text-yellow-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-gray-700" />
          )}
        </button>

        {/* Séparateur */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Dropdown utilisateur */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-expanded={isDropdownOpen}
            aria-label="Menu utilisateur"
          >
            {/* Avatar avec badge de statut */}
            <div className="relative">
              <img
                src={user?.avatar || "/no-avatar.png"}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                alt={`${user?.nom} ${user?.prenoms}`}
                onError={(e) => {
                  e.target.src = "/no-avatar.png";
                }}
              />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
            </div>

            {/* Nom et flèche */}
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {user?.nom} {user?.prenoms}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </div>
            </div>

            {/* Flèche */}
            <div className="hidden md:block">
              {isDropdownOpen ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
              
              {/* En-tête utilisateur */}
              <div className="px-4 py-3 border-b dark:border-gray-700">
                <div className="font-semibold text-gray-900 dark:text-white truncate">
                  {user?.nom} {user?.prenoms}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-2">
                <MenuItem
                  icon={<UserIcon className="w-5 h-5" />}
                  text="Mon profil"
                  onClick={() => window.location.href = "/profile"}
                />

                <MenuItem
                  icon={<Cog6ToothIcon className="w-5 h-5" />}
                  text="Paramètres"
                  onClick={() => window.location.href = "/settings"}
                />

                {/* Option création utilisateur pour admin */}
                {(user?.role === "admin" || user?.role === "superadmin") && (
                  <MenuItem
                    icon={<PlusCircleIcon className="w-5 h-5" />}
                    text="Créer un utilisateur"
                    onClick={onCreateUser}
                  />
                )}
              </div>

              {/* Séparateur */}
              <div className="border-t dark:border-gray-700 my-1" />

              {/* Déconnexion */}
              <MenuItem
                icon={<ArrowRightOnRectangleIcon className="w-5 h-5" />}
                text="Se déconnecter"
                onClick={onLogout}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon, text, onClick, className = "" }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      onClick={onClick}
    >
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      <span className="flex-1 text-left">{text}</span>
    </button>
  );
}