// src/pages/Deces.jsx

import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import DetailsPanel from "../components/DetailsPanel";
import Modal from "../components/Modal";
import DecesForm from "../components/DecesForm";
import EnterrementForm from "../components/EnterrementForm";
import ActionsInline from "../components/ActionsInline";
import StatsCard from "../components/StatsCard";
import QuickActions from "../components/QuickActions";
import { apiGet, apiDelete } from "../utils/api";

import {
  PlusCircleIcon,
  PencilSquareIcon,
  InformationCircleIcon,
  TrashIcon,
  HeartIcon,
  CalendarIcon,
  UserGroupIcon,
  FunnelIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ClockIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import {
  ChevronRightIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import FilterBar from "../components/filters/FilterBar";
import ExportButton from "../components/filters/ExportButton";
import StatusBadge from "../components/StatusBadge";

// ---------------------------------------------------------
// Utils
// ---------------------------------------------------------
function computeAgeAtDeath(membre, dateDeces) {
  if (!membre?.dateNaissance || !dateDeces) return null;
  const birth = new Date(membre.dateNaissance);
  const death = new Date(dateDeces);
  let age = death.getFullYear() - birth.getFullYear();
  const m = death.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(date, showTime = false) {
  if (!date) return "—";
  const d = new Date(date);
  if (showTime) {
    return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString("fr-FR");
}

export default function Deces() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [openDecesModal, setOpenDecesModal] = useState(false);
  const [openEnterrementModal, setOpenEnterrementModal] = useState(false);
  const [selectedForEnterrement, setSelectedForEnterrement] = useState(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [famille, setFamille] = useState("");
  const [lignee, setLignee] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showStats, setShowStats] = useState(false);

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    moisCourant: 0,
    dernierMois: 0,
    avecEnterrement: 0,
    sansEnterrement: 0,
  });

  // ---------------------------------------------------------
  // Load Data
  // ---------------------------------------------------------
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiGet("/deces?withRelations=true");
      setRows(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error("Erreur chargement décès:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const stats = {
      total: data.length,
      moisCourant: 0,
      dernierMois: 0,
      avecEnterrement: 0,
      sansEnterrement: 0,
    };

    data.forEach(deces => {
      const dateDeces = new Date(deces.dateDeces);
      
      // Décès du mois courant
      if (dateDeces.getMonth() === currentMonth && dateDeces.getFullYear() === currentYear) {
        stats.moisCourant++;
      }
      
      // Décès du mois précédent
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      if (dateDeces.getMonth() === lastMonth && dateDeces.getFullYear() === lastMonthYear) {
        stats.dernierMois++;
      }
      
      // Avec/sans enterrement
      if (deces.enterrement) {
        stats.avecEnterrement++;
      } else {
        stats.sansEnterrement++;
      }
    });

    setStats(stats);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------------------------------------------------------
  // Options filtres
  // ---------------------------------------------------------
  const filterOptions = useMemo(() => {
    const familles = [...new Set(rows.map(d => d.membre?.lignee?.famille?.nom).filter(Boolean))].sort();
    const lignees = [...new Set(rows.map(d => d.membre?.lignee?.nom).filter(Boolean))].sort();
    const genres = [...new Set(rows.map(d => d.membre?.genre).filter(Boolean))].sort();
    
    const annees = [];
    rows.forEach(d => {
      if (d.dateDeces) {
        const year = new Date(d.dateDeces).getFullYear();
        annees.push(year);
      }
    });
    const anneesUniques = [...new Set(annees)].sort((a, b) => b - a);
    
    return { familles, lignees, genres, annees: anneesUniques };
  }, [rows]);

  // ---------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------
  const filteredRows = useMemo(() => {
    const s = search.toLowerCase().trim();

    return rows.filter((d) => {
      const m = d.membre;
      const fFam = m?.lignee?.famille?.nom || "";
      const fLig = m?.lignee?.nom || "";
      const fGen = m?.genre || "";
      const fYear = d.dateDeces ? new Date(d.dateDeces).getFullYear() : null;

      if (famille && fFam !== famille) return false;
      if (lignee && fLig !== lignee) return false;
      if (genre && fGen !== genre) return false;
      if (year && fYear !== Number(year)) return false;

      if (s) {
        const searchText = [
          m?.nom,
          m?.prenoms,
          fFam,
          fLig,
          fGen,
          d.motif,
          d.lieuDeces,
          d.causeDeces,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchText.includes(s)) return false;
      }

      return true;
    });
  }, [rows, search, famille, lignee, genre, year]);

  // ---------------------------------------------------------
  // Actions
  // ---------------------------------------------------------
  const handleDelete = async (row) => {
    const m = row.membre;
    if (!confirm(`Voulez-vous vraiment supprimer le décès de ${m?.nom} ${m?.prenoms} ?`)) return;

    try {
      await apiDelete(`/deces/${row.id}`);
      if (selected?.id === row.id) setSelected(null);
      loadData();
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleOpenEnterrement = (deces) => {
    setSelectedForEnterrement(deces);
    setOpenEnterrementModal(true);
  };

  const resetFilters = () => {
    setSearch("");
    setFamille("");
    setLignee("");
    setGenre("");
    setYear("");
  };

  // ---------------------------------------------------------
  // Columns
  // ---------------------------------------------------------
  const columns = [
    {
      header: "Membre",
      accessorKey: "membre",
      size: 240,
      cell: ({ row }) => {
        const d = row.original;
        const m = d.membre;
        const age = computeAgeAtDeath(m, d.dateDeces);
        
        return (
          <div className="flex flex-col">
            <button
              className="text-blue-600 hover:underline font-medium text-left"
              onClick={() => setSelected(d)}
            >
              {m ? `${m.nom} ${m.prenoms}` : "—"}
            </button>
            <div className="text-xs text-gray-500 mt-1">
              {age ? `${age} ans` : "Âge inconnu"} • {m?.categorie?.label || "—"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Famille/Lignée",
      id: "famille_lignee",
      size: 180,
      cell: ({ row }) => {
        const m = row.original.membre;
        return (
          <div className="flex flex-col">
            <div className="font-medium">{m?.lignee?.famille?.nom || "—"}</div>
            <div className="text-xs text-gray-500">{m?.lignee?.nom || "—"}</div>
          </div>
        );
      },
    },
    {
      header: "Date & Lieu",
      id: "date_lieu",
      size: 200,
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div className="flex flex-col">
            <div className="font-medium">{formatDate(d.dateDeces)}</div>
            <div className="text-xs text-gray-500">
              {d.lieuDeces || "Lieu non spécifié"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      size: 160,
      cell: ({ row }) => {
        const m = row.original;
        const actions = [
          {
            label: "Voir",
            icon: <EyeIcon className="w-4 h-4" />,
            onClick: () => setSelected(m),
            color: "blue",
          },
          {
            label: "Modifier",
            icon: <PencilSquareIcon className="w-4 h-4" />,
            onClick: () => {
              setEditing(m);
              setOpenDecesModal(true);
            },
            color: "amber",
          },
          {
            label: "Enterrement",
            icon: <CalendarIcon className="w-4 h-4" />,
            onClick: () => handleOpenEnterrement(m),
            color: "green",
          },
          {
            label: "Supprimer",
            icon: <TrashIcon className="w-4 h-4" />,
            onClick: () => handleDelete(m),
            color: "red",
            destructive: true,
          },
        ];

        return <ActionsInline actions={actions} compact />;
      },
    },
  ];

  // ---------------------------------------------------------
  // Export Excel
  // ---------------------------------------------------------
  const exportData = filteredRows.map((d) => ({
    "Nom complet": `${d.membre?.nom || ""} ${d.membre?.prenoms || ""}`,
    "Genre": d.membre?.genre || "",
    "Famille": d.membre?.lignee?.famille?.nom || "",
    "Lignée": d.membre?.lignee?.nom || "",
    "Catégorie": d.membre?.categorie?.label || "",
    "Date décès": formatDate(d.dateDeces),
    "Heure décès": d.heureDeces || "",
    "Lieu décès": d.lieuDeces || "",
    "Cause décès": d.causeDeces || "",
    "Motif": d.motif || "",
    "Âge au décès": computeAgeAtDeath(d.membre, d.dateDeces) || "",
    "Statut enterrement": d.enterrement?.statut || "Non programmé",
  }));

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des décès</h1>
          <p className="text-sm text-gray-500">
            Enregistrement et suivi des décès dans la communauté
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          
          <button
            onClick={loadData}
            className="px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Actualiser
          </button>
          
          <ExportButton
            data={exportData}
            filename={`deces_${new Date().toISOString().split('T')[0]}`}
          />
          
          <button
            onClick={() => {
              setEditing(null);
              setOpenDecesModal(true);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <HeartIcon className="w-5 h-5" />
            Nouveau décès
          </button>
        </div>
      </div>

      {/* STATISTIQUES */}
            {showStats && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total décès"
          value={stats.total}
          icon={<HeartIcon className="w-6 h-6 text-gray-600" />}
          color="gray"
          loading={loading}
        />
        
        <StatsCard
          title="Décès ce mois"
          value={stats.moisCourant}
          icon={<CalendarIcon className="w-6 h-6 text-red-600" />}
          trend={stats.moisCourant - stats.dernierMois}
          trendLabel="vs mois précédent"
          color="red"
          loading={loading}
        />
        
        <StatsCard
          title="Avec enterrement"
          value={stats.avecEnterrement}
          icon={<UserGroupIcon className="w-6 h-6 text-green-600" />}
          percent={stats.total > 0 ? Math.round((stats.avecEnterrement / stats.total) * 100) : 0}
          color="green"
          loading={loading}
        />
        
        <StatsCard
          title="À programmer"
          value={stats.sansEnterrement}
          icon={<ClockIcon className="w-6 h-6 text-amber-600" />}
          color="amber"
          loading={loading}
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
                placeholder="Nom, prénom, cause..."
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
                value={famille}
                onChange={(e) => setFamille(e.target.value)}
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
                value={lignee}
                onChange={(e) => setLignee(e.target.value)}
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
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option value="">Tous</option>
                {filterOptions.genres.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">Toutes</option>
                {filterOptions.annees.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            
            <div className="col-span-2 flex items-end">
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

      {/* TABLEAU */}
      <div className="bg-white shadow-sm overflow-hidden">        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Chargement des décès...</p>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-8">
            <HeartIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun décès enregistré</h3>
            <p className="text-gray-500 text-center mb-6">
              {rows.length === 0 
                ? "Aucun décès n'a été enregistré pour le moment." 
                : "Aucun décès ne correspond à vos critères de recherche."}
            </p>
            <button
              onClick={() => {
                setEditing(null);
                setOpenDecesModal(true);
              }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Enregistrer le premier décès
            </button>
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
              <div className="p-2 rounded-lg bg-red-100">
                <HeartIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Fiche de décès</h3>
                <p className="text-sm text-gray-500">
                  {selected.membre?.nom} {selected.membre?.prenoms}
                </p>
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
                onClick={() => handleOpenEnterrement(selected)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                {selected.enterrement ? "Modifier enterrement" : "Ajouter enterrement"}
              </button>
              <button
                onClick={() => {
                  setEditing(selected);
                  setOpenDecesModal(true);
                  setSelected(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            </div>
          )
        }
      >
        {selected && <DecesDetailPanel deces={selected} />}
      </DetailsPanel>

      {/* MODALES */}
      <Modal 
        open={openDecesModal} 
        onClose={() => setOpenDecesModal(false)}
        size="lg"
        title={editing ? "Modifier le décès" : "Nouveau décès"}
      >
        <DecesForm
          initial={editing}
          onSubmit={() => {
            setOpenDecesModal(false);
            setEditing(null);
            loadData();
          }}
          onCancel={() => setOpenDecesModal(false)}
        />
      </Modal>

      <Modal
        open={openEnterrementModal}
        onClose={() => setOpenEnterrementModal(false)}
        size="md"
        title="Gestion de l'enterrement"
      >
        {selectedForEnterrement && (
          <EnterrementForm
            enterrement={selectedForEnterrement.enterrement}
            deces={selectedForEnterrement}
            onSaved={() => {
              loadData();
              setOpenEnterrementModal(false);
              setSelectedForEnterrement(null);
            }}
            onClose={() => setOpenEnterrementModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}

// -----------------------------------------------------------
// PANEL DÉTAIL AMÉLIORÉ
// -----------------------------------------------------------
function DecesDetailPanel({ deces }) {
  const m = deces.membre;
  const age = computeAgeAtDeath(m, deces.dateDeces);
  const e = deces.enterrement;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {m ? `${m.nom} ${m.prenoms}` : "—"}
        </h2>
        <div className="flex justify-center gap-2 mt-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            m?.genre === "Homme" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
          }`}>
            {m?.genre}
          </div>
          <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {m?.categorie?.label || "—"}
          </div>
          {age && (
            <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
              {age} ans
            </div>
          )}
        </div>
      </div>

      {/* Sections organisées */}
      <div className="space-y-4">
        <Section title="Informations du décès">
          <InfoRow label="Date du décès" value={formatDate(deces.dateDeces)} />
          <InfoRow label="Heure du décès" value={deces.heureDeces || "—"} />
          <InfoRow label="Lieu du décès" value={deces.lieuDeces || "—"} />
          <InfoRow label="Cause du décès" value={deces.causeDeces || "—"} />
          <InfoRow label="Motif" value={deces.motif || "—"} />
          {deces.certificatDeces && (
            <InfoRow label="Certificat de décès" value="Disponible" />
          )}
        </Section>

        <Section title="Informations personnelles">
          <InfoRow label="Date de naissance" value={formatDate(m?.dateNaissance)} />
          <InfoRow label="Lieu de naissance" value={m?.lieuNaissance || "—"} />
          <InfoRow label="Profession" value={m?.profession || "—"} />
          <InfoRow label="Contact" value={m?.contact || "—"} />
        </Section>

        <Section title="Appartenance familiale">
          <InfoRow label="Famille" value={m?.lignee?.famille?.nom || "—"} />
          <InfoRow label="Lignée" value={m?.lignee?.nom || "—"} />
          <InfoRow label="Génération" value={m?.generation?.nom || "—"} />
        </Section>



        {deces.notes && (
          <Section title="Notes">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-line">{deces.notes}</p>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// COMPOSANTS AUXILIAIRES
// -----------------------------------------------------------
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