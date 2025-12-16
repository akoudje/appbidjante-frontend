// src/pages/Categories.jsx
import React, { useEffect, useState, useMemo } from "react";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import CategoryForm from "../components/CategoryForm";
import DetailsPanel from "../components/DetailsPanel";
import StatsCard from "../components/StatsCard";
import QuickActions from "../components/QuickActions";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api";
import { formatDate } from "../utils/date";

import {
  PlusCircleIcon,
  PencilSquareIcon,
  InformationCircleIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  FunnelIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserPlusIcon,
  UsersIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/solid";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

import ExportButton from "../components/filters/ExportButton";
import ActionsInline from "../components/ActionsInline";

// ------------------------------------------------------------
// PAGE PRINCIPALE
// ------------------------------------------------------------
export default function Categories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState("");
  const [filterGeneration, setFilterGeneration] = useState("");
  const [filterClasse, setFilterClasse] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showStats, setShowStats] = useState(false);

  // États UI
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);

  // Stats générales
  const [overallStats, setOverallStats] = useState({
    totalCategories: 0,
    totalMembres: 0,
    generations: {},
    classes: {},
  });

  // Stats de la catégorie sélectionnée
  const [categoryStats, setCategoryStats] = useState(null);

  // ------------------------------------------------------------
  // CHARGEMENT DES DONNÉES
  // ------------------------------------------------------------
  // Dans la fonction loadData de Categories.jsx, modifiez :
  const loadData = async () => {
    try {
      setLoading(true);

      // Essayer d'abord la route optimisée
      try {
        const data = await apiGet("/categories/with-stats");
        setRows(data);
        calculateOverallStats(data);
      } catch (optimizedErr) {
        console.warn("Route /with-stats non disponible, utilisation fallback");

        // Fallback: utiliser la route standard
        const categories = await apiGet("/categories");

        // Pour chaque catégorie, récupérer les stats si nécessaire
        const categoriesWithStats = await Promise.all(
          categories.map(async (cat) => {
            try {
              const stats = await apiGet(`/categories/${cat.id}/stats`);
              return {
                ...cat,
                membreCount: cat.membreCount || 0,
                stats,
              };
            } catch (statsErr) {
              console.warn(`Erreur stats catégorie ${cat.id}:`, statsErr);
              return {
                ...cat,
                membreCount: cat.membreCount || 0,
                stats: null,
              };
            }
          })
        );

        setRows(categoriesWithStats);
        calculateOverallStats(categoriesWithStats);
      }
    } catch (err) {
      console.error("Erreur chargement catégories:", err);

      // Fallback minimal
      try {
        const categories = await apiGet("/categories");
        const categoriesWithCounts = categories.map((cat) => ({
          ...cat,
          membreCount: cat.membreCount || 0,
        }));
        setRows(categoriesWithCounts);
        calculateOverallStats(categoriesWithCounts);
      } catch (fallbackErr) {
        console.error("Erreur fallback:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = (categories) => {
    const stats = {
      totalCategories: categories.length,
      totalMembres: 0,
      generations: {},
      classes: {},
    };

    categories.forEach((cat) => {
      // Comptage des générations
      if (cat.generation) {
        stats.generations[cat.generation] =
          (stats.generations[cat.generation] || 0) + 1;
      }

      // Comptage des classes
      if (cat.classe) {
        stats.classes[cat.classe] = (stats.classes[cat.classe] || 0) + 1;
      }

      // Total des membres
      stats.totalMembres += cat.membreCount || 0;
    });

    setOverallStats(stats);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ------------------------------------------------------------
  // CHARGEMENT DES STATS DE LA CATÉGORIE SÉLECTIONNÉE
  // ------------------------------------------------------------
  useEffect(() => {
    if (selected?.id) {
      loadCategoryStats(selected.id);
    } else {
      setCategoryStats(null);
    }
  }, [selected]);

  const loadCategoryStats = async (id) => {
    try {
      const stats = await apiGet(`/categories/${id}/stats`);
      setCategoryStats(stats);
    } catch (error) {
      console.error("Erreur chargement stats catégorie:", error);

      // Calculer localement si possible
      const category = rows.find((cat) => cat.id === id);
      if (category && category.membres && category.membres.length > 0) {
        const localStats = {
          total: category.membreCount || 0,
          actifs: category.membres.filter((m) => m.statutMembre === "Actif")
            .length,
          hommes: category.membres.filter((m) => m.genre === "Homme").length,
          femmes: category.membres.filter((m) => m.genre === "Femme").length,
          // Calculer la répartition par famille
          familles: calculateFamilleStats(category.membres),
        };
        setCategoryStats(localStats);
      } else {
        setCategoryStats(null);
      }
    }
  };

  const calculateFamilleStats = (membres) => {
    const famillesMap = {};

    membres.forEach((membre) => {
      const familleNom = membre.lignee?.famille?.nom || "Non assigné";
      if (!famillesMap[familleNom]) {
        famillesMap[familleNom] = { nom: familleNom, total: 0 };
      }
      famillesMap[familleNom].total += 1;
    });

    return Object.values(famillesMap);
  };

  // ------------------------------------------------------------
  // FILTRAGE
  // ------------------------------------------------------------
  const filteredRows = useMemo(() => {
    return rows.filter((cat) => {
      const term = search.toLowerCase();
      const fulltext = `${cat.label} ${cat.generation || ""} ${
        cat.classe || ""
      } ${cat.description || ""}`.toLowerCase();

      if (term && !fulltext.includes(term)) return false;
      if (filterGeneration && cat.generation !== filterGeneration) return false;
      if (filterClasse && cat.classe !== filterClasse) return false;

      return true;
    });
  }, [rows, search, filterGeneration, filterClasse]);

  // ------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------
  const handleDelete = async (row) => {
    if (row.membreCount > 0) {
      alert(
        `Impossible de supprimer cette catégorie car elle contient ${row.membreCount} membre(s).`
      );
      return;
    }

    if (
      !confirm(`Voulez-vous vraiment supprimer la catégorie "${row.label}" ?`)
    )
      return;

    try {
      await apiDelete(`/categories/${row.id}`);
      if (selected?.id === row.id) setSelected(null);
      loadData();
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleSave = async (payload) => {
    try {
      if (payload.id) {
        await apiPut(`/categories/${payload.id}`, payload);
      } else {
        await apiPost("/categories", payload);
      }
      setOpenModal(false);
      setEditing(null);
      loadData();
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilterGeneration("");
    setFilterClasse("");
  };

  // ------------------------------------------------------------
  // OPTIONS DE FILTRES UNIQUES
  // ------------------------------------------------------------
  const filterOptions = useMemo(() => {
    const generations = [
      ...new Set(rows.map((c) => c.generation).filter(Boolean)),
    ].sort();
    const classes = [
      ...new Set(rows.map((c) => c.classe).filter(Boolean)),
    ].sort();

    return { generations, classes };
  }, [rows]);

  // ------------------------------------------------------------
  // COLONNES DU TABLEAU
  // ------------------------------------------------------------
  const columns = useMemo(
    () => [
      {
        header: "Catégorie",
        accessorKey: "label",
        size: 200,
        cell: ({ row }) => {
          const cat = row.original;
          return (
            <div className="flex flex-col">
              <button
                onClick={() => setSelected(cat)}
                className="text-blue-600 hover:underline font-medium text-left"
              >
                {cat.label}
              </button>
              <div className="text-xs text-gray-500 mt-1">
                {cat.description
                  ? `${cat.description.substring(0, 40)}...`
                  : "Aucune description"}
              </div>
            </div>
          );
        },
      },
      {
        header: "Génération",
        accessorKey: "generation",
        size: 140,
        cell: (info) => {
          const generation = info.getValue();
          return (
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                generation === "DOUGBO"
                  ? "bg-purple-100 text-purple-800"
                  : generation === "TCHAGBA"
                  ? "bg-blue-100 text-blue-800"
                  : generation === "BLESSOUE"
                  ? "bg-emerald-100 text-emerald-800"
                  : generation === "GNANDO"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {generation || "Non spécifiée"}
            </div>
          );
        },
      },
      {
        header: "Classe",
        accessorKey: "classe",
        size: 140,
        cell: (info) => {
          const classe = info.getValue();
          return (
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                classe === "ASSOUKROU"
                  ? "bg-red-100 text-red-800"
                  : classe === "AGBAN"
                  ? "bg-green-100 text-green-800"
                  : classe === "DONGBA"
                  ? "bg-blue-100 text-blue-800"
                  : classe === "DJEHOU"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {classe || "Non spécifiée"}
            </div>
          );
        },
      },
      {
        header: "Période",
        id: "periode",
        size: 160,
        cell: ({ row }) => {
          const cat = row.original;
          return (
            <div className="flex flex-col">
              <div className="font-medium">
                {cat.born_from || "?"} — {cat.born_to || "?"}
              </div>
              <div className="text-xs text-gray-500">
                {calculateAgeRange(cat.born_from, cat.born_to)}
              </div>
            </div>
          );
        },
      },
      {
        header: "Membres",
        id: "membres",
        size: 100,
        cell: ({ row }) => {
          const { membreCount } = row.original;
          return (
            <div className="flex items-center gap-2">
              <UsersIcon
                className="w-4 h-4 text-gray-400"
                aria-label="Nombre de membres"
              />
              <span
                className={`font-medium ${
                  membreCount > 0 ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {membreCount || 0}
              </span>
              {membreCount > 0 && (
                <span className="text-xs text-gray-500">
                  ({Math.round((membreCount / overallStats.totalMembres) * 100)}
                  %)
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        size: 160,
        cell: ({ row }) => {
          const cat = row.original;
          return (
            <ActionsInline
              actions={[
                {
                  label: "Voir",
                  icon: <InformationCircleIcon className="w-4 h-4" />,
                  onClick: () => setSelected(cat),
                  color: "blue",
                },
                {
                  label: "Modifier",
                  icon: <PencilSquareIcon className="w-4 h-4" />,
                  onClick: () => {
                    setEditing(cat);
                    setOpenModal(true);
                  },
                  color: "amber",
                },
                {
                  label: "Supprimer",
                  icon: <TrashIcon className="w-4 h-4" />,
                  onClick: () => handleDelete(cat),
                  color: "red",
                  destructive: true,
                  disabled: cat.membreCount > 0,
                },
              ]}
              compact
            />
          );
        },
      },
    ],
    [overallStats.totalMembres]
  );

  // ------------------------------------------------------------
  // FONCTIONS UTILITAIRES
  // ------------------------------------------------------------
  const calculateAgeRange = (bornFrom, bornTo) => {
    if (!bornFrom || !bornTo) return "Âge inconnu";
    const currentYear = new Date().getFullYear();
    const minAge = currentYear - bornTo;
    const maxAge = currentYear - bornFrom;
    return `${minAge} - ${maxAge} ans`;
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-sm text-gray-500">
            Gestion des générations et classes d'âge du village
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
            filename={`categories_${new Date().toISOString().split("T")[0]}`}
            data={filteredRows.map((cat) => ({
              Catégorie: cat.label,
              Description: cat.description || "",
              Génération: cat.generation || "",
              Classe: cat.classe || "",
              "Année début": cat.born_from || "",
              "Année fin": cat.born_to || "",
              "Date sortie 1er guerrier": cat.date_sortie_1er_guerrier
                ? formatDate(cat.date_sortie_1er_guerrier)
                : "",
              "Date sortie 2ème guerrier": cat.date_sortie_2eme_guerrier
                ? formatDate(cat.date_sortie_2eme_guerrier)
                : "",
              "Nombre de membres": cat.membreCount || 0,
            }))}
          />

          <button
            onClick={() => {
              setEditing(null);
              setOpenModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm font-medium"
          >
            <UserPlusIcon className="w-5 h-5" />
            Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* STATS GLOBALES */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Catégories"
            value={overallStats.totalCategories}
            icon={<UserGroupIcon className="w-6 h-6 text-gray-600" />}
            color="gray"
          />
          <StatsCard
            title="Membres total"
            value={overallStats.totalMembres}
            icon={<UsersIcon className="w-6 h-6 text-blue-600" />}
            color="blue"
          />
          <StatsCard
            title="Générations"
            value={Object.keys(overallStats.generations).length}
            icon={<ChartBarIcon className="w-6 h-6 text-emerald-600" />}
            color="emerald"
          />
          <StatsCard
            title="Classes"
            value={Object.keys(overallStats.classes).length}
            icon={<CalendarIcon className="w-6 h-6 text-purple-600" />}
            color="purple"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <input
                type="text"
                placeholder="Nom, description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Génération
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterGeneration}
                onChange={(e) => setFilterGeneration(e.target.value)}
              >
                <option value="">Toutes les générations</option>
                {filterOptions.generations.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classe
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterClasse}
                onChange={(e) => setFilterClasse(e.target.value)}
              >
                <option value="">Toutes les classes</option>
                {filterOptions.classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}

      {/* TABLEAU */}
      <div className="bg-gray-50 shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Chargement des catégories...</p>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-8">
            <UserGroupIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune catégorie trouvée
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {rows.length === 0
                ? "Aucune catégorie n'a été créée pour le moment."
                : "Aucune catégorie ne correspond à vos critères de recherche."}
            </p>
            <button
              onClick={() => {
                setEditing(null);
                setOpenModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Créer la première catégorie
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

      {/* MODAL */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
        size="lg"
      >
        <CategoryForm
          initial={editing}
          onCancel={() => setOpenModal(false)}
          onSubmit={handleSave}
        />
      </Modal>

      {/* PANEL DÉTAILS */}
      <DetailsPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Fiche de la catégorie</h3>
              <p className="font bold text-xl text-gray-900">{selected?.label}</p>
            </div>
          </div>
        }
        stayOpenOnChange={true}
        width="520px"
        footer={
          selected && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(selected);
                  setOpenModal(true);
                  setSelected(null);
                }}
                className="flex-1 px-4 py-2  hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => handleDelete(selected)}
                disabled={selected.membreCount > 0}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  selected.membreCount > 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                }`}
                title={
                  selected.membreCount > 0
                    ? "Impossible de supprimer (contient des membres)"
                    : "Supprimer"
                }
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )
        }
      >
        {selected && (
          <CategoryDetailPanel cat={selected} stats={categoryStats} />
        )}
      </DetailsPanel>
    </div>
  );
}

// ------------------------------------------------------------
// COMPOSANT PANEL DÉTAILS AMÉLIORÉ
// ------------------------------------------------------------
function CategoryDetailPanel({ cat, stats }) {
  return (
    <div className="space-y-6">
      {/* Sections organisées */}
      <div className="space-y-4">
        <Section title="Informations générales">
          <InfoRow label="Génération" value={cat.generation || "—"} />
          <InfoRow label="Classe" value={cat.classe || "—"} />
          <InfoRow
            label="Année de naissance début"
            value={cat.born_from || "—"}
          />
          <InfoRow label="Année de naissance fin" value={cat.born_to || "—"} />
          {cat.born_from && cat.born_to && (
            <InfoRow
              label="Tranche d'âge"
              value={`${new Date().getFullYear() - cat.born_to} - ${
                new Date().getFullYear() - cat.born_from
              } ans`}
            />
          )}
        </Section>

        {/* Membres */}
        <Section title="Membres">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-gray-900">
                {cat.membreCount || 0}
              </div>
              <div className="text-sm text-gray-600">Membres total</div>
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {stats.hommes || 0}
                  </div>
                  <div className="text-xs text-blue-700">Hommes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-pink-900">
                    {stats.femmes || 0}
                  </div>
                  <div className="text-xs text-pink-700">Femmes</div>
                </div>
              </div>
            )}

            {(!stats || !stats.total) && cat.membreCount > 0 && (
              <p className="text-sm text-gray-600 text-center mt-2">
                Détails des membres disponibles après chargement
              </p>
            )}
          </div>
        </Section>

        {/* Dates importantes */}
        {(cat.date_sortie_1er_guerrier || cat.date_sortie_2eme_guerrier) && (
          <Section title="Dates importantes">
            {cat.date_sortie_1er_guerrier && (
              <InfoRow
                label="1er Guerrier"
                value={formatDate(cat.date_sortie_1er_guerrier)}
              />
            )}
            {cat.date_sortie_2eme_guerrier && (
              <InfoRow
                label="2ᵉ Guerrier"
                value={formatDate(cat.date_sortie_2eme_guerrier)}
              />
            )}
          </Section>
        )}

        {/* Répartition par famille */}
        {stats && stats.familles && stats.familles.length > 0 && (
          <Section title="Répartition par famille">
            <div className="space-y-3">
              {stats.familles.map((famille) => (
                <div
                  key={famille.nom}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">{famille.nom}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (famille.total / (stats.total || 1)) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 min-w-8 text-right">
                      {famille.total}
                    </span>
                  </div>
                </div>
              ))}
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
    <div className="space-y-2">{children}</div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value || "—"}</span>
  </div>
);
