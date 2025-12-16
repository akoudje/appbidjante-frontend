// frontend/src/pages/Funerailles.jsx

import { useState } from "react";
import {
  HeartIcon,
  CalendarIcon,
  HeartIcon as HeartIconSolid,
  CalendarIcon as CalendarIconSolid,
} from "@heroicons/react/24/outline";

import Deces from "./Deces";
import Enterrements from "./Enterrements";

const TABS_CONFIG = [
  {
    id: "deces",
    label: "Décès",
    icon: HeartIcon,
    activeIcon: HeartIconSolid,
    color: "red",
    gradient: "from-red-500 to-rose-600",
    description: "Enregistrement et suivi des décès",
  },
  {
    id: "enterrements",
    label: "Enterrements",
    icon: CalendarIcon,
    activeIcon: CalendarIconSolid,
    color: "blue",
    gradient: "from-blue-500 to-cyan-600",
    description: "Planification et suivi des enterrements",
  },
];

export default function Funerailles() {
  const [activeTab, setActiveTab] = useState("deces");

  return (
    <div className="space-y-6">
      {/* ONGLETS AMÉLIORÉS */}
      <div className="relative">
        <div className="flex gap-2 pb-2">
          {TABS_CONFIG.map((tab) => {
            const Icon = activeTab === tab.id ? tab.activeIcon : tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-3 px-5 py-3.5 rounded-xl 
                  transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  }`}
              >
                {/* Icône */}
                <div
                  className={`transition-transform duration-200 ${
                    isActive ? "scale-110" : "group-hover:scale-105"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-white" : `text-${tab.color}-600`
                    }`}
                  />
                </div>

                {/* Label */}
                <span className="font-medium text-sm whitespace-nowrap">
                  {tab.label}
                </span>

                {/* Indicateur actif (sous l'onglet) */}
                {isActive && (
                  <div
                    className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 
                    w-12 h-1 bg-gradient-to-r ${tab.gradient} rounded-full`}
                  ></div>
                )}

                {/* Tooltip avec description au survol */}
                {!isActive && (
                  <div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 
    bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible 
    group-hover:opacity-100 group-hover:visible transition-all duration-200 
    whitespace-nowrap z-50 pointer-events-none"
                  >
                    {tab.description}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ZONE DE CONTENU (inchangée) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          {activeTab === "deces" && <Deces />}
          {activeTab === "enterrements" && <Enterrements />}
        </div>
      </div>
    </div>
  );
}
