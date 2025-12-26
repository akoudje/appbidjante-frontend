// frontend/src/pages/Membres.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import DetailsPanel from "../components/DetailsPanel";
import Modal from "../components/Modal";
import StatsCard from "../components/StatsCard";
import QuickActions from "../components/QuickActions";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api";
import MembreForm from "../components/MembreForm";
import BulkActionsModal from "../components/BulkActionsModal";
import ExportButton from "../components/filters/ExportButton";

import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  UserGroupIcon,
  UserPlusIcon,
  ChartBarIcon,
  FunnelIcon,
  XCircleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ClockIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { ChevronRightIcon, PencilIcon } from "@heroicons/react/24/outline";
import Photo from "../components/Photo";

import ActionsInline from "../components/ActionsInline";

const API_BASE = "http://localhost:4000";

const getPhotoUrl = (p) => {
  // Vérification complète des valeurs null/undefined
  if (
    !p ||
    p === "null" ||
    p === "undefined" ||
    p === "NULL" ||
    p === "UNDEFINED"
  ) {
    return `${API_BASE}/uploads/default.png`;
  }

  // Si c'est déjà une URL complète
  if (p.startsWith("http://") || p.startsWith("https://")) {
    return p;
  }

  // Nettoyer le chemin
  let cleanPath = p;

  // Enlever le début de l'URL de base si présent
  cleanPath = cleanPath.replace(API_BASE, "");

  // S'assurer qu'il commence par un slash
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  // S'assurer que c'est bien dans le dossier uploads
  if (!cleanPath.startsWith("/uploads/")) {
    cleanPath = `/uploads${cleanPath}`;
  }

  return `${API_BASE}${cleanPath}`;
};

// Composant de vignette membre pour réutilisation - VERSION CORRIGÉE
const MemberThumbnail = ({ member, onClick, size = "md" }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-40 h-40",
  };

  // Vérification de sécurité pour éviter les erreurs
  if (!member) {
    return (
      <div
        className={`${sizes[size]} rounded-full bg-gray-200 flex items-center justify-center`}
      >
        <UserIcon className="w-1/2 h-1/2 text-gray-400" />
      </div>
    );
  }

  const photoUrl = getPhotoUrl(member.photo);

  return (
    <div className="flex items-center gap-3 cursor-pointer" onClick={onClick}>
      <div
        className={`relative ${sizes[size]} rounded-full overflow-hidden shadow-sm border-2 border-white`}
      >
        <img
          src={photoUrl}
          className="w-full h-full object-cover"
          alt={`${member.nom} ${member.prenoms}`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `${API_BASE}/uploads/default.png`;
          }}
        />
        {/* Indicateur de statut */}
        {member.statutMembre === "Décédé" && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
        )}
      </div>
    </div>
  );
};

// Composants helper pour DetailsPanel
const Section = ({ title, children }) => (
  <div className="border-t border-gray-200 pt-4 first:border-t-0 first:pt-0">
    <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">
      {value || "—"}
    </span>
  </div>
);

export default function Membres() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedSolde, setSelectedSolde] = useState(null);
  const [editing, setEditing] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [openBulkActions, setOpenBulkActions] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loadingSolde, setLoadingSolde] = useState(false);
  const [soldes, setSoldes] = useState({}); // Stocke les soldes de tous les membres
  const [deleting, setDeleting] = useState(false); // État pour le chargement lors de la suppression
  const [confirmName, setConfirmName] = useState("");

  // Filtres
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");
  const [filterGeneration, setFilterGeneration] = useState("");
  const [filterStatutMembre, setFilterStatutMembre] = useState("");
  const [filterLignee, setFilterLignee] = useState("");
  const [filterFamille, setFilterFamille] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    femmes: 0,
    hommes: 0,
    exemptes: 0,
  });

  // Chargement des membres
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet("/membres");
      setRows(data);

      // Calcul des stats
      const stats = {
        total: data.length,
        actifs: data.filter((m) => m.statutMembre === "Actif").length,
        exemptes: data.filter((m) => m.statutMembre === "Actif Exempté").length,
        femmes: data.filter((m) => m.genre === "Femme").length,
        hommes: data.filter((m) => m.genre === "Homme").length,
      };
      setStats(stats);

      // Charger les soldes pour tous les membres
      loadAllSoldes(data);
    } catch (err) {
      console.error("Erreur chargement membres:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement du solde d'un membre sélectionné
  const loadSoldeMembre = useCallback(async (membreId) => {
    if (!membreId) {
      setSelectedSolde(null);
      return;
    }

    setLoadingSolde(true);
    try {
      const solde = await apiGet(`/soldes/${membreId}`);
      setSelectedSolde(solde);
    } catch (err) {
      console.error("Erreur chargement solde:", err);
      setSelectedSolde(null);
    } finally {
      setLoadingSolde(false);
    }
  }, []);

  // Charger les soldes pour tous les membres
  const loadAllSoldes = async (membres) => {
    try {
      const soldesPromises = membres.map(async (membre) => {
        try {
          const solde = await apiGet(`/soldes/${membre.id}`);
          return { membreId: membre.id, solde };
        } catch (err) {
          return { membreId: membre.id, solde: null };
        }
      });

      const soldesResults = await Promise.all(soldesPromises);
      const soldesMap = {};
      soldesResults.forEach((result) => {
        soldesMap[result.membreId] = result.solde;
      });
      setSoldes(soldesMap);
    } catch (err) {
      console.error("Erreur chargement des soldes:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quand un membre est sélectionné, charger son solde
  useEffect(() => {
    if (selected?.id) {
      loadSoldeMembre(selected.id);
    } else {
      setSelectedSolde(null);
    }
  }, [selected, loadSoldeMembre]);

  // Extraire options uniques pour filtres
  const filterOptions = useMemo(() => {
    const lignees = [
      ...new Set(rows.map((m) => m.lignee?.nom || "").filter(Boolean)),
    ].sort();
    const familles = [
      ...new Set(rows.map((m) => m.lignee?.famille?.nom || "").filter(Boolean)),
    ].sort();
    const categories = [
      ...new Set(rows.map((m) => m.categorie?.label || "Sans catégorie")),
    ].sort();
    const generations = [
      ...new Set(rows.map((m) => m.categorie?.generation || "Non spécifiée")),
    ].sort();

    return { lignees, familles, categories, generations };
  }, [rows]);

  // Filtrage amélioré
  const filteredRows = useMemo(() => {
    return rows.filter((m) => {
      const term = search.toLowerCase();
      const fulltext = `${m.nom} ${m.prenoms} ${m.categorie?.label || ""} ${
        m.lignee?.nom || ""
      } ${m.lignee?.famille?.nom || ""}`.toLowerCase();

      if (term && !fulltext.includes(term)) return false;
      if (filterGenre && m.genre !== filterGenre) return false;
      if (
        filterCategorie &&
        (m.categorie?.label || "Sans catégorie") !== filterCategorie
      )
        return false;
      if (
        filterGeneration &&
        (m.categorie?.generation || "Non spécifiée") !== filterGeneration
      )
        return false;
      if (filterStatutMembre && m.statutMembre !== filterStatutMembre)
        return false;
      if (filterLignee && m.lignee?.nom !== filterLignee) return false;
      if (filterFamille && m.lignee?.famille?.nom !== filterFamille)
        return false;

      return true;
    });
  }, [
    rows,
    search,
    filterGenre,
    filterCategorie,
    filterGeneration,
    filterStatutMembre,
    filterLignee,
    filterFamille,
  ]);

  // Gestion sélection multiple
  const handleRowSelection = (rowIds) => {
    setSelectedRows(rowIds);
  };

  // Fonction pour déterminer le statut de cotisation
  const getStatutCotisation = (solde) => {
    if (!solde)
      return { label: "Inconnu", color: "gray", icon: ExclamationCircleIcon };

    const montant = solde.solde || 0;

    if (montant === 0) {
      return {
        label: "À jour",
        color: "green",
        icon: CheckCircleIcon,
        description: "Toutes les cotisations sont payées",
      };
    } else if (montant > 0) {
      return {
        label: "En retard",
        color: "red",
        icon: ClockIcon,
        description: `Dette de ${montant.toLocaleString()} FCFA`,
      };
    } else {
      return {
        label: "En avance",
        color: "blue",
        icon: CurrencyDollarIcon,
        description: `Avance de ${Math.abs(montant).toLocaleString()} FCFA`,
      };
    }
  };

  // Fonction pour naviguer vers la page paiement
  const handleGoToPaiement = (membre) => {
    if (membre) {
      navigate("/paiements", {
        state: {
          membrePreSelectionne: membre,
          categoriePreSelectionnee: membre.categorieId,
          etapeInitiale: 3, // Commencer à l'étape des cotisations
        },
      });
    }
  };

  // Fonction pour ouvrir le modal de suppression
  const handleOpenDelete = (membre) => {
    setMemberToDelete(membre);
    setOpenDeleteConfirm(true);
  };

  // Fonction pour confirmer la suppression
  const handleConfirmDelete = async () => {
    if (
      !memberToDelete ||
      confirmName !== `${memberToDelete.nom} ${memberToDelete.prenoms}`
    ) {
      alert(
        "Veuillez saisir correctement le nom du membre pour confirmer la suppression."
      );
      return;
    }

    setDeleting(true);
    try {
      // Vérifier si le membre est chef de lignée
      if (memberToDelete.lignee?.chef?.id === memberToDelete.id) {
        if (
          !window.confirm(
            `⚠️ ATTENTION : Ce membre est chef de la lignée "${memberToDelete.lignee.nom}".\n\n` +
              `La suppression désignera automatiquement le plus ancien membre actif comme nouveau chef.\n\n` +
              `Continuer la suppression ?`
          )
        ) {
          setDeleting(false);
          return;
        }
      }

      await apiDelete(`/membres/${memberToDelete.id}`);

      // Mettre à jour l'état local
      const updatedRows = rows.filter((m) => m.id !== memberToDelete.id);
      setRows(updatedRows);

      // Afficher un toast de succès (vous pouvez utiliser une librairie de toast)
      alert(
        `✅ Membre ${memberToDelete.nom} ${memberToDelete.prenoms} supprimé avec succès !`
      );

      // Fermer le modal et réinitialiser
      setOpenDeleteConfirm(false);
      setMemberToDelete(null);
      setConfirmName("");

      // Si le membre supprimé était sélectionné, désélectionner
      if (selected?.id === memberToDelete.id) {
        setSelected(null);
        setSelectedSolde(null);
      }

      // Recharger les données
      loadData();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(
        `❌ Erreur lors de la suppression : ${
          error.message || "Veuillez réessayer"
        }`
      );
    } finally {
      setDeleting(false);
    }
  };

  // Fonction pour annuler la suppression
  const handleCancelDelete = () => {
    setOpenDeleteConfirm(false);
    setMemberToDelete(null);
  };

  // Colonnes améliorées
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      size: 50,
      exportable: false,
    },
    {
      header: "Photo",
      accessorKey: "photo",
      size: 70,
// Dans la cellule de la colonne Photo, ajoutez un log
cell: (info) => {
  const member = info.row.original;
  console.log("Photo debug:", {
    member: `${member.nom} ${member.prenoms}`,
    photo: member.photo,
    computedUrl: getPhotoUrl(member.photo)
  });
  return (
    <MemberThumbnail
      member={member}
      onClick={() => setSelected(member)}
      size="md"
    />
  );
},
      exportable: false,
    },
    {
      header: "Nom & Prénoms",
      accessorKey: "nom",
      id: "nom_prenoms",
      size: 200,
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex flex-col">
            <button
              className="text-blue-600 hover:underline font-medium text-left"
              onClick={() => setSelected(m)}
            >
              {m.nom} {m.prenoms}
            </button>
            {(m.contact1 || m.contact2) && (
              <div className="text-xs text-gray-500 mt-1">
                {m.contact1}
                {m.contact2 && ` / ${m.contact2}`}
              </div>
            )}
          </div>
        );
      },
      exportValue: (row) => `${row.nom} ${row.prenoms}`,
    },
    {
      header: "Genre",
      accessorKey: "genre",
      size: 80,
      cell: (info) => {
        const genre = info.getValue();
        return (
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              genre === "Femme"
                ? "bg-pink-100 text-pink-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {genre}
          </div>
        );
      },
    },
    {
      header: "Âge/Catégorie",
      accessorKey: "categorie.label",
      id: "age_categorie",
      size: 180,
      cell: ({ row }) => {
        const m = row.original;
        const age = m.dateNaissance
          ? Math.floor(
              (new Date() - new Date(m.dateNaissance)) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;

        const generation = m.categorie?.generation
          ? ` (${m.categorie.generation})`
          : "";

        return (
          <div className="flex flex-col">
            <div className="font-medium">
              {m.categorie?.label || "Sans catégorie"}
              {generation}
            </div>
            <div className="flex gap-2 text-xs text-gray-500">
              {age && <span>{age} ans</span>}
              {/* {m.categorie?.classe && <span>• {m.categorie.classe}</span>} */}
            </div>
          </div>
        );
      },
      exportValue: (row) => {
        const age = row.dateNaissance
          ? Math.floor(
              (new Date() - new Date(row.dateNaissance)) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;
        return `${row.categorie?.label || "Sans catégorie"}${
          age ? ` - ${age} ans` : ""
        }`;
      },
    },
    {
      header: "Statut membre",
      accessorKey: "statutMembre",
      size: 130,
      cell: (info) => {
        const s = info.getValue() || "Actif";
        const colorClasses = {
          Actif: "bg-green-100 text-green-800",
          "Actif Exempté": "bg-blue-100 text-blue-800",
          Exempté: "bg-yellow-100 text-yellow-800",
          Décédé: "bg-red-100 text-red-800",
          "Non actif": "bg-gray-100 text-gray-800",
          Sorti: "bg-gray-100 text-gray-800",
          "Sans statut": "bg-gray-100 text-gray-800",
        };

        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              colorClasses[s] || "bg-gray-100 text-gray-800"
            }`}
          >
            {s}
          </span>
        );
      },
    },
    {
      header: "Contributions",
      id: "statut_cotisations",
      size: 150,
      cell: ({ row }) => {
        const m = row.original;
        const solde = soldes[m.id];
        const statut = getStatutCotisation(solde);
        const Icon = statut.icon;
        const montant = solde?.solde || 0;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Icon
                className={`w-4 h-4 ${
                  statut.color === "green"
                    ? "text-green-500"
                    : statut.color === "red"
                    ? "text-red-500"
                    : statut.color === "blue"
                    ? "text-blue-500"
                    : "text-gray-500"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  statut.color === "green"
                    ? "text-green-700"
                    : statut.color === "red"
                    ? "text-red-700"
                    : statut.color === "blue"
                    ? "text-blue-700"
                    : "text-gray-700"
                }`}
              >
                {statut.label}
              </span>
            </div>
            {/*             <div className={`text-sm font-bold ${
              montant === 0 ? 'text-gray-700' :
              montant > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {montant.toLocaleString()} FCFA
            </div> */}
            {solde?.cotisationsImpayees &&
              solde.cotisationsImpayees.length > 0 && (
                <div className="text-xs text-amber-600">
                  {solde.cotisationsImpayees.length} impayé(s)
                </div>
              )}
          </div>
        );
      },
      exportValue: (row) => {
        const solde = soldes[row.id];
        const montant = solde?.solde || 0;
        const statut = getStatutCotisation(solde);
        return `${statut.label} - ${montant.toLocaleString()} FCFA`;
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
              setOpenModal(true);
            },
            color: "amber",
          },
          {
            label: "Payer",
            icon: <BanknotesIcon className="w-4 h-4" />,
            onClick: () => handleGoToPaiement(m),
            color: "green",
          },
          {
            label: "Supprimer",
            icon: <TrashIcon className="w-4 h-4" />,
            onClick: () => handleOpenDelete(m),
            color: "red",
            destructive: true,
          },
        ];

        return <ActionsInline actions={actions} compact />;
      },
      exportable: false,
    },
  ];

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await apiPut(`/membres/${editing.id}`, payload);
      } else {
        await apiPost(`/membres`, payload);
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
    setFilterGenre("");
    setFilterCategorie("");
    setFilterGeneration("");
    setFilterStatutMembre("");
    setFilterLignee("");
    setFilterFamille("");
  };

  const handleBulkAction = async (action, selectedIds) => {
    console.log(`Action: ${action} sur ${selectedIds.length} membres`);
    setOpenBulkActions(false);
    loadData();
  };

  // Filtrer les colonnes pour l'export
  const exportColumns = useMemo(() => {
    return columns.filter(
      (col) =>
        col.exportable !== false &&
        col.header !== "Photo" &&
        col.header !== "Actions" &&
        col.id !== "select"
    );
  }, [columns]);

  // Stats sur les cotisations
  const cotisationsStats = useMemo(() => {
    let totalDette = 0;
    let aJour = 0;
    let enRetard = 0;
    let enAvance = 0;

    Object.values(soldes).forEach((solde) => {
      const montant = solde?.solde || 0;
      if (montant === 0) aJour++;
      else if (montant > 0) {
        enRetard++;
        totalDette += montant;
      } else enAvance++;
    });

    return { totalDette, aJour, enRetard, enAvance };
  }, [soldes]);

  return (
    <div className="space-y-6">
      {/* HEADER avec stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des membres
          </h1>
          <p className="text-sm text-gray-500">
            {stats.total} membres enregistrés · {stats.actifs} actifs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <button
              onClick={() => setOpenBulkActions(true)}
              className="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 flex items-center gap-2"
            >
              <UserGroupIcon className="w-4 h-4" />
              {selectedRows.length} sélectionné(s)
            </button>
          )}

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
            data={filteredRows}
            columns={exportColumns}
            filename={`membres_${new Date().toISOString().split("T")[0]}`}
          />

          <button
            onClick={() => {
              setEditing(null);
              setOpenModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm font-medium"
          >
            <UserPlusIcon className="w-5 h-5" />
            Nouveau membre
          </button>
        </div>
      </div>

      {/* STATS RAPIDES - Incluant stats cotisations */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatsCard
            title="Total"
            value={stats.total}
            icon={<UserGroupIcon className="w-6 h-6 text-gray-600" />}
            trend={"+5%"}
            color="gray"
          />
          <StatsCard
            title="Actifs"
            value={stats.actifs}
            icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />}
            percent={Math.round((stats.actifs / stats.total) * 100)}
            color="green"
          />
          <StatsCard
            title="À jour"
            value={cotisationsStats.aJour}
            icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />}
            percent={Math.round((cotisationsStats.aJour / stats.total) * 100)}
            color="green"
          />
          <StatsCard
            title="En retard"
            value={cotisationsStats.enRetard}
            icon={<ClockIcon className="w-6 h-6 text-red-600" />}
            percent={Math.round(
              (cotisationsStats.enRetard / stats.total) * 100
            )}
            color="red"
          />
          <StatsCard
            title="Dette totale"
            value={`${(cotisationsStats.totalDette / 1000).toFixed(0)}K`}
            icon={<CurrencyDollarIcon className="w-6 h-6 text-amber-600" />}
            description={`${cotisationsStats.totalDette.toLocaleString()} FCFA`}
            color="amber"
          />
          <StatsCard
            title="Exemptés"
            value={stats.exemptes}
            icon={<ExclamationCircleIcon className="w-6 h-6 text-amber-600" />}
            percent={Math.round((stats.exemptes / stats.total) * 100)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <input
                type="text"
                placeholder="Nom, prénom, famille..."
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
                {filterOptions.familles.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
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
                {filterOptions.lignees.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
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
                <option value="">Toutes</option>
                <option value="Non spécifiée">Non spécifiée</option>
                {filterOptions.generations
                  .filter((g) => g !== "Non spécifiée")
                  .map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
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
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterCategorie}
                onChange={(e) => setFilterCategorie(e.target.value)}
              >
                <option value="">Toutes</option>
                <option value="Sans catégorie">Sans catégorie</option>
                {filterOptions.categories
                  .filter((c) => c !== "Sans catégorie")
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterStatutMembre}
                onChange={(e) => setFilterStatutMembre(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="Actif">Actif</option>
                <option value="Actif Exempté">Actif Exempté</option>
                <option value="Non actif">Non actif</option>
                <option value="Sorti">Sorti</option>
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
              <p className="text-gray-500">Chargement des membres...</p>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-8">
            <UserGroupIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun membre trouvé
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {rows.length === 0
                ? "Aucun membre n'a été enregistré pour le moment."
                : "Aucun membre ne correspond à vos critères de recherche."}
            </p>
            <button
              onClick={() => {
                setEditing(null);
                setOpenModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Ajouter le premier membre
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            onRowSelection={handleRowSelection}
            onRowClick={(row) => setSelected(row)}
            getRowClassName={(row) =>
              row.id === selected?.id
                ? "bg-blue-50 border-l-4 border-l-blue-500"
                : "hover:bg-gray-50"
            }
            pagination
            pageSize={20}
          />
        )}
      </div>

      {/* PANEL DETAILS */}
      <DetailsPanel
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setSelectedSolde(null);
        }}
        title={
          <div className="flex justify-center items-center gap-3 uppercase">
            Fiche de membre
          </div>
        }
        stayOpenOnChange={true}
        width="520px"
        footer={
          selected && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(selected);
                    setOpenModal(true);
                    setSelected(null);
                    setSelectedSolde(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  Modifier
                </button>

                <button
                  onClick={() => navigate(`/paiements?membre=${selected.id}`)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  Historique
                </button>
              </div>

              {/* BOUTON PAIEMENT */}
              <button
                onClick={() => handleGoToPaiement(selected)}
                className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  (selectedSolde?.solde || 0) > 0
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                <BanknotesIcon className="w-5 h-5" />
                {selectedSolde?.solde > 0 ? (
                  <span>
                    Payer la dette de{" "}
                    {(selectedSolde.solde || 0).toLocaleString()} FCFA
                  </span>
                ) : (
                  <span>Effectuer un paiement</span>
                )}
              </button>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            {/* Photo et info principale */}
            <div className="flex flex-col items-center text-center">
              <Photo
                src={selected.photo}
                alt={`${selected.nom} ${selected.prenoms}`}
                className="w-40 h-40 rounded-full object-cover shadow-lg border-4 border-white mb-4"
              />
              <h2 className="text-2xl font-bold text-gray-900">
                {selected.nom} {selected.prenoms}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selected.statutMembre === "Actif"
                      ? "bg-green-100 text-green-800"
                      : selected.statutMembre === "Actif Exempté"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {selected.statutMembre}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {selected.genre}
                </span>
              </div>
            </div>

            {/* Sections organisées */}
            <div className="space-y-4">
              <Section title="Informations personnelles">
                <InfoRow
                  label="Date de naissance"
                  value={
                    selected.dateNaissance
                      ? new Date(selected.dateNaissance).toLocaleDateString(
                          "fr-FR"
                        )
                      : "—"
                  }
                />
                <InfoRow label="Contact principal" value={selected.contact1} />
                <InfoRow label="Contact secondaire" value={selected.contact2} />
                <InfoRow label="Email" value={selected.email} />
              </Section>

              <Section title="Catégorie et famille">
                <InfoRow
                  label="Catégorie"
                  value={
                    <div>
                      <div className="font-medium">
                        {selected.categorie?.label || "Sans catégorie"}
                      </div>
                      {selected.categorie?.generation && (
                        <div className="text-sm text-gray-500">
                          {selected.categorie.generation}
                        </div>
                      )}
                    </div>
                  }
                />
                <InfoRow label="Lignée" value={selected.lignee?.nom} />
                <InfoRow
                  label="Famille"
                  value={selected.lignee?.famille?.nom}
                />
                {selected.lignee?.chef?.id === selected.id && (
                  <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded text-sm font-medium">
                    Chef de lignée
                  </div>
                )}
              </Section>

              <Section title="Statut de Contributions">
                {loadingSolde ? (
                  <div className="flex items-center justify-center py-4">
                    <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin mr-2" />
                    <span className="text-gray-600">
                      Chargement du solde...
                    </span>
                  </div>
                ) : selectedSolde ? (
                  <>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          Statut de contribution
                        </span>
                        {(() => {
                          const statut = getStatutCotisation(selectedSolde);
                          const Icon = statut.icon;
                          return (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                statut.color === "green"
                                  ? "bg-green-100 text-green-800"
                                  : statut.color === "red"
                                  ? "bg-red-100 text-red-800"
                                  : statut.color === "blue"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {statut.label}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-gray-500">
                        {getStatutCotisation(selectedSolde).description}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            (selectedSolde.solde || 0) === 0
                              ? "text-gray-700"
                              : (selectedSolde.solde || 0) > 0
                              ? "text-red-700"
                              : "text-green-700"
                          }`}
                        >
                          {(selectedSolde.solde || 0).toLocaleString()} FCFA
                        </div>
                        <div className="text-sm text-gray-600">
                          Solde actuel
                        </div>
                        {selectedSolde.cotisationsImpayees &&
                          selectedSolde.cotisationsImpayees.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {selectedSolde.cotisationsImpayees.length}{" "}
                              cotisation(s) en attente
                            </div>
                          )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <ExclamationCircleIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Aucune information de solde disponible</p>
                  </div>
                )}
              </Section>

              {selected.lieuResidence && (
                <Section title="Résidence">
                  <InfoRow label="Lieu" value={selected.lieuResidence} />
                  {selected.quartier && (
                    <InfoRow label="Quartier" value={selected.quartier} />
                  )}
                  {selected.ville && (
                    <InfoRow label="Ville" value={selected.ville} />
                  )}
                </Section>
              )}

              {selected.profession && (
                <Section title="Profession">
                  <InfoRow label="Profession" value={selected.profession} />
                  {selected.employeur && (
                    <InfoRow label="Employeur" value={selected.employeur} />
                  )}
                </Section>
              )}

              {selected.notes && (
                <Section title="Notes">
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                    {selected.notes}
                  </div>
                </Section>
              )}
            </div>
          </div>
        )}
      </DetailsPanel>

      {/* MODAL DE CONFIRMATION DE SUPPRESSION - CORRIGÉ */}

      <Modal
        open={openDeleteConfirm}
        onClose={handleCancelDelete}
        title="Confirmer la suppression"
        width="max-w-md"
        footer={
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancelDelete}
              disabled={deleting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={
                deleting ||
                confirmName !==
                  `${memberToDelete?.nom} ${memberToDelete?.prenoms}`
              }
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4" />
                  Supprimer définitivement
                </>
              )}
            </button>
          </div>
        }
      >
        {memberToDelete && (
          <div className="space-y-4">
            {/* En-tête avec photo et infos */}
            <div className="flex items-center gap-3">
              <MemberThumbnail member={memberToDelete} size="md" />
              <div>
                <h3 className="font-semibold">
                  {memberToDelete.nom} {memberToDelete.prenoms}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    {memberToDelete.categorie?.label || "Sans catégorie"}
                  </span>
                  {memberToDelete.lignee?.famille?.nom && (
                    <>
                      <span>•</span>
                      <span>{memberToDelete.lignee.famille.nom}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Alertes d'avertissement */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <ExclamationCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800 mb-2">
                    Action irréversible
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Supprime toutes les données du membre</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Efface l'historique complet des cotisations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Supprime les paiements associés</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Impacte les statistiques et rapports</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Alternative suggérée */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Alternative recommandée
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Pour conserver l'historique financier, marquez plutôt ce membre
                comme <strong>"Décédé"</strong> ou <strong>"Sorti"</strong>.
                <button
                  onClick={() => {
                    handleCancelDelete();
                    setSelected(memberToDelete);
                    setEditing(memberToDelete);
                    setOpenModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                >
                  Modifier le statut
                </button>
              </p>
            </div>

            {/* Confirmation par saisie */}
            <div className="border border-gray-300 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                <ExclamationTriangleIcon className="w-4 h-4 inline mr-1 text-amber-600" />
                Pour confirmer, tapez :{" "}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {memberToDelete.nom} {memberToDelete.prenoms}
                </span>
              </p>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="Collez le nom complet ici"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cette sécurité empêche les suppressions accidentelles.
              </p>
            </div>

            {/* Information sur les dépendances */}
            {memberToDelete.lignee?.chef?.id === memberToDelete.id && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Chef de lignée
                  </span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Ce membre est actuellement chef de la lignée "
                  {memberToDelete.lignee?.nom}". La suppression nécessitera de
                  désigner un nouveau chef.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL ÉDITION/CREATION MEMBRE */}
      <Modal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditing(null);
        }}
        title={editing ? "Modifier le membre" : "Nouveau membre"}
        width="max-w-2xl"
        footer={null
        }
      >
        <MembreForm
          initial={editing}
          onSubmit={handleSave}
          onCancel={() => {
            setOpenModal(false);
            setEditing(null);
          }}
        />
      </Modal>
    </div>
  );
}
