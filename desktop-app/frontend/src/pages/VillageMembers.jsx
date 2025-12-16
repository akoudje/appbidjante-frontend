// frontend/src/pages/VillageMembers.jsx

import { useEffect, useState } from "react";
import { 
  UserGroupIcon,
  TagIcon,
  HomeIcon,
  ArchiveBoxIcon,
  UserGroupIcon as UserGroupIconSolid,
  TagIcon as TagIconSolid,
  HomeIcon as HomeIconSolid,
  ArchiveBoxIcon as ArchiveBoxIconSolid,
} from "@heroicons/react/24/outline";
import { apiGet } from "../utils/api";
import Membres from "./Membres";
import Categories from "./Categories";
import Familles from "./Familles";
import Archives from "./Archives";

const TABS_CONFIG = [
  {
    id: "membres",
    label: "Membres du village",
    icon: UserGroupIcon,
    activeIcon: UserGroupIconSolid,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600",
    description: "Liste complète des membres vivants",
  },
  {
    id: "categories",
    label: "Catégories",
    icon: TagIcon,
    activeIcon: TagIconSolid,
    color: "blue",
    gradient: "from-blue-500 to-cyan-600",
    description: "Générations et catégories d'âge",
  },
  {
    id: "familles",
    label: "Familles",
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
    color: "amber",
    gradient: "from-amber-500 to-orange-600",
    description: "Familles et lignées du village",
  },
  {
    id: "archives",
    label: "Défunts",
    icon: ArchiveBoxIcon,
    activeIcon: ArchiveBoxIconSolid,
    color: "gray",
    gradient: "from-gray-500 to-slate-600",
    description: "Liste des membres décédés",
  },
];

export default function VillageMembers() {
  const [activeTab, setActiveTab] = useState("membres");
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
  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 
    bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible 
    group-hover:opacity-100 group-hover:visible transition-all duration-200 
    whitespace-nowrap z-50 pointer-events-none">
    {tab.description}
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
  </div>
)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu selon onglet */}
      {activeTab === "membres" && <Membres />}
      {activeTab === "categories" && <Categories />}
      {activeTab === "familles" && <Familles />}
      {activeTab === "archives" && <Archives />}
    </div>
  );
}