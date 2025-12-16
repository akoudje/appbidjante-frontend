// frontend/src/pages/Contributions.jsx

import { useState } from "react";
import {
  CurrencyDollarIcon,
  CreditCardIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  ArrowPathIcon as ArrowPathIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
} from "@heroicons/react/24/outline";
import Paiements from "./Paiements";
import Transactions from "./Transactions";
import Soldes from "./Soldes";
import Cotisations from "./Cotisations";
import CotisationsLignees from "./CotisationsLignees";

const TABS_CONFIG = [
  {
    id: "paiements",
    label: "Contribution Membre",
    icon: UserGroupIcon,
    activeIcon: UserGroupIconSolid,
    color: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
    description: "Paiements individuels par membre",
  },
  {
    id: "cotisationslignees",
    label: "Contribution Famille",
    icon: BuildingOfficeIcon,
    activeIcon: BuildingOfficeIconSolid,
    color: "amber",
    gradient: "from-amber-500 to-amber-600",
    description: "Contributions par famille/lignée",
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: ArrowPathIcon,
    activeIcon: ArrowPathIconSolid,
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
    description: "Historique complet des transactions",
  },
  {
    id: "cotisations",
    label: "Cotisations",
    icon: CurrencyDollarIcon,
    activeIcon: CurrencyDollarIconSolid,
    color: "violet",
    gradient: "from-violet-500 to-violet-600",
    description: "Gestion des cotisations et échéances",
  },
  {
    id: "soldes",
    label: "Soldes",
    icon: ChartBarIcon,
    activeIcon: ChartBarIconSolid,
    color: "indigo",
    gradient: "from-indigo-500 to-indigo-600",
    description: "Aperçu des soldes par membre",
  },
];

export default function Contributions() {
  const [activeTab, setActiveTab] = useState("paiements");
  const [stats] = useState({
    totalAnnee: "5,240,500",
    totalMois: "648,300",
    impayes: "1,234,750",
  });

  return (
    <div className="space-y-6">
      {/* Header - Inchangé */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>
          <p className="text-sm text-gray-500">
            Gestion des contributions, paiements et transactions
          </p>
        </div>
      </div>

      {/* Onglets améliorés - SEULE PARTIE MODIFIÉE */}
      <div className="relative">
        <div className="flex flex-wrap gap-2 pb-2">
          {TABS_CONFIG.map((tab) => {
            const Icon = activeTab === tab.id ? tab.activeIcon : tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl 
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
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
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

      {/* Zone de contenu - Inchangée */}
      <div className="shadow-sm overflow-hidden">
        {activeTab === "paiements" && <Paiements />}
        {activeTab === "transactions" && <Transactions />}
        {activeTab === "soldes" && <Soldes />}
        {activeTab === "cotisations" && <Cotisations />}
        {activeTab === "cotisationslignees" && <CotisationsLignees />}
      </div>
    </div>
  );
}
