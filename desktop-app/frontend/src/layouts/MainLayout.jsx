// src/layouts/MainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import HeaderAdmin from "../components/HeaderAdmin";
import SidePanel from "../components/SidePanel";
import { useSidebarContext } from "../context/SidebarContext";
import { useTheme } from "../theme/useTheme";

export default function MainLayout() {
  const { open } = useSidebarContext();
  const { theme } = useTheme();

  return (
    <div className={`${theme === "dark" ? "dark" : ""} h-screen overflow-hidden flex`}>
      {/* SIDE PANEL avec LOGO - Toujours visible */}
      <div className={`flex-shrink-0 h-screen ${open ? "w-64" : "w-20"} transition-all duration-300`}>
        <SidePanel />
      </div>

      {/* CONTENU PRINCIPAL + HEADER ADMIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER ADMIN - À L'INTÉRIEUR du contenu principal */}
        <div className="flex-shrink-0">
          <HeaderAdmin />
        </div>
        
        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 h-full">
    
              <Outlet />

          </div>
        </main>
      </div>
    </div>
  );
}