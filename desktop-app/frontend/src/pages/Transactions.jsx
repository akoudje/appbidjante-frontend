// frontend/src/pages/Transactions.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { apiGet, apiDelete } from "../utils/api";
import DataTable from "../components/DataTable";
import { toast } from "sonner";
import {
  CurrencyDollarIcon, CalendarIcon, ArrowDownIcon,
  ArrowUpIcon, ChartBarIcon, TrashIcon,
  EyeIcon, ArrowPathIcon, DocumentArrowDownIcon, BanknotesIcon,
  DevicePhoneMobileIcon, CreditCardIcon, DocumentCheckIcon,
  FunnelIcon, XCircleIcon, ArrowTrendingUpIcon, ReceiptRefundIcon,
} from "@heroicons/react/24/solid";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import ExportButton from "../components/filters/ExportButton";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'

  // --- Filtres du tableau ---
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAmountRange, setFilterAmountRange] = useState({ min: "", max: "" });

  // --- Filtres du DASHBOARD ---
  const current = new Date();
  const [kpiYear, setKpiYear] = useState(current.getFullYear());
  const [kpiMonth, setKpiMonth] = useState(current.getMonth() + 1);
  const [showFilters, setShowFilters] = useState(false);

  const [showStats, setShowStats] = useState(false); // ← Par défaut masqué

  // --- Statistiques avancées ---
  const [stats, setStats] = useState({
    monthlyTrend: 0,
    avgTransaction: 0,
    topModes: [],
    monthlyComparison: null,
  });

  /* ---- CHARGEMENT ---- */
  const loadData = useCallback(async () => {
    try {
      const [paiements, categories] = await Promise.all([
        apiGet("/paiements"),
        apiGet("/categories"),
      ]);
      
      // Enrichir les données avec les catégories
      const enrichedData = paiements.map(p => ({
        ...p,
        categorieLabel: p.cotisation?.membre?.categorie?.label || "Non spécifiée"
      }));
      
      setRows(enrichedData);
      setCategoriesList(categories);
      
      return enrichedData;
    } catch (e) {
      console.error("Erreur chargement:", e);
      toast.error("Erreur lors du chargement des transactions");
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---- RAFRAÎCHISSEMENT ---- */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    toast.success("Transactions mises à jour");
  };

  /* ---- SUPPRESSION ---- */
  const handleDelete = async (id) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) return;
    
    try {
      await apiDelete(`/paiements/${id}`);
      setRows(prev => prev.filter(r => r.id !== id));
      toast.success("Transaction supprimée avec succès");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      toast.warning("Aucune transaction sélectionnée");
      return;
    }
    
    if (!confirm(`Supprimer ${selectedRows.length} transaction(s) ?`)) return;
    
    try {
      const promises = selectedRows.map(id => apiDelete(`/paiements/${id}`));
      await Promise.all(promises);
      setRows(prev => prev.filter(r => !selectedRows.includes(r.id)));
      setSelectedRows([]);
      toast.success(`${selectedRows.length} transaction(s) supprimée(s)`);
    } catch (error) {
      console.error("Erreur suppression multiple:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  /* ---- OPTIONS FILTRES ---- */
  const [categoriesList, setCategoriesList] = useState([]);
  
  const yearOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((t) => {
      if (t.date) set.add(new Date(t.date).getFullYear());
    });
    return [...set].sort((a, b) => b - a);
  }, [rows]);

  const monthOptions = useMemo(() => [
    { value: "", label: "Tous les mois" },
    { value: "1", label: "Janvier" },
    { value: "2", label: "Février" },
    { value: "3", label: "Mars" },
    { value: "4", label: "Avril" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juin" },
    { value: "7", label: "Juillet" },
    { value: "8", label: "Août" },
    { value: "9", label: "Septembre" },
    { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" },
    { value: "12", label: "Décembre" },
  ], []);

  const modeOptions = useMemo(() => [
    { value: "", label: "Tous les modes", icon: BanknotesIcon },
    { value: "Espèces", label: "Espèces", icon: BanknotesIcon, color: "bg-green-100 text-green-600" },
    { value: "Mobile Money", label: "Mobile Money", icon: DevicePhoneMobileIcon, color: "bg-purple-100 text-purple-600" },
    { value: "Virement", label: "Virement", icon: CreditCardIcon, color: "bg-blue-100 text-blue-600" },
    { value: "Chèque", label: "Chèque", icon: DocumentCheckIcon, color: "bg-yellow-100 text-yellow-600" },
  ], []);

  const statusOptions = [
    { value: "", label: "Tous les statuts" },
    { value: "validé", label: "Validé", color: "bg-green-100 text-green-800" },
    { value: "annulé", label: "Annulé", color: "bg-red-100 text-red-800" },
    { value: "en attente", label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  ];

  const categoryOptions = useMemo(() => [
    { value: "", label: "Toutes les catégories" },
    ...categoriesList.map(cat => ({ 
      value: cat.id, 
      label: cat.label 
    }))
  ], [categoriesList]);

  /* ---- FILTRAGE DU TABLEAU ---- */
  const filteredRows = useMemo(() => {
    return rows.filter((p) => {
      const searchTerm = search.toLowerCase().trim();

      // Recherche globale
      if (searchTerm) {
        const membre = `${p.cotisation?.membre?.nom || ""} ${
          p.cotisation?.membre?.prenoms || ""
        }`.toLowerCase();

        const motif = p.cotisation?.motif?.toLowerCase() || "";
        const mode = p.mode?.toLowerCase() || "";
        const montant = String(p.montant);
        const reference = p.reference?.toLowerCase() || "";
        const commentaire = p.commentaire?.toLowerCase() || "";

        if (
          !membre.includes(searchTerm) &&
          !motif.includes(searchTerm) &&
          !mode.includes(searchTerm) &&
          !montant.includes(searchTerm) &&
          !reference.includes(searchTerm) &&
          !commentaire.includes(searchTerm)
        ) {
          return false;
        }
      }

      // Filtres spécifiques
      if (filterMode && p.mode !== filterMode) return false;
      if (filterStatus && p.statut !== filterStatus) return false;
      
      if (filterYear) {
        const transactionYear = new Date(p.date).getFullYear();
        if (transactionYear !== Number(filterYear)) return false;
      }
      
      if (filterMonth) {
        const transactionMonth = new Date(p.date).getMonth() + 1;
        if (transactionMonth !== Number(filterMonth)) return false;
      }
      
      if (filterCategory) {
        const categorieId = p.cotisation?.membre?.categorie?.id;
        if (String(categorieId) !== String(filterCategory)) return false;
      }
      
      if (filterAmountRange.min) {
        if (Number(p.montant) < Number(filterAmountRange.min)) return false;
      }
      
      if (filterAmountRange.max) {
        if (Number(p.montant) > Number(filterAmountRange.max)) return false;
      }

      return true;
    });
  }, [rows, search, filterMode, filterYear, filterMonth, filterStatus, filterCategory, filterAmountRange]);

  /* ---- CALCUL DES STATISTIQUES ---- */
  useEffect(() => {
    if (filteredRows.length === 0) return;

    // Tendance mensuelle
    const currentMonth = current.getMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const currentYear = current.getFullYear();
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const currentMonthAmount = filteredRows
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.montant || 0), 0);

    const prevMonthAmount = filteredRows
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevMonthYear;
      })
      .reduce((sum, t) => sum + Number(t.montant || 0), 0);

    const monthlyTrend = prevMonthAmount === 0 ? 100 : 
      ((currentMonthAmount - prevMonthAmount) / prevMonthAmount) * 100;

    // Moyenne des transactions
    const avgTransaction = filteredRows.length > 0 
      ? filteredRows.reduce((sum, t) => sum + Number(t.montant || 0), 0) / filteredRows.length
      : 0;

    // Modes de paiement les plus utilisés
    const modeCounts = {};
    filteredRows.forEach(t => {
      modeCounts[t.mode] = (modeCounts[t.mode] || 0) + 1;
    });
    const topModes = Object.entries(modeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([mode, count]) => ({ mode, count }));

    setStats({
      monthlyTrend,
      avgTransaction,
      topModes,
      monthlyComparison: {
        current: currentMonthAmount,
        previous: prevMonthAmount
      }
    });
  }, [filteredRows, current]);

  /* ---- KPIs ---- */
  const kpiMonthRows = useMemo(() => filteredRows.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getFullYear() === Number(kpiYear) && d.getMonth() + 1 === Number(kpiMonth);
  }), [filteredRows, kpiYear, kpiMonth]);

  const kpiYearRows = useMemo(() => filteredRows.filter((t) => {
    if (!t.date) return false;
    return new Date(t.date).getFullYear() === Number(kpiYear);
  }), [filteredRows, kpiYear]);

  const kpiMetrics = useMemo(() => {
    const montantMois = kpiMonthRows.reduce((s, t) => s + Number(t.montant || 0), 0);
    const montantAnnee = kpiYearRows.reduce((s, t) => s + Number(t.montant || 0), 0);
    const countMois = kpiMonthRows.length;
    const countAnnee = kpiYearRows.length;
    const totalGlobalMontant = filteredRows.reduce((s, t) => s + Number(t.montant || 0), 0);
    const totalGlobalCount = filteredRows.length;
    const partAnnee = totalGlobalMontant ? (montantAnnee / totalGlobalMontant) * 100 : 0;

    return {
      montantMois,
      montantAnnee,
      countMois,
      countAnnee,
      totalGlobalMontant,
      totalGlobalCount,
      partAnnee,
    };
  }, [kpiMonthRows, kpiYearRows, filteredRows]);

  /* ---- EXPORT ---- */
  const exportData = useMemo(() => filteredRows.map((p) => ({
    "ID": p.id,
    "Date": new Date(p.date).toLocaleDateString("fr-FR"),
    "Membre": `${p.cotisation?.membre?.nom || ""} ${p.cotisation?.membre?.prenoms || ""}`,
    "Catégorie": p.cotisation?.membre?.categorie?.label || "—",
    "Motif": p.cotisation?.motif || "—",
    "Montant": p.montant,
    "Mode": p.mode,
    "Référence": p.reference || "—",
    "Statut": p.statut || "—",
    "Commentaire": p.commentaire || "—",
    "Défunt": p.cotisation?.deces 
      ? `${p.cotisation.deces.membre.nom} ${p.cotisation.deces.membre.prenoms}`
      : "—",
  })), [filteredRows]);

  const exportColumns = useMemo(() => [
    { header: "ID", accessorKey: "ID" },
    { header: "Date", accessorKey: "Date" },
    { header: "Membre", accessorKey: "Membre" },
    { header: "Catégorie", accessorKey: "Catégorie" },
    { header: "Motif", accessorKey: "Motif" },
    { header: "Montant", accessorKey: "Montant" },
    { header: "Mode", accessorKey: "Mode" },
    { header: "Référence", accessorKey: "Référence" },
    { header: "Statut", accessorKey: "Statut" },
    { header: "Commentaire", accessorKey: "Commentaire" },
    { header: "Défunt", accessorKey: "Défunt" },
  ], []);

  /* ---- COLUMNS DU TABLEAU ---- */
  const columns = useMemo(
    () => [
      {
        id: "selection",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ),
        size: 40,
      },
      {
        header: "Date",
        accessorKey: "date",
        cell: (info) => {
          const date = new Date(info.getValue());
          return (
            <div className="space-y-1">
              <div className="font-medium">
                {date.toLocaleDateString("fr-FR", { 
                  day: "2-digit", 
                  month: "2-digit", 
                  year: "numeric" 
                })}
              </div>
              <div className="text-xs text-gray-500">
                {date.toLocaleTimeString("fr-FR", { 
                  hour: "2-digit", 
                  minute: "2-digit" 
                })}
              </div>
            </div>
          );
        },
      },
      {
        header: "Membre",
        cell: (info) => {
          const c = info.row.original.cotisation;
          const m = c?.membre;
          return m ? (
            <div className="space-y-1">
              <div className="font-medium">{m.nom} {m.prenoms}</div>
              <div className="text-xs text-gray-500">
                {c?.membre?.categorie?.label || "—"}
              </div>
            </div>
          ) : "—";
        },
      },
      {
        header: "Motif / Détails",
        cell: (info) => {
          const c = info.row.original.cotisation;
          if (!c) return "—";

          if (c.deces) {
            return (
              <div className="space-y-1">
                <div className="text-red-600 font-medium">
                  🕊 Décès : {c.deces.membre.nom} {c.deces.membre.prenoms}
                </div>
                {c.date && (
                  <div className="text-xs text-gray-500">
                    📅 {new Date(c.date).toLocaleDateString("fr-FR")}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <div>
              <div className="font-medium">{c.motif || "—"}</div>
              {info.row.original.commentaire && (
                <div className="text-xs text-gray-500 truncate max-w-xs">
                  {info.row.original.commentaire}
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Montant",
        accessorKey: "montant",
        cell: (info) => {
          const amount = Number(info.getValue());
          return (
            <div className="text-right">
              <div className="font-bold text-gray-900">
                {amount.toLocaleString("fr-FR")} FCFA
              </div>
              {info.row.original.statut === "annulé" && (
                <div className="text-xs text-red-600">Annulé</div>
              )}
            </div>
          );
        },
      },
      {
        header: "Mode",
        accessorKey: "mode",
        cell: (info) => {
          const mode = info.getValue();
          const modeConfig = modeOptions.find(m => m.value === mode);
          
          return (
            <div className="flex items-center gap-2">
              {modeConfig?.icon && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${modeConfig.color || "bg-gray-100"}`}>
                  {React.createElement(modeConfig.icon, { className: "w-4 h-4" })}
                </div>
              )}
              <span className="font-medium">{mode}</span>
            </div>
          );
        },
      },
      {
        header: "Statut",
        accessorKey: "statut",
        cell: (info) => {
          const status = info.getValue() || "validé";
          const statusConfig = statusOptions.find(s => s.value === status);
          
          return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusConfig?.color || "bg-green-100 text-green-800"
            }`}>
              {statusConfig?.label || "Validé"}
            </span>
          );
        },
      },
      {
        header: "Actions",
        cell: (info) => (
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Voir les détails
                console.log("Voir transaction:", info.row.original);
              }}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Voir les détails"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Supprimer"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            {info.row.original.statut !== "annulé" && (
              <button
                onClick={() => {
                  // Annuler la transaction
                  console.log("Annuler transaction:", info.row.original);
                }}
                className="p-1 text-yellow-600 hover:text-yellow-800"
                title="Annuler"
              >
                <ReceiptRefundIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [modeOptions]
  );

  /* ---- RÉINITIALISATION DES FILTRES ---- */
  const resetFilters = () => {
    setSearch("");
    setFilterYear("");
    setFilterMode("");
    setFilterMonth("");
    setFilterStatus("");
    setFilterCategory("");
    setFilterAmountRange({ min: "", max: "" });
    toast.success("Filtres réinitialisés");
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Transactions
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion et visualisation de toutes les transactions
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
          </button>
          
          {/* Bouton afficher/masquer les statistiques */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg 
                     hover:from-amber-600 hover:to-orange-600 transition-all duration-200 
                     flex items-center gap-2 font-medium shadow-sm hover:shadow"
          >
            <ChartBarIcon className="w-4 h-4" />
            {showStats ? "Masquer les statistiques" : "Afficher les statistiques"}
            <span className={`ml-1 transition-transform duration-200 ${showStats ? "rotate-180" : ""}`}>
              <ChevronDownIcon className="w-3 h-3" />
            </span>
          </button>
          
          <ExportButton
            data={exportData}
            columns={exportColumns}
            filename={`transactions_${new Date().toISOString().slice(0, 10)}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Exporter
          </ExportButton>
        </div>
      </div>

      {/* Filtres KPIs */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Période d'analyse :</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div>
                <select
                  value={kpiYear}
                  onChange={(e) => setKpiYear(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={kpiMonth}
                  onChange={(e) => setKpiMonth(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
                >
                  {monthOptions.slice(1).map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FunnelIcon className="w-4 h-4" />
            {showFilters ? "Masquer les filtres" : "Plus de filtres"}
          </button>
        </div>

        {/* Filtres avancés */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-blue-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plage de montant (min)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filterAmountRange.min}
                    onChange={(e) => setFilterAmountRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plage de montant (max)
                  </label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={filterAmountRange.max}
                    onChange={(e) => setFilterAmountRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Réinitialiser tous les filtres
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Statistiques avancées - MASQUABLE */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 font-medium">Tendance mensuelle</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.monthlyTrend > 0 ? "+" : ""}{stats.monthlyTrend.toFixed(1)}%
                    </div>
                  </div>
                  {stats.monthlyTrend >= 0 ? (
                    <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="w-8 h-8 text-red-500" />
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  vs. mois précédent
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 font-medium">Moyenne transaction</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.avgTransaction.toLocaleString()} FCFA
                    </div>
                  </div>
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Montant moyen
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-600 font-medium">Mode principal</div>
                    <div className="text-xl font-bold text-gray-900 truncate">
                      {stats.topModes[0]?.mode || "—"}
                    </div>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-purple-500" />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {stats.topModes[0]?.count || 0} transactions
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-600 font-medium">Comparaison mensuelle</div>
                    <div className="text-xl font-bold text-gray-900">
                      {stats.monthlyComparison ? `${(stats.monthlyComparison.current / 1000000).toFixed(1)}M` : "—"}
                    </div>
                  </div>
                  <CurrencyDollarIcon className="w-8 h-8 text-orange-500" />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  vs. {stats.monthlyComparison?.previous.toLocaleString() || 0} FCFA
                </div>
              </div>
            </div>
      {/* Mini Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="text-sm text-gray-600 font-medium">Montant du mois</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {kpiMetrics.montantMois.toLocaleString()} FCFA
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {kpiMetrics.countMois} transaction(s)
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="text-sm text-gray-600 font-medium">Montant de l'année</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">
            {kpiMetrics.montantAnnee.toLocaleString()} FCFA
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {kpiMetrics.countAnnee} transaction(s)
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="text-sm text-gray-600 font-medium">Total filtré</div>
          <div className="text-2xl font-bold text-green-700 mt-1">
            {kpiMetrics.totalGlobalMontant.toLocaleString()} FCFA
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {kpiMetrics.totalGlobalCount} transactions
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="text-sm text-gray-600 font-medium">Part de l'année</div>
          <div className="text-2xl font-bold text-yellow-700 mt-1">
            {kpiMetrics.partAnnee.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Sur le total filtré
          </div>
        </motion.div>
      </div>

          </motion.div>
        )}
      </AnimatePresence>



      {/* Contenu */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Chargement des transactions...</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FunnelIcon className="w-8 h-8 text-gray-400" />   
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune transaction trouvée
          </h3>
          <p className="text-gray-600 mb-4">
            Essayez de modifier vos critères de recherche
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === "table" ? (
        <>
          <div className="bg-white overflow-hidden">
            <DataTable 
              columns={columns} 
              data={filteredRows}
              onRowSelectionChange={setSelectedRows}
              enableRowSelection
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRows.map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="font-medium text-gray-900">{transaction.cotisation?.membre?.nom} {transaction.cotisation?.membre?.prenoms}</div>
              <div className="text-sm text-gray-500 mt-1">{transaction.montant.toLocaleString()} FCFA</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}