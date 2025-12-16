// frontend/src/pages/VillageGroups.jsx

import { useState } from "react";
import { FolderIcon, UsersIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import Categories from "./Categories";
import Familles from "./Familles";

const TABS_CONFIG = [
  {
    id: "categories",
    label: "Générations et catégories",
    icon: <FolderIcon className="w-4 h-4" />,
    description: "Gérez les catégories d'âge et générations",
  },
  {
    id: "familles",
    label: "Familles et lignées",
    icon: <UsersIcon className="w-4 h-4" />,
    description: "Gérez les familles et leurs lignées",
  },
];

export default function VillageGroups() {
  const [activeTab, setActiveTab] = useState("categories");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Header avec recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groupes Villageois</h1>
          <p className="text-sm text-gray-500">
            Gestion des structures familiales et générationnelles
          </p>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher une famille, lignée..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Familles actives</p>
              <p className="text-2xl font-bold text-blue-900">24</p>
            </div>
            <UsersIcon className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Lignées</p>
              <p className="text-2xl font-bold text-emerald-900">142</p>
            </div>
            <ChartBarIcon className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Générations</p>
              <p className="text-2xl font-bold text-amber-900">8</p>
            </div>
            <FolderIcon className="w-10 h-10 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Onglets améliorés */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {TABS_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-lg border-b-2 transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zone de contenu */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {TABS_CONFIG.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-500">
                {TABS_CONFIG.find(t => t.id === activeTab)?.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter
              </button>
              
              <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exporter
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === "categories" && <Categories searchTerm={searchTerm} />}
          {activeTab === "familles" && <Familles searchTerm={searchTerm} />}
        </div>
      </div>
    </div>
  );
}

