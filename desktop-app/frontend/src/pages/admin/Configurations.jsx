// frontend/src/pages/Funerailles.jsx

import { useEffect, useState } from "react";
import { 
  Cog6ToothIcon,
  Squares2X2Icon,
  UserGroupIcon,
  Cog6ToothIcon as Cog6ToothIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from "@heroicons/react/24/outline";
import { apiGet } from "../../utils/api";
import MenuBuilder from "./MenuBuilder";
import UsersManagementPage from "../UsersManagementPage";
import Settings from "../Settings";

const TABS_CONFIG = [
  {
    id: "settings",
    label: "Paramètres",
    icon: Cog6ToothIcon,
    activeIcon: Cog6ToothIconSolid,
    color: "blue",
    gradient: "from-blue-500 to-cyan-600",
    description: "Configuration générale de l'application",
  },
  {
    id: "menu",
    label: "Gestion du menu",
    icon: Squares2X2Icon,
    activeIcon: Squares2X2IconSolid,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600",
    description: "Personnalisation du menu de navigation",
  },
  {
    id: "users",
    label: "Gestion utilisateurs",
    icon: UserGroupIcon,
    activeIcon: UserGroupIconSolid,
    color: "violet",
    gradient: "from-violet-500 to-purple-600",
    description: "Administration des comptes utilisateurs",
  },
];

export default function Contributions() {
  const [activeTab, setActiveTab] = useState("settings");
  const [dataTree, setDataTree] = useState([]);

  useEffect(() => {
    if (activeTab === "arbre") loadTreeData();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* ONGLETS AMÉLIORÉS */}
      <div className="relative">
        <div className="flex flex-wrap gap-2 pb-2">
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
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : `text-${tab.color}-600`}`} />
                </div>
                
                {/* Label */}
                <span className="font-medium text-sm whitespace-nowrap">{tab.label}</span>
                
                {/* Indicateur actif (sous l'onglet) */}
                {isActive && (
                  <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 
                    w-12 h-1 bg-gradient-to-r ${tab.gradient} rounded-full`}></div>
                )}
                
                {/* Tooltip avec description au survol */}
                {!isActive && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-2 
                    bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible 
                    group-hover:opacity-100 group-hover:visible transition-all duration-200 
                    whitespace-nowrap z-50 pointer-events-none">
                    {tab.description}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu selon onglet */}
      {activeTab === "settings" && <Settings />}
      {activeTab === "users" && <UsersManagementPage />}
      {activeTab === "menu" && <MenuBuilder />}
    </div>
  );
}