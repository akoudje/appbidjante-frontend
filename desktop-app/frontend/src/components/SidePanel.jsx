// src/components/SidePanel.jsx
import React, { memo, useState } from "react";
import SidebarDynamic from "./SidebarDynamic";
import { useSidebarContext } from "../context/SidebarContext";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

// Hook custom inline
function useLockBodyScroll(lock) {
  React.useEffect(() => {
    if (lock && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [lock]);
}

// Logo du village
const VillageLogo = memo(({ showLabel }) => {
  const [logoError, setLogoError] = useState(false);

  const logoSize = showLabel ? "w-24 h-24" : "w-10 h-10";

  return (
    <div className="flex flex-col items-center justify-center p-4 
      border-b border-gray-200 dark:border-stone-700 
      bg-white ">
      
      {/* Logo simple sans cadre */}
      <div className="flex-shrink-0">
        {logoError ? (
          <div
            className={`${logoSize} rounded-lg flex items-center justify-center`}
          >
            <span className="text-primary-contrast font-bold text-2xl">B</span>
          </div>
        ) : (
          <img
            src="/assets/pdf/logo-bidjante.png"
            alt="Logo Village Bidjante"
            className={`${logoSize} object-contain transition-all duration-300`}
            loading="lazy"
            onError={() => setLogoError(true)}
          />
        )}
      </div>

      {/* Nom du village - texte contrasté */}
      {showLabel && (
        <div className="mt-3 text-center">
          <h1 className="font-bold text-lg text-gray-900 ">
            VILLAGE DE BIDJANTÉ
          </h1>
          <p className="text-lg text-gray-600 ">
            CHEFFERIE TCHAGBA
          </p>
        </div>
      )}
    </div>
  );
});

VillageLogo.displayName = "VillageLogo";

export default function SidePanel() {
  const { open, toggle } = useSidebarContext();
  const [isHovered, setIsHovered] = useState(false);

  const showLabel = open || isHovered;

  useLockBodyScroll(open);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-white/40 backdrop-blur-sm z-30 md:hidden"
          onClick={toggle}
          aria-hidden="true"
        />
      )}

      <aside
        role="navigation"
        aria-label="Panneau latéral de navigation"
        className={`h-screen flex flex-col 
          sidepanel-white
          transition-all duration-300 ease-in-out fixed md:relative top-0 left-0
          ${open ? "w-64 shadow-lg" : "w-20"}
          ${isHovered && !open ? "w-64 shadow-lg" : ""}
          z-40`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <VillageLogo showLabel={showLabel} />

        {/* Bouton toggle */}
        <div className="absolute -right-3 top-20 z-20">
          <button
            onClick={toggle}
            aria-label={open ? "Réduire le menu" : "Développer le menu"}
            aria-expanded={open}
            className="w-6 h-6 rounded-full bg-white dark:bg-stone-800 
              border border-gray-300 dark:border-stone-600 shadow-md 
              flex items-center justify-center hover:bg-gray-100 
              dark:hover:bg-stone-700 transition-colors"
          >
            {open ? (
              <ChevronLeftIcon className="w-4 h-4 text-gray-700 dark:text-red-300" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-700 dark:text-red-300" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
          <SidebarDynamic
            userRole="admin"
            collapsed={!showLabel}
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-stone-700">
          {showLabel ? (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Village Bidjante
            </p>
          ) : (
            <p className="text-center text-[10px] text-gray-400">©</p>
          )}
        </div>
      </aside>
    </>
  );
}