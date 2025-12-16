// src/pages/Familles.jsx
import { useEffect, useMemo, useState } from "react";
import StatsCard from "../components/StatsCard";
import QuickActions from "../components/QuickActions";
import DetailsPanel from "../components/DetailsPanel";
import Modal from "../components/Modal";
import LigneeForm from "../components/LigneeForm";
import FamilleForm from "../components/FamilleForm";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api";

import {
  PlusCircleIcon,
  PencilSquareIcon,
  InformationCircleIcon,
  TrashIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  FunnelIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserPlusIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import { PencilIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";

import ExportButton from "../components/filters/ExportButton";
import ActionsInline from "../components/ActionsInline";
import StatusBadge from "../components/StatusBadge";

export default function FamillesPage() {
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFamilles, setExpandedFamilles] = useState([]);

  // Filtres
  const [search, setSearch] = useState("");
  const [filterLignees, setFilterLignees] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showStats, setShowStats] = useState(false);

  // Sélection et modales
  const [selected, setSelected] = useState(null);
  const [openModalFamille, setOpenModalFamille] = useState(false);
  const [editingFamille, setEditingFamille] = useState(null);
  const [openModalLignee, setOpenModalLignee] = useState(false);
  const [editingLignee, setEditingLignee] = useState(null);
  const [parentFamilleId, setParentFamilleId] = useState(null);

  // Statistiques
  const [stats, setStats] = useState({
    totalFamilles: 0,
    totalLignees: 0,
    totalMembres: 0,
    famillesSansLignees: 0,
  });

  // ----------------------------------------------------------
  // CHARGEMENT DES DONNÉES
  // ----------------------------------------------------------
  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/familles?withRelations=true");
      setFamilles(data);
      calculateStats(data);
    } catch (error) {
      console.error("Erreur chargement familles:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (famillesData) => {
    const stats = {
      totalFamilles: famillesData.length,
      totalLignees: 0,
      totalMembres: 0,
      famillesSansLignees: 0,
    };

    famillesData.forEach((famille) => {
      const nbLignees = famille.lignees?.length || 0;
      stats.totalLignees += nbLignees;

      if (nbLignees === 0) {
        stats.famillesSansLignees++;
      }

      // Calculer le nombre total de membres (somme des membres de toutes les lignées)
      famille.lignees?.forEach((lignee) => {
        stats.totalMembres += lignee.membres?.length || 0;
      });
    });

    setStats(stats);
  };

  useEffect(() => {
    load();
  }, []);

  // ----------------------------------------------------------
  // GESTION EXPANSION DES FAMILLES
  // ----------------------------------------------------------
  const toggleFamille = async (familleId) => {
    if (expandedFamilles.includes(familleId)) {
      setExpandedFamilles((prev) => prev.filter((id) => id !== familleId));
      return;
    }

    // Charger les détails des lignées si nécessaire
    const famille = familles.find((f) => f.id === familleId);
    if (famille && famille.lignees) {
      const updatedFamille = await loadLigneeDetails(famille);
      setFamilles((prev) =>
        prev.map((f) => (f.id === familleId ? updatedFamille : f))
      );
    }

    setExpandedFamilles((prev) => [...prev, familleId]);
  };

  const loadLigneeDetails = async (famille) => {
    const updatedLignees = await Promise.all(
      famille.lignees.map(async (l) => {
        try {
          return await apiGet(`/lignees/${l.id}?withRelations=true`);
        } catch {
          return l;
        }
      })
    );
    return { ...famille, lignees: updatedLignees };
  };

  const isFamilleExpanded = (familleId) => expandedFamilles.includes(familleId);

  // ----------------------------------------------------------
  // FILTRAGE
  // ----------------------------------------------------------
  const filteredFamilles = useMemo(() => {
    let list = [...familles];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (f) =>
          f.nom.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.lignees?.some((l) => l.nom.toLowerCase().includes(q))
      );
    }

    if (filterLignees === "0") {
      list = list.filter((f) => (f.lignees?.length || 0) === 0);
    } else if (filterLignees === "1-5") {
      list = list.filter(
        (f) => (f.lignees?.length || 0) >= 1 && (f.lignees?.length || 0) <= 5
      );
    } else if (filterLignees === "5+") {
      list = list.filter((f) => (f.lignees?.length || 0) > 5);
    }

    return list;
  }, [familles, search, filterLignees]);

  // ----------------------------------------------------------
  // CRUD FAMILLES
  // ----------------------------------------------------------
  const saveFamille = async (payload) => {
    try {
      if (editingFamille) {
        await apiPut(`/familles/${editingFamille.id}`, payload);
      } else {
        await apiPost("/familles", payload);
      }
      setOpenModalFamille(false);
      setEditingFamille(null);
      load();
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const deleteFamille = async (famille) => {
    if (
      !confirm(`Voulez-vous vraiment supprimer la famille "${famille.nom}" ?`)
    )
      return;
    try {
      await apiDelete(`/familles/${famille.id}`);
      load();
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  // ----------------------------------------------------------
  // CRUD LIGNÉES
  // ----------------------------------------------------------
  const saveLignee = async (payload) => {
    try {
      if (editingLignee) {
        await apiPut(`/lignees/${editingLignee.id}`, payload);
      } else {
        await apiPost(`/lignees`, { ...payload, familleId: parentFamilleId });
      }
      setOpenModalLignee(false);
      setEditingLignee(null);
      load();
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const deleteLignee = async (lignee) => {
    if (!confirm(`Voulez-vous vraiment supprimer la lignée "${lignee.nom}" ?`))
      return;
    try {
      await apiDelete(`/lignees/${lignee.id}`);
      if (selected?.id === lignee.id) setSelected(null);
      load();
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  // ----------------------------------------------------------
  // PANEL DÉTAILS
  // ----------------------------------------------------------
  const handleSelectLignee = async (ligneeId) => {
    try {
      const ligneeDetails = await apiGet(
        `/lignees/${ligneeId}?withRelations=true`
      );
      setSelected(ligneeDetails);
    } catch (error) {
      console.error("Erreur chargement détails lignée:", error);
    }
  };

  const handleSelectFamille = async (familleId) => {
    try {
      const familleDetails = await apiGet(
        `/familles/${familleId}?withRelations=true`
      );
      setSelected({ ...familleDetails, type: "famille" });
    } catch (error) {
      console.error("Erreur chargement détails famille:", error);
    }
  };

  // ----------------------------------------------------------
  // UTILITAIRES
  // ----------------------------------------------------------
  const resetFilters = () => {
    setSearch("");
    setFilterLignees("");
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Familles & Lignées
          </h1>
          <p className="text-sm text-gray-500">
            Gestion des grandes familles et de leurs lignées
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
            data={filteredFamilles.map((f) => ({
              Famille: f.nom,
              Description: f.description || "",
              "Nombre de lignées": f.lignees?.length || 0,
              Lignées: f.lignees?.map((l) => l.nom).join(", ") || "",
            }))}
            filename={`familles_${new Date().toISOString().split("T")[0]}`}
          />

          <button
            onClick={() => {
              setEditingFamille(null);
              setOpenModalFamille(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm font-medium"
          >
            <HomeIcon className="w-5 h-5" />
            Nouvelle famille
          </button>
        </div>
      </div>

      {/* STATISTIQUES */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Familles"
            value={stats.totalFamilles}
            icon={<HomeIcon className="w-6 h-6 text-gray-600" />}
            color="gray"
          />
          <StatsCard
            title="Lignées"
            value={stats.totalLignees}
            icon={<UserGroupIcon className="w-6 h-6 text-blue-600" />}
            color="blue"
          />
          <StatsCard
            title="Membres total"
            value={stats.totalMembres}
            icon={<UsersIcon className="w-6 h-6 text-emerald-600" />}
            color="emerald"
          />
          <StatsCard
            title="Familles sans lignées"
            value={stats.famillesSansLignees}
            icon={<ChartBarIcon className="w-6 h-6 text-amber-600" />}
            color="amber"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <input
                type="text"
                placeholder="Nom famille, lignée, description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de lignées
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterLignees}
                onChange={(e) => setFilterLignees(e.target.value)}
              >
                <option value="">Toutes les familles</option>
                <option value="0">Sans lignées</option>
                <option value="1-5">1 à 5 lignées</option>
                <option value="5+">Plus de 5 lignées</option>
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

      {/* LISTE DES FAMILLES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Chargement des familles...</p>
            </div>
          </div>
        ) : filteredFamilles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-8">
            <HomeIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune famille trouvée
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {familles.length === 0
                ? "Aucune famille n'a été créée pour le moment."
                : "Aucune famille ne correspond à vos critères de recherche."}
            </p>
            <button
              onClick={() => {
                setEditingFamille(null);
                setOpenModalFamille(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Créer la première famille
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredFamilles.map((famille) => {
              const isExpanded = isFamilleExpanded(famille.id);
              const nbLignees = famille.lignees?.length || 0;
              const nbMembres =
                famille.lignees?.reduce(
                  (total, lignee) => total + (lignee.membres?.length || 0),
                  0
                ) || 0;

              return (
                <div
                  key={famille.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* LIGNE FAMILLE */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleFamille(famille.id)}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </button>

                      <div className="flex-1">
                        <button
                          onClick={() => handleSelectFamille(famille.id)}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 text-left"
                        >
                          {famille.nom}
                        </button>
                        {famille.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {famille.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {nbLignees} lignée(s)
                        </div>
                        <div className="text-xs text-gray-500">
                          {nbMembres} membres
                        </div>
                      </div>

                      <ActionsInline
                        actions={[
                          {
                            label: "Voir",
                            icon: <InformationCircleIcon className="w-4 h-4" />,
                            onClick: () => handleSelectFamille(famille.id),
                            color: "blue",
                          },
                          {
                            label: "Modifier",
                            icon: <PencilSquareIcon className="w-4 h-4" />,
                            onClick: () => {
                              setEditingFamille(famille);
                              setOpenModalFamille(true);
                            },
                            color: "amber",
                          },
                          {
                            label: "Ajouter lignée",
                            icon: <PlusCircleIcon className="w-4 h-4" />,
                            onClick: () => {
                              setParentFamilleId(famille.id);
                              setEditingLignee(null);
                              setOpenModalLignee(true);
                            },
                            color: "green",
                          },
                          {
                            label: "Supprimer",
                            icon: <TrashIcon className="w-4 h-4" />,
                            onClick: () => deleteFamille(famille),
                            color: "red",
                            destructive: true,
                          },
                        ]}
                        compact
                      />
                    </div>
                  </div>

                  {/* SECTION LIGNÉES EXPANSIBLE */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-200 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">
                          Lignées de la famille{" "}
                          <span className="text-blue-600">{famille.nom}</span>
                        </h4>

                        <button
                          onClick={() => {
                            setParentFamilleId(famille.id);
                            setEditingLignee(null);
                            setOpenModalLignee(true);
                          }}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                        >
                          <PlusCircleIcon className="w-4 h-4" />
                          Ajouter une lignée
                        </button>
                      </div>

                      {nbLignees === 0 ? (
                        <div className="text-center py-8">
                          <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">
                            Cette famille n'a pas encore de lignées
                          </p>
                          <button
                            onClick={() => {
                              setParentFamilleId(famille.id);
                              setEditingLignee(null);
                              setOpenModalLignee(true);
                            }}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Créer la première lignée
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {famille.lignees.map((lignee) => (
                            <div
                              key={lignee.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <button
                                    onClick={() =>
                                      handleSelectLignee(lignee.id)
                                    }
                                    className="font-semibold text-gray-900 hover:text-blue-600 text-left"
                                  >
                                    {lignee.nom}
                                  </button>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {lignee.membres?.length || 0} membres
                                  </p>
                                </div>

                                <ActionsInline
                                  actions={[
                                    {
                                      label: "Voir",
                                      icon: (
                                        <InformationCircleIcon className="w-4 h-4" />
                                      ),
                                      onClick: () =>
                                        handleSelectLignee(lignee.id),
                                      color: "blue",
                                    },
                                    {
                                      label: "Modifier",
                                      icon: (
                                        <PencilSquareIcon className="w-4 h-4" />
                                      ),
                                      onClick: () => {
                                        setEditingLignee(lignee);
                                        setParentFamilleId(famille.id);
                                        setOpenModalLignee(true);
                                      },
                                      color: "amber",
                                    },
                                    {
                                      label: "Supprimer",
                                      icon: <TrashIcon className="w-4 h-4" />,
                                      onClick: () => deleteLignee(lignee),
                                      color: "red",
                                      destructive: true,
                                    },
                                  ]}
                                  compact
                                />
                              </div>

                              {lignee.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {lignee.description}
                                </p>
                              )}

                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-xs text-gray-500">
                                  Dernière mise à jour:{" "}
                                  {new Date().toLocaleDateString("fr-FR")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALES */}
      <Modal
        open={openModalFamille}
        onClose={() => setOpenModalFamille(false)}
        size="lg"
        title={editingFamille ? "Modifier la famille" : "Nouvelle famille"}
      >
        <FamilleForm
          initial={editingFamille}
          onSubmit={saveFamille}
          onCancel={() => setOpenModalFamille(false)}
        />
      </Modal>

      <Modal
        open={openModalLignee}
        onClose={() => setOpenModalLignee(false)}
        size="md"
        title={editingLignee ? "Modifier la lignée" : "Nouvelle lignée"}
      >
        <LigneeForm
          initial={editingLignee}
          familles={familles}
          parentFamilleId={parentFamilleId}
          onSubmit={saveLignee}
          onCancel={() => setOpenModalLignee(false)}
        />
      </Modal>

      {/* PANEL DÉTAILS */}
      <DetailsPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected ? (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                {selected.type === "famille" ? (
                  <HomeIcon className="w-6 h-6 text-blue-600" />
                ) : (
                  <UserGroupIcon className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {selected.type === "famille"
                    ? "Fiche famille"
                    : "Fiche lignée"}
                </h3>
                <p className="text-sm text-gray-500">{selected.nom}</p>
              </div>
            </div>
          ) : (
            ""
          )
        }
        stayOpenOnChange={true}
        width="520px"
        footer={
          selected && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (selected.type === "famille") {
                    setEditingFamille(selected);
                    setOpenModalFamille(true);
                  } else {
                    setEditingLignee(selected);
                    setParentFamilleId(selected.famille?.id);
                    setOpenModalLignee(true);
                  }
                  setSelected(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <PencilIcon className="w-4 h-4" />
                Modifier
              </button>
            </div>
          )
        }
      >
        {selected && <DetailContent selected={selected} />}
      </DetailsPanel>
    </div>
  );
}

// --------------------------------------------------
// CONTENU DU PANEL DÉTAILS
// --------------------------------------------------
function DetailContent({ selected }) {
  if (selected.type === "famille") {
    return <FamilleDetail selected={selected} />;
  }
  return <LigneeDetail selected={selected} />;
}

function FamilleDetail({ selected }) {
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const totalMembres =
    selected.lignees?.reduce(
      (total, lignee) => total + (lignee.membres?.length || 0),
      0
    ) || 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {selected.nom}
        </h2>
        {selected.description && (
          <p className="text-gray-600 bg-gray-50 p-4 rounded-lg mb-4">
            {selected.description}
          </p>
        )}
      </div>

      {/* Sections organisées */}
      <div className="space-y-4">
        <Section title="Statistiques">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {selected.lignees?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Lignées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {totalMembres}
                </div>
                <div className="text-xs text-gray-600">Membres total</div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Informations">
          <InfoRow
            label="Date de création"
            value={formatDate(selected.createdAt)}
          />
          <InfoRow
            label="Dernière mise à jour"
            value={formatDate(selected.updatedAt)}
          />
        </Section>

        {/* Liste des lignées */}
        {selected.lignees && selected.lignees.length > 0 && (
          <Section title="Lignées de la famille">
            <div className="space-y-3">
              {selected.lignees.map((lignee) => (
                <div
                  key={lignee.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">
                        {lignee.nom}
                      </div>
                      <div className="text-sm text-gray-500">
                        {lignee.membres?.length || 0} membres
                      </div>
                    </div>
                    <StatusBadge
                      status={lignee.actif ? "Active" : "Inactive"}
                      color={lignee.actif ? "green" : "gray"}
                      size="sm"
                    />
                  </div>
                  {lignee.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {lignee.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function LigneeDetail({ selected }) {
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {selected.nom}
        </h2>
        <div className="flex justify-center gap-2 mb-4">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Famille : {selected.famille?.nom || "—"}
          </div>
        </div>

        {selected.description && (
          <p className="text-gray-600 bg-gray-50 p-4 rounded-lg mb-4">
            {selected.description}
          </p>
        )}
      </div>

      {/* Sections organisées */}
      <div className="space-y-4">
        <Section title="Statistiques">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {selected.membres?.length || 0}
              </div>
              <div className="text-sm text-gray-600">
                Membres dans cette lignée
              </div>
            </div>
          </div>
        </Section>

        <Section title="Informations">
          <InfoRow
            label="Statut"
            value={selected.actif ? "Active" : "Inactive"}
          />
          <InfoRow
            label="Date de création"
            value={formatDate(selected.createdAt)}
          />
          <InfoRow
            label="Dernière mise à jour"
            value={formatDate(selected.updatedAt)}
          />
        </Section>

        {/* Liste des membres */}
        {selected.membres && selected.membres.length > 0 && (
          <Section title="Membres de la lignée">
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {selected.membres.map((membre) => (
                <div
                  key={membre.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">
                        {membre.nom} {membre.prenoms}
                      </div>
                      <div className="text-sm text-gray-500">
                        {membre.categorie?.label || "—"} • {membre.genre}
                      </div>
                    </div>
                    <StatusBadge
                      status={membre.statutMembre}
                      color={
                        membre.statutMembre === "Actif"
                          ? "green"
                          : membre.statutMembre === "Actif Exempté"
                          ? "blue"
                          : "gray"
                      }
                      size="sm"
                    />
                  </div>
                  {membre.contact && (
                    <div className="text-xs text-gray-500 mt-2">
                      📞 {membre.contact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------
// COMPOSANTS AUXILIAIRES
// --------------------------------------------------
function Section({ title, children }) {
  return (
    <div className="border-t pt-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <ChevronRightIcon className="w-4 h-4 text-blue-500" />
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || "—"}</span>
    </div>
  );
}