// frontend/src/pages/Archives.jsx

import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import DetailsPanel from "../components/DetailsPanel";
import StatsCard from "../components/StatsCard";
import QuickActions from "../components/QuickActions";
import Modal from "../components/Modal";
import { apiGet, apiPost, apiDelete } from "../utils/api";

import {
  ArchiveBoxIcon,
  HeartIcon,
  CalendarIcon,
  ChartBarIcon,
  FunnelIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  UsersIcon,
  ClockIcon,
  UserMinusIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import {
  ChevronRightIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import ExportButton from "../components/filters/ExportButton";
import StatusBadge from "../components/StatusBadge";

export default function Archives() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openRestoreModal, setOpenRestoreModal] = useState(false);
  const [restoreItem, setRestoreItem] = useState(null);

  // -------------------------------------------------------
  // Filtres
  // -------------------------------------------------------
  const [search, setSearch] = useState("");
  const [filterFamille, setFilterFamille] = useState("");
  const [filterLignee, setFilterLignee] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterYearDeces, setFilterYearDeces] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // -------------------------------------------------------
  // Statistiques
  // -------------------------------------------------------
  const [stats, setStats] = useState({
    total: 0,
    derniereAnnee: 0,
    familles: 0,
    genres: { hommes: 0, femmes: 0 },
  });

  // -------------------------------------------------------
  // Chargement des archives
  // -------------------------------------------------------
  const load = async () => {
    try {
      setLoading(true);
      const data = await apiGet("/archives/membres");
      setRows(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error("Erreur chargement archives :", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      derniereAnnee: 0,
      familles: new Set(),
      genres: { hommes: 0, femmes: 0 },
    };

    let derniereAnnee = 0;
    
    data.forEach((item) => {
      // Compter les genres
      if (item.genre === "H" || item.genre === "Homme") {
        stats.genres.hommes++;
      } else if (item.genre === "F" || item.genre === "Femme") {
        stats.genres.femmes++;
      }

      // Trouver l'année de décès la plus récente
      if (item.dateDeces) {
        const year = new Date(item.dateDeces).getFullYear();
        if (year > derniereAnnee) derniereAnnee = year;
      }

      // Compter les familles uniques
      if (item.famille) stats.familles.add(item.famille);
    });

    stats.derniereAnnee = derniereAnnee;
    stats.familles = stats.familles.size;

    setStats(stats);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------------------------------
  // Options filtres uniques
  // -------------------------------------------------------
  const filterOptions = useMemo(() => {
    const familles = [...new Set(rows.map(r => r.famille).filter(Boolean))].sort();
    const lignees = [...new Set(rows.map(r => r.lignee).filter(Boolean))].sort();
    const genres = [...new Set(rows.map(r => r.genre).filter(Boolean))].sort();
    const statuts = [...new Set(rows.map(r => r.statutHistorique).filter(Boolean))].sort();
    
    const anneesDeces = [];
    rows.forEach(r => {
      if (r.dateDeces) {
        const year = new Date(r.dateDeces).getFullYear();
        anneesDeces.push(year);
      }
    });
    const anneesUniques = [...new Set(anneesDeces)].sort((a, b) => b - a);
    
    return { familles, lignees, genres, statuts, anneesDeces: anneesUniques };
  }, [rows]);

  // -------------------------------------------------------
  // Filtrage avancé
  // -------------------------------------------------------
  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim();

    return rows.filter((r) => {
      if (filterFamille && r.famille !== filterFamille) return false;
      if (filterLignee && r.lignee !== filterLignee) return false;
      if (filterGenre && r.genre !== filterGenre) return false;
      if (filterStatut && r.statutHistorique !== filterStatut) return false;

      if (filterYearDeces) {
        if (!r.dateDeces) return false;
        const y = new Date(r.dateDeces).getFullYear();
        if (y !== Number(filterYearDeces)) return false;
      }

      if (!term) return true;

      const searchText = [
        r.nom,
        r.prenoms,
        r.genre,
        r.famille,
        r.lignee,
        r.categorie,
        r.statutHistorique,
        r.profession,
        r.lieuNaissance,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(term);
    });
  }, [rows, search, filterFamille, filterLignee, filterGenre, filterStatut, filterYearDeces]);

  // -------------------------------------------------------
  // Restauration de membre
  // -------------------------------------------------------
  const handleRestore = async (item) => {
    setRestoreItem(item);
    setOpenRestoreModal(true);
  };

  const confirmRestore = async () => {
    try {
      // Appel API pour restaurer le membre
      await apiPost(`/archives/restaurer/${restoreItem.id}`);
      
      // Supprimer de l'archive
      await apiDelete(`/archives/membres/${restoreItem.id}`);
      
      setOpenRestoreModal(false);
      setRestoreItem(null);
      load();
      alert(`${restoreItem.nom} ${restoreItem.prenoms} a été restauré avec succès.`);
    } catch (error) {
      alert("Erreur lors de la restauration");
    }
  };

  // -------------------------------------------------------
  // Réinitialisation des filtres
  // -------------------------------------------------------
  const resetFilters = () => {
    setSearch("");
    setFilterFamille("");
    setFilterLignee("");
    setFilterGenre("");
    setFilterYearDeces("");
    setFilterStatut("");
  };

  // -------------------------------------------------------
  // Colonnes du tableau
  // -------------------------------------------------------
  const columns = [
    {
      header: "Membre",
      id: "membre",
      size: 240,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-col">
            <button 
              onClick={() => setSelected(r)} 
              className="text-blue-600 hover:underline font-medium text-left"
            >
              {r.nom} {r.prenoms}
            </button>
            <div className="text-xs text-gray-500 mt-1">
              {r.categorie || "—"} • {r.lignee || "—"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Famille/Lignée",
      id: "famille_lignee",
      size: 160,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-col">
            <div className="font-medium">{r.famille || "—"}</div>
            <div className="text-xs text-gray-500">{r.lignee || "—"}</div>
          </div>
        );
      },
    },
    {
      header: "Genre",
      accessorKey: "genre",
      size: 90,
      cell: (info) => {
        const genre = info.getValue();
        const isHomme = genre === "H" || genre === "Homme";
        
        return (
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isHomme 
              ? "bg-blue-100 text-blue-800" 
              : "bg-pink-100 text-pink-800"
          }`}>
            {isHomme ? "Homme" : "Femme"}
          </div>
        );
      },
    },
    {
      header: "Dates",
      id: "dates",
      size: 180,
      cell: ({ row }) => {
        const r = row.original;
        const formatDate = (date) => 
          date ? new Date(date).toLocaleDateString('fr-FR') : "—";
        
        return (
          <div className="flex flex-col">
            <div className="text-sm">
              <span className="text-gray-600">Né: </span>
              {formatDate(r.dateNaissance)}
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Décédé: </span>
              {formatDate(r.dateDeces)}
            </div>
          </div>
        );
      },
    },
    {
      header: "Âge",
      accessorKey: "ageAuDeces",
      size: 80,
      cell: (info) => {
        const age = info.getValue();
        return (
          <div className="font-semibold text-gray-900">
            {age ? `${age} ans` : "—"}
          </div>
        );
      },
    },
    {
      header: "Statut",
      accessorKey: "statutHistorique",
      size: 140,
      cell: (info) => {
        const statut = info.getValue();
        const statusConfig = {
          "Décédé": { color: "red", icon: HeartIcon },
          "Archivé": { color: "gray", icon: ArchiveBoxIcon },
          "Supprimé": { color: "red", icon: UserMinusIcon },
          "Transféré": { color: "blue", icon: ArrowPathIcon },
        };
        
        const config = statusConfig[statut] || { color: "gray", icon: ArchiveBoxIcon };
        
        return (
          <StatusBadge
            status={statut}
            color={config.color}
            icon={<config.icon className="w-3.5 h-3.5" />}
          />
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      size: 140,
      cell: ({ row }) => {
        const r = row.original;
        const actions = [
          {
            label: "Voir",
            icon: <EyeIcon className="w-4 h-4" />,
            onClick: () => setSelected(r),
            color: "blue",
          },
          {
            label: "Restaurer",
            icon: <ArrowPathIcon className="w-4 h-4" />,
            onClick: () => handleRestore(r),
            color: "emerald",
          },
          {
            label: "Supprimer",
            icon: <TrashIcon className="w-4 h-4" />,
            onClick: () => {
              if (confirm(`Supprimer définitivement ${r.nom} ${r.prenoms} ?`)) {
                apiDelete(`/archives/membres/${r.id}`).then(load);
              }
            },
            color: "red",
            destructive: true,
          },
        ];

        return (
          <div className="flex items-center gap-1">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`p-1.5 rounded-lg hover:bg-gray-100 ${
                  action.destructive ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-900'
                }`}
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        );
      },
    },
  ];

  // -------------------------------------------------------
  // Export
  // -------------------------------------------------------
  const exportData = filteredRows.map((r) => ({
    "Nom complet": `${r.nom} ${r.prenoms}`,
    "Genre": r.genre === "H" ? "Homme" : "Femme",
    "Famille": r.famille,
    "Lignée": r.lignee,
    "Catégorie": r.categorie,
    "Profession": r.profession || "",
    "Lieu de naissance": r.lieuNaissance || "",
    "Date de naissance": r.dateNaissance
      ? new Date(r.dateNaissance).toLocaleDateString("fr-FR")
      : "",
    "Date de décès": r.dateDeces
      ? new Date(r.dateDeces).toLocaleDateString("fr-FR")
      : "",
    "Âge au décès": r.ageAuDeces,
    "Statut historique": r.statutHistorique,
    "Cause décès": r.causeDeces || "",
    "Notes": r.notes || "",
  }));

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Archives des membres</h1>
          <p className="text-sm text-gray-500">
            Historique complet et gestion des membres décédés ou archivés
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Réinitialiser
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <FunnelIcon className="w-4 h-4" />
            Filtres
          </button>
                    <button
            onClick={() => setShowStats(!showStats)}
            className="px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <ChartBarIcon className="w-4 h-4" />
            Stats
          </button>
          
          <ExportButton
            data={exportData}
            filename={`archives_${new Date().toISOString().split('T')[0]}`}
          />
        </div>
      </div>

      {/* STATISTIQUES */}            
      {showStats && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total archivés"
          value={stats.total}
          icon={<ArchiveBoxIcon className="w-6 h-6 text-gray-600" />}
          color="gray"
        />
        <StatsCard
          title="Hommes"
          value={stats.genres.hommes}
          icon={<UserIcon className="w-6 h-6 text-blue-600" />}
          percent={stats.total > 0 ? Math.round((stats.genres.hommes / stats.total) * 100) : 0}
          color="blue"
        />
        <StatsCard
          title="Femmes"
          value={stats.genres.femmes}
          icon={<UserIcon className="w-6 h-6 text-pink-600" />}
          percent={stats.total > 0 ? Math.round((stats.genres.femmes / stats.total) * 100) : 0}
          color="pink"
        />
        <StatsCard
          title="Familles représentées"
          value={stats.familles}
          icon={<UserGroupIcon className="w-6 h-6 text-emerald-600" />}
          color="emerald"
        />
      </div>
    )}
      {/* FILTRES AVANCÉS */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FunnelIcon className="w-5 h-5" />
              Filtres avancés
            </h3>
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <XCircleIcon className="w-4 h-4" />
              Tout effacer
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <input
                type="text"
                placeholder="Nom, prénom, profession..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Famille
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterFamille}
                onChange={(e) => setFilterFamille(e.target.value)}
              >
                <option value="">Toutes les familles</option>
                {filterOptions.familles.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lignée
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterLignee}
                onChange={(e) => setFilterLignee(e.target.value)}
              >
                <option value="">Toutes les lignées</option>
                {filterOptions.lignees.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Genre
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="H">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année de décès
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterYearDeces}
                onChange={(e) => setFilterYearDeces(e.target.value)}
              >
                <option value="">Toutes</option>
                {filterOptions.anneesDeces.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
              >
                <option value="">Tous</option>
                {filterOptions.statuts.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-gray-50 shadow-sm border border-gray-200 overflow-hidden">
       
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Chargement des archives...</p>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-8">
            <ArchiveBoxIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun membre archivé</h3>
            <p className="text-gray-500 text-center mb-6">
              {rows.length === 0 
                ? "Aucun membre n'a été archivé pour le moment." 
                : "Aucun membre ne correspond à vos critères de recherche."}
            </p>
            {rows.length > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
              >
                <FunnelIcon className="w-4 h-4" />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            onRowClick={(row) => setSelected(row)}
            getRowClassName={(row) =>
              row.id === selected?.id 
                ? "bg-blue-50 border-l-4 border-l-blue-500" 
                : "hover:bg-gray-50"
            }
            pagination
            pageSize={15}
          />
        )}
      </div>

      {/* PANEL DÉTAILS */}
      <DetailsPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected ? (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <ArchiveBoxIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Fiche archivée</h3>
                <p className="text-sm text-gray-500">{selected.nom} {selected.prenoms}</p>
              </div>
            </div>
          ) : ""
        }
        stayOpenOnChange={true}
        width="520px"
        footer={
          selected && (
            <div className="flex gap-2">
              <button
                onClick={() => handleRestore(selected)}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Restaurer
              </button>
            </div>
          )
        }
      >
        {selected && <ArchiveDetailPanel item={selected} />}
      </DetailsPanel>

      {/* MODALE DE RESTAURATION */}
      <Modal
        open={openRestoreModal}
        onClose={() => setOpenRestoreModal(false)}
        title="Restaurer un membre"
      >
        {restoreItem && (
          <div className="p-4 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <ArrowPathIcon className="w-6 h-6 text-yellow-600" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Confirmation de restauration</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Vous êtes sur le point de restaurer ce membre dans les registres actifs.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Membre à restaurer</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nom complet:</span>
                  <span className="font-medium">{restoreItem.nom} {restoreItem.prenoms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Famille/Lignée:</span>
                  <span className="font-medium">{restoreItem.famille} / {restoreItem.lignee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date de décès:</span>
                  <span className="font-medium">
                    {restoreItem.dateDeces ? new Date(restoreItem.dateDeces).toLocaleDateString('fr-FR') : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setOpenRestoreModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
              >
                Annuler
              </button>
              <button
                onClick={confirmRestore}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
              >
                Confirmer la restauration
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------
// PANEL DÉTAILS AMÉLIORÉ
// ------------------------------------------------------------
function ArchiveDetailPanel({ item }) {
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("fr-FR") : "—";

  const calculateAge = () => {
    if (!item.dateNaissance || !item.dateDeces) return null;
    const birth = new Date(item.dateNaissance);
    const death = new Date(item.dateDeces);
    const age = death.getFullYear() - birth.getFullYear();
    const m = death.getMonth() - birth.getMonth();
    return m < 0 || (m === 0 && death.getDate() < birth.getDate()) 
      ? age - 1 
      : age;
  };

  const age = calculateAge() || item.ageAuDeces;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {item.nom} {item.prenoms}
        </h2>
        <div className="flex justify-center gap-2 mt-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            item.genre === "H" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
          }`}>
            {item.genre === "H" ? "Homme" : "Femme"}
          </div>
          <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {item.categorie || "—"}
          </div>
          <StatusBadge status={item.statutHistorique} color="gray" size="sm" />
        </div>
      </div>

      {/* Sections organisées */}
      <div className="space-y-4">
        <Section title="Informations personnelles">
          <InfoRow label="Profession" value={item.profession} />
          <InfoRow label="Lieu de naissance" value={item.lieuNaissance} />
          <InfoRow label="Date de naissance" value={formatDate(item.dateNaissance)} />
          <InfoRow label="Date de décès" value={formatDate(item.dateDeces)} />
          {age && <InfoRow label="Âge au décès" value={`${age} ans`} />}
          {item.causeDeces && <InfoRow label="Cause du décès" value={item.causeDeces} />}
        </Section>

        <Section title="Appartenance familiale">
          <InfoRow label="Famille" value={item.famille} />
          <InfoRow label="Lignée" value={item.lignee} />
          <InfoRow label="Génération" value={item.generation} />
        </Section>

        <Section title="Statut">
          <InfoRow label="Statut historique" value={item.statutHistorique} />
          <InfoRow label="Date d'archivage" value={formatDate(item.dateArchivage)} />
          {item.motifArchivage && (
            <InfoRow label="Motif d'archivage" value={item.motifArchivage} />
          )}
        </Section>

        {item.notes && (
          <Section title="Notes">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-line">{item.notes}</p>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// COMPOSANTS AUXILIAIRES
// ------------------------------------------------------------
const Section = ({ title, children }) => (
  <div className="border-t pt-4">
    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
      <ChevronRightIcon className="w-4 h-4 text-blue-500" />
      {title}
    </h4>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value || "—"}</span>
  </div>
);