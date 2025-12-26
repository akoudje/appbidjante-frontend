// src/pages/Amendes.jsx - VERSION AMÉLIORÉE

import { useEffect, useMemo, useState, useCallback } from "react";
import { apiGet, apiPost, apiDelete } from "@/utils/api";
import { toast } from "sonner";

import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import ExportButton from "@/components/filters/ExportButton";
import FilterBar from "@/components/filters/FilterBar";

import {
  PlusCircleIcon,
  EyeIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChartBarIcon,
  ArrowsUpDownIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

import AmendeForm from "@/components/amendes/AmendeForm";
import DetailsPanel from "@/components/DetailsPanel";
import AmendeDetailPanel from "@/components/amendes/AmendeDetailPanel";
import PaiementAmendeForm from "@/components/amendes/PaiementAmendeForm";

/* =========================
   FILTER CONFIGURATION AMÉLIORÉE
========================= */
const FILTER_CONFIG = {
  search: {
    label: "Recherche",
    type: "search",
    placeholder: "Référence, motif, nom de cible...",
    icon: MagnifyingGlassIcon,
  },
  statut: {
    label: "Statut",
    type: "select",
    options: [
      { value: "", label: "Tous les statuts", color: "gray" },
      { value: "EN_ATTENTE", label: "En attente", color: "orange" },
      { value: "PARTIEL", label: "Partiel", color: "blue" },
      { value: "PAYEE", label: "Payée", color: "green" },
      { value: "TRANSFEREE", label: "Transférée", color: "purple" },
      { value: "IMPAYEE", label: "Impayée", color: "red" },
    ],
    icon: ExclamationTriangleIcon,
  },
  type: {
    label: "Type d'amende",
    type: "select",
    options: [
      { value: "", label: "Tous les types", color: "gray" },
      { value: "PECUNIAIRE", label: "Pécuniaire", color: "blue" },
      { value: "MATERIELLE", label: "Matérielle", color: "amber" },
      { value: "MIXTE", label: "Mixte", color: "purple" },
      { value: "DISCIPLINAIRE", label: "Disciplinaire", color: "red" },
    ],
    icon: ScaleIcon,
  },
  cibleType: {
    label: "Type de cible",
    type: "select",
    options: [
      { value: "", label: "Toutes les cibles", color: "gray" },
      { value: "INDIVIDU", label: "Individu", color: "blue" },
      { value: "LIGNEE", label: "Lignée", color: "green" },
      { value: "CATEGORIE", label: "Catégorie", color: "purple" },
      { value: "GENERATION", label: "Génération", color: "amber" },
    ],
    icon: UsersIcon,
  },
  dateRange: {
    label: "Période",
    type: "dateRange",
    icon: CalendarDaysIcon,
  },
  sort: {
    label: "Trier par",
    type: "select",
    options: [
      { value: "createdAt_desc", label: "Date (plus récent)" },
      { value: "createdAt_asc", label: "Date (plus ancien)" },
      { value: "montant_desc", label: "Montant (plus élevé)" },
      { value: "montant_asc", label: "Montant (plus bas)" },
      { value: "dateLimite_asc", label: "Date limite (proche)" },
      { value: "dateLimite_desc", label: "Date limite (lointaine)" },
    ],
    icon: ArrowsUpDownIcon,
  },
};

// Composant icône de recherche (ajouté)
function MagnifyingGlassIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

// Composant icône utilisateurs (ajouté)
function UsersIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

/* =========================
   COMPONENT
========================= */
export default function Amendes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true); // Nouvel état pour les stats

  // UI States
  const [openForm, setOpenForm] = useState(false);
  const [selectedAmende, setSelectedAmende] = useState(null);
  const [selectedView, setSelectedView] = useState(null);
  const [openPaiement, setOpenPaiement] = useState(false);

  /* =========================
     LOAD DATA
  ========================== */
  const loadData = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          if (key === "dateRange" && value.start && value.end) {
            queryParams.append("dateStart", value.start);
            queryParams.append("dateEnd", value.end);
          } else if (key === "sort") {
            const [field, order] = value.split("_");
            queryParams.append("sortBy", field);
            queryParams.append("sortOrder", order);
          } else if (key !== "dateRange" && key !== "sort") {
            queryParams.append(key, value);
          }
        }
      });

      const url = `/amendes${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await apiGet(url);
      setData(res || []);
    } catch (e) {
      console.error("Erreur chargement amendes:", e);
      toast.error("Erreur lors du chargement des amendes");
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recharger quand les filtres changent
  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  /* =========================
     FILTER HANDLERS
  ========================== */
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    toast.success("Filtres réinitialisés");
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => {
      if (value === null || value === undefined || value === "") return false;
      if (typeof value === "object") {
        return Object.values(value).some((v) => v && v !== "");
      }
      return true;
    });
  }, [filters]);

  /* =========================
     STATS
  ========================== */
  const stats = useMemo(() => {
    const totalMontant = data.reduce((sum, a) => sum + (a.montant || 0), 0);
    const totalPaye = data.reduce((sum, a) => sum + (a.totalPaye || 0), 0);
    const totalRestant = data.reduce((sum, a) => sum + (a.resteAPayer || 0), 0);

    return {
      total: data.length,
      enAttente: data.filter((a) => a.statut === "EN_ATTENTE").length,
      partiel: data.filter((a) => a.statut === "PARTIEL").length,
      payees: data.filter((a) => a.statut === "PAYEE").length,
      transferees: data.filter((a) => a.statut === "TRANSFEREE").length,
      impayees: data.filter((a) => a.statut === "IMPAYEE").length,
      totalMontant,
      totalPaye,
      totalRestant,
      tauxRecouvrement: totalMontant > 0 ? Math.round((totalPaye / totalMontant) * 100) : 0,
    };
  }, [data]);

  /* =========================
     HANDLERS
  ========================== */
  const handleViewAmende = async (amende) => {
    try {
      if (!amende || !amende.id) {
        toast.error("Données d'amende invalides");
        return;
      }

      const detail = await apiGet(`/amendes/${amende.id}`);
      setSelectedView(detail);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement du détail");
    }
  };

  const handleEditAmende = (amende) => {
    setSelectedAmende(amende);
    setOpenForm(true);
  };

  const handleDeleteAmende = async (amende) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'amende ${amende.reference} ? Cette action est irréversible.`)) return;

    try {
      await apiDelete(`/amendes/${amende.id}`);
      toast.success("Amende supprimée avec succès");
      loadData(filters);
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleTransfererAmende = async (amendeId) => {
    if (!confirm("Transférer cette amende à la lignée ? L'individu sera déchargé de cette amende.")) return;

    try {
      await apiPost(`/amendes/${amendeId}/transferer`);
      toast.success("Amende transférée à la lignée avec succès");

      const refreshed = await apiGet(`/amendes/${amendeId}`);
      setSelectedView(refreshed);
      loadData(filters);
    } catch (e) {
      toast.error(e.response?.data?.error || "Erreur lors du transfert");
    }
  };

  /* =========================
     TABLE COLUMNS AMÉLIORÉES
  ========================== */
  const columns = useMemo(
    () => [
      {
        header: "Référence",
        accessorKey: "reference",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded">
              <ScaleIcon className="w-3 h-3 text-gray-600" />
            </div>
            <div className="font-mono text-sm font-semibold text-gray-900">
              {row.original.reference}
            </div>
          </div>
        ),
      },
      {
        id: "type",
        header: "Type",
        accessorKey: "type",
        cell: ({ row }) => {
          const types = {
            PECUNIAIRE: { label: "Pécuniaire", color: "bg-blue-100 text-blue-800 border-blue-200" },
            MATERIELLE: { label: "Matérielle", color: "bg-amber-100 text-amber-800 border-amber-200" },
            MIXTE: { label: "Mixte", color: "bg-purple-100 text-purple-800 border-purple-200" },
            DISCIPLINAIRE: { label: "Disciplinaire", color: "bg-red-100 text-red-800 border-red-200" },
          };

          const typeInfo = types[row.original.type] || {
            label: row.original.type,
            color: "bg-gray-100 text-gray-800 border-gray-200",
          };

          return (
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          );
        },
      },
      {
        header: "Motif",
        id: "motif",
        cell: ({ row }) => {
          const value = row.original.motif || "—";
          return (
            <div className="max-w-xs">
              <div className="truncate text-sm text-gray-900" title={value}>
                {value}
              </div>
              {row.original.description && (
                <div className="text-xs text-gray-500 mt-0.5 truncate" title={row.original.description}>
                  {row.original.description.substring(0, 40)}...
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "cibles",
        header: "Cible(s)",
        cell: ({ row }) => (
          <div className="space-y-1.5">
            {row.original.cibles?.map((c) => {
              const typeConfig = {
                INDIVIDU: { color: "bg-blue-100 text-blue-800", icon: "👤" },
                LIGNEE: { color: "bg-green-100 text-green-800", icon: "👨‍👩‍👧‍👦" },
                CATEGORIE: { color: "bg-purple-100 text-purple-800", icon: "🏷️" },
                GENERATION: { color: "bg-amber-100 text-amber-800", icon: "👥" },
              };

              const config = typeConfig[c.type] || { color: "bg-gray-100 text-gray-800", icon: "?" };
              const label = c.type === "INDIVIDU" 
                ? `${c.cibleNom}${c.ciblePrenom ? ` ${c.ciblePrenom}` : ""}`
                : c.cibleNom || "—";

              return (
                <div key={c.id} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${config.color}`}>
                    <span className="text-xs">{config.icon}</span>
                    <span className="text-xs font-medium">{c.type}</span>
                  </div>
                  <span className="text-sm text-gray-700 truncate max-w-[140px]" title={label}>
                    {label}
                  </span>
                  {c.estTransferee && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded" title="Transférée">
                      ↗
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ),
      },
      {
        header: "Montant",
        accessorKey: "montant",
        cell: ({ row }) => {
          const { montant, totalPaye, resteAPayer } = row.original;

          if (montant === null) {
            return (
              <div className="text-sm text-gray-500 italic">Non applicable</div>
            );
          }

          const pourcentage = totalPaye > 0 ? Math.min(100, (totalPaye / montant) * 100) : 0;

          return (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">
                  {montant.toLocaleString()} FCFA
                </span>
                {totalPaye > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {pourcentage}%
                  </span>
                )}
              </div>

              {totalPaye > 0 && (
                <div className="relative pt-1">
                  <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-gray-200">
                    <div
                      style={{ width: `${pourcentage}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        pourcentage >= 100 ? "bg-green-500" : "bg-blue-500"
                      }`}
                    />
                  </div>
                </div>
              )}

              {resteAPayer > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Reste : </span>
                  {resteAPayer.toLocaleString()} FCFA
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Statut",
        accessorKey: "statut",
        cell: ({ row }) => {
          const statut = row.original.statut;
          const statutConfig = {
            EN_ATTENTE: { label: "En attente", color: "bg-orange-50 text-orange-700 border-orange-200" },
            PARTIEL: { label: "Partiel", color: "bg-blue-50 text-blue-700 border-blue-200" },
            PAYEE: { label: "Payée", color: "bg-green-50 text-green-700 border-green-200" },
            TRANSFEREE: { label: "Transférée", color: "bg-purple-50 text-purple-700 border-purple-200" },
            IMPAYEE: { label: "Impayée", color: "bg-red-50 text-red-700 border-red-200" },
          };

          const config = statutConfig[statut] || { label: statut, color: "bg-gray-50 text-gray-700 border-gray-200" };

          return (
            <div className="flex flex-col gap-1">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}>
                {config.label}
              </span>
              {statut === "PARTIEL" && row.original.resteAPayer > 0 && (
                <div className="text-[10px] text-blue-600 font-medium">
                  {row.original.resteAPayer.toLocaleString()} FCFA restant
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Date limite",
        accessorKey: "dateLimite",
        cell: ({ row }) => {
          const { dateLimite, statut } = row.original;

          if (!dateLimite) {
            return (
              <div className="text-sm text-gray-400 italic">Non définie</div>
            );
          }

          const date = new Date(dateLimite);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const isOverdue = date < today && !["PAYEE", "TRANSFEREE"].includes(statut);
          const isToday = date.toDateString() === today.toDateString();
          const isTomorrow = new Date(date.getTime() - 24 * 60 * 60 * 1000).toDateString() === today.toDateString();

          let statusClass = "text-gray-600";
          let statusText = "";

          if (isOverdue) {
            statusClass = "text-red-600 font-semibold";
            statusText = "Échéance dépassée";
          } else if (isToday) {
            statusClass = "text-amber-600 font-semibold";
            statusText = "Aujourd'hui";
          } else if (isTomorrow) {
            statusClass = "text-amber-600";
            statusText = "Demain";
          }

          return (
            <div className="space-y-1">
              <div className={`text-sm ${statusClass}`}>
                {date.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
              {statusText && (
                <div className={`text-xs ${statusClass}`}>
                  {statusText}
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => {
          const amende = row.original;
          const canEdit = amende.statut === "EN_ATTENTE";
          const canTransfer = amende.statut === "EN_ATTENTE" && amende.cibles?.some((c) => c.type === "INDIVIDU" && !c.estTransferee);
          const canPay = (amende.statut === "EN_ATTENTE" || amende.statut === "PARTIEL") && amende.montant !== null && (amende.resteAPayer > 0 || amende.statut === "EN_ATTENTE");

          return (
            <div className="flex gap-1.5">
              <button
                onClick={() => handleViewAmende(amende)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Voir détails"
              >
                <EyeIcon className="w-4 h-4 text-gray-600" />
              </button>

              {canEdit && (
                <button
                  onClick={() => handleEditAmende(amende)}
                  className="p-1.5 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Modifier"
                >
                  <PencilIcon className="w-4 h-4 text-blue-600" />
                </button>
              )}

              {canPay && (
                <button
                  onClick={() => {
                    setSelectedView(amende);
                    setOpenPaiement(true);
                  }}
                  className="p-1.5 hover:bg-green-50 rounded-lg transition-all duration-200"
                  title="Ajouter paiement"
                >
                  <BanknotesIcon className="w-4 h-4 text-green-600" />
                </button>
              )}

              {canTransfer && (
                <button
                  onClick={() => handleTransfererAmende(amende.id)}
                  className="p-1.5 hover:bg-orange-50 rounded-lg transition-all duration-200"
                  title="Transférer à la lignée"
                >
                  <ArrowPathIcon className="w-4 h-4 text-orange-600" />
                </button>
              )}

              {canEdit && (
                <button
                  onClick={() => handleDeleteAmende(amende)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Supprimer"
                >
                  <TrashIcon className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [handleDeleteAmende, handleTransfererAmende]
  );

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="space-y-6">
      {/* HEADER AMÉLIORÉ */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm">
              <ScaleIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des amendes</h1>
              <p className="text-sm text-gray-600 mt-1">
                {data.length} amende{data.length !== 1 ? "s" : ""} enregistrée
                {data.length !== 1 ? "s" : ""}
                {hasActiveFilters && " (filtrées)"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                showFilters || hasActiveFilters
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span className="font-medium">Filtres</span>
              {hasActiveFilters && (
                <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {Object.keys(filters).filter((k) => filters[k]).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              <ChartBarIcon className="w-4 h-4" />
              <span className="font-medium">
                {showStats ? "Masquer stats" : "Afficher stats"}
              </span>
              {showStats ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>

            <ExportButton
              data={data}
              fileName={`amendes-${new Date().toISOString().split("T")[0]}`}
              className="px-4 py-2.5"
            />

            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
              onClick={() => {
                setSelectedAmende(null);
                setOpenForm(true);
              }}
            >
              <PlusCircleIcon className="w-5 h-5" />
              Nouvelle amende
            </button>
          </div>
        </div>

        {/* FILTER BAR AMÉLIORÉE */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Filtres avancés</h3>
              </div>
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Réinitialiser
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronUpIcon className="w-4 h-4" />
                  Réduire
                </button>
              </div>
            </div>

            <FilterBar
              config={FILTER_CONFIG}
              filters={Object.entries(filters).map(([key, value]) => ({
                id: key,
                value,
              }))}
              onChange={(updatedFiltersArray) => {
                const obj = {};
                updatedFiltersArray.forEach((f) => {
                  obj[f.id] = f.value;
                });
                setFilters(obj);
              }}
              onClear={handleClearFilters}
              compact={false}
            />
          </div>
        )}
      </div>

      {/* MINI DASHBOARD AMÉLIORÉ */}
      {showStats && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tableau de bord</h3>
            </div>
            <div className="text-sm text-gray-500">
              Mise à jour automatique
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4">
            <StatCard
              label="Total"
              value={stats.total}
              icon={ScaleIcon}
              color="gray"
              trend={data.length > 0 ? "↗" : null}
            />
            <StatCard
              label="En attente"
              value={stats.enAttente}
              icon={ExclamationTriangleIcon}
              color="orange"
              sublabel={`${stats.enAttente > 0 ? `${stats.enAttente} à traiter` : "Aucune"}`}
            />
            <StatCard
              label="Partiel"
              value={stats.partiel}
              icon={BanknotesIcon}
              color="blue"
              sublabel="Paiement en cours"
            />
            <StatCard
              label="Payées"
              value={stats.payees}
              icon={BanknotesIcon}
              color="green"
              sublabel={`${stats.total > 0 ? Math.round((stats.payees / stats.total) * 100) : 0}% du total`}
            />
            <StatCard
              label="Transférées"
              value={stats.transferees}
              icon={ArrowPathIcon}
              color="purple"
              sublabel="Vers lignées"
            />
            <StatCard
              label="Impayées"
              value={stats.impayees}
              icon={ExclamationTriangleIcon}
              color="red"
              sublabel="En souffrance"
            />
            <StatCard
              label="Montant total"
              value={`${(stats.totalMontant / 1000).toFixed(0)}k`}
              icon={BanknotesIcon}
              color="indigo"
              sublabel={`${stats.totalMontant.toLocaleString()} FCFA`}
            />
            <StatCard
              label="Encaissé"
              value={`${(stats.totalPaye / 1000).toFixed(0)}k`}
              icon={BanknotesIcon}
              color="emerald"
              sublabel={`${stats.totalPaye.toLocaleString()} FCFA`}
            />
            <StatCard
              label="Taux recouvrement"
              value={`${stats.tauxRecouvrement}%`}
              icon={ChartBarIcon}
              color={stats.tauxRecouvrement >= 80 ? "green" : stats.tauxRecouvrement >= 50 ? "blue" : "orange"}
              sublabel={`${stats.totalRestant.toLocaleString()} FCFA restant`}
            />
          </div>
        </div>
      )}

      {/* ACTIVE FILTERS INDICATOR AMÉLIORÉ */}
      {hasActiveFilters && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FunnelIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-blue-800">Filtres actifs</div>
                <div className="text-sm text-blue-600">
                  {data.length} résultat{data.length !== 1 ? "s" : ""} correspondant{data.length !== 1 ? "s" : ""} aux critères
                </div>
              </div>
            </div>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition"
            >
              <XMarkIcon className="w-4 h-4" />
              Tout effacer
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || (typeof value === "object" && !Object.values(value).some((v) => v)))
                return null;

              let displayValue = "";
              let icon = null;

              if (key === "dateRange" && value.start && value.end) {
                displayValue = `${new Date(value.start).toLocaleDateString("fr-FR")} → ${new Date(value.end).toLocaleDateString("fr-FR")}`;
                icon = <CalendarDaysIcon className="w-3 h-3" />;
              } else if (key === "statut") {
                const option = FILTER_CONFIG.statut.options.find((opt) => opt.value === value);
                displayValue = option?.label || value;
                icon = <ExclamationTriangleIcon className="w-3 h-3" />;
              } else if (key === "type") {
                const option = FILTER_CONFIG.type.options.find((opt) => opt.value === value);
                displayValue = option?.label || value;
                icon = <ScaleIcon className="w-3 h-3" />;
              } else if (key === "cibleType") {
                const option = FILTER_CONFIG.cibleType.options.find((opt) => opt.value === value);
                displayValue = option?.label || value;
                icon = <UsersIcon className="w-3 h-3" />;
              } else if (key === "search") {
                displayValue = `"${value}"`;
                icon = <MagnifyingGlassIcon className="w-3 h-3" />;
              } else if (key === "sort") {
                const option = FILTER_CONFIG.sort.options.find((opt) => opt.value === value);
                displayValue = option?.label || value;
                icon = <ArrowsUpDownIcon className="w-3 h-3" />;
              } else {
                displayValue = String(value);
              }

              if (!displayValue) return null;

              return (
                <div
                  key={key}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg shadow-sm"
                >
                  {icon}
                  <span className="text-xs font-medium text-blue-800">
                    {FILTER_CONFIG[key]?.label || key}:
                  </span>
                  <span className="text-xs text-gray-900">{displayValue}</span>
                  <button
                    onClick={() => handleFilterChange({ ...filters, [key]: "" })}
                    className="text-gray-400 hover:text-red-500 ml-1"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage={
            hasActiveFilters ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FunnelIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune amende ne correspond aux filtres
                </h3>
                <p className="text-gray-600 mb-4">
                  Essayez de modifier vos critères de recherche
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ScaleIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune amende enregistrée
                </h3>
                <p className="text-gray-600 mb-4">
                  Commencez par créer votre première amende
                </p>
                <button
                  onClick={() => {
                    setSelectedAmende(null);
                    setOpenForm(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Créer une amende
                </button>
              </div>
            )
          }
          onRowClick={(row) => handleViewAmende(row.original)}
        />
      </div>

      {/* MODAL FORM */}
      <Modal
        open={openForm}
        title={selectedAmende ? "Modifier l'amende" : "Nouvelle amende"}
        size="2xl"
        onClose={() => {
          setOpenForm(false);
          setSelectedAmende(null);
        }}
      >
        <AmendeForm
          initialData={selectedAmende}
          onSuccess={() => {
            setOpenForm(false);
            setSelectedAmende(null);
            loadData(filters);
          }}
          onCancel={() => {
            setOpenForm(false);
            setSelectedAmende(null);
          }}
        />
      </Modal>

      {/* DETAILS PANEL */}
      <DetailsPanel
        open={!!selectedView}
        onClose={() => setSelectedView(null)}
        title={`Amende ${selectedView?.reference}`}
        subtitle={
          selectedView
            ? `Type : ${formatType(selectedView.type)} — Statut : ${formatStatut(selectedView.statut)}`
            : ""
        }
        width="700px"
        actions={
          selectedView && (
            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Action principale */}
              {(selectedView.statut === "EN_ATTENTE" || selectedView.statut === "PARTIEL") &&
                selectedView.montant !== null &&
                selectedView.resteAPayer > 0 && (
                  <button
                    onClick={() => setOpenPaiement(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-sm"
                  >
                    <BanknotesIcon className="w-4 h-4" />
                    Ajouter un paiement
                  </button>
                )}

              {/* Actions secondaires */}
              <div className="flex gap-2 justify-end flex-wrap">
                {selectedView.statut === "EN_ATTENTE" && (
                  <button
                    onClick={() => handleEditAmende(selectedView)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Modifier
                  </button>
                )}

                {selectedView.statut === "EN_ATTENTE" &&
                  selectedView.cibles?.some((c) => c.type === "INDIVIDU" && !c.estTransferee) && (
                    <button
                      onClick={() => handleTransfererAmende(selectedView.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 transition"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Transférer
                    </button>
                  )}

                {selectedView.statut === "EN_ATTENTE" && (
                  <button
                    onClick={() => handleDeleteAmende(selectedView)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedView && <AmendeDetailPanel amende={selectedView} />}
      </DetailsPanel>

      {/* MODAL PAIEMENT */}
      <Modal
        open={openPaiement}
        title="Ajouter un paiement"
        size="md"
        onClose={() => setOpenPaiement(false)}
      >
        {selectedView && (
          <PaiementAmendeForm
            amendeId={selectedView.id}
            montantMax={
              selectedView.resteAPayer > 0
                ? selectedView.resteAPayer
                : selectedView.montant
            }
            onCancel={() => setOpenPaiement(false)}
            onSuccess={async () => {
              setOpenPaiement(false);
              const refreshed = await apiGet(`/amendes/${selectedView.id}`);
              setSelectedView(refreshed);
              loadData(filters);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

/* =========================
   STAT CARD AMÉLIORÉE
========================= */
function StatCard({ label, value, icon: Icon, color, sublabel, trend }) {
  const colorClasses = {
    gray: "from-gray-50 to-gray-100 border-gray-200 text-gray-800",
    orange: "from-orange-50 to-orange-100 border-orange-200 text-orange-800",
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-800",
    green: "from-green-50 to-green-100 border-green-200 text-green-800",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-800",
    red: "from-red-50 to-red-100 border-red-200 text-red-800",
    indigo: "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-800",
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800",
  };

  const iconColors = {
    gray: "bg-gray-200 text-gray-700",
    orange: "bg-orange-200 text-orange-700",
    blue: "bg-blue-200 text-blue-700",
    green: "bg-green-200 text-green-700",
    purple: "bg-purple-200 text-purple-700",
    red: "bg-red-200 text-red-700",
    indigo: "bg-indigo-200 text-indigo-700",
    emerald: "bg-emerald-200 text-emerald-700",
  };

  return (
    <div className={`bg-gradient-to-br border rounded-xl p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <span className="text-xs font-medium opacity-75">{trend}</span>
            )}
          </div>
          {sublabel && (
            <p className="text-xs opacity-75 mt-1.5">{sublabel}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function formatType(type) {
  const map = {
    PECUNIAIRE: "Pécuniaire",
    MATERIELLE: "Matérielle",
    MIXTE: "Mixte",
    DISCIPLINAIRE: "Disciplinaire",
  };
  return map[type] || type;
}

function formatStatut(statut) {
  const map = {
    EN_ATTENTE: "En attente",
    PARTIEL: "Paiement partiel",
    PAYEE: "Payée",
    TRANSFEREE: "Transférée",
    IMPAYEE: "Impayée",
  };
  return map[statut] || statut;
}