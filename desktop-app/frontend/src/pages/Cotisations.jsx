// frontend/src/pages/Cotisations.jsx

import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import DetailsPanel from "../components/DetailsPanel";
import Modal from "../components/Modal";
import ActionsInline from "../components/ActionsInline";

import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api";
import CotisationForm from "../components/CotisationForm";

import { HiPlus, HiPencilSquare, HiInformationCircle } from "react-icons/hi2";
import { MdDelete } from "react-icons/md";

import FilterBar from "../components/filters/FilterBar";
import ExportButton from "../components/filters/ExportButton";

import jsPDF from "jspdf";
import "jspdf-autotable";

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------
function computePaymentInfo(c) {
  const paiements = c.paiements || [];
  const totalPaye = paiements.reduce((s, p) => s + p.montant, 0);
  const reste = c.montant - totalPaye;

  let statut = "Impayé";
  if (totalPaye >= c.montant) statut = "Payé";
  else if (totalPaye > 0) statut = "Partiel";

  return { totalPaye, reste, statutCalcule: statut };
}

function getStatusDisplay(c) {
  const s = c.statutCotisation || computePaymentInfo(c).statutCalcule;

  const map = {
    Payé: "bg-green-100 text-green-700",
    Impayé: "bg-red-100 text-red-700",
    Partiel: "bg-orange-100 text-orange-700",
  };

  return {
    label: s,
    colorClass: map[s] || "bg-gray-100 text-gray-700",
  };
}

// ------------------------------------------------------
// PAGE
// ------------------------------------------------------
export default function Cotisations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filtres
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [year, setYear] = useState("");

  // ------------------------------------------------------
  // Charger
  // ------------------------------------------------------
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiGet("/cotisations?withRelations=true");
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // Options années
  // ------------------------------------------------------
  const yearsOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((c) => {
      if (c.date) set.add(new Date(c.date).getFullYear());
    });
    return [...set].sort((a, b) => b - a);
  }, [rows]);

  // ------------------------------------------------------
  // Filtrage
  // ------------------------------------------------------
  const filteredRows = useMemo(() => {
    const s = search.toLowerCase().trim();

    return rows.filter((c) => {
      const { statutCalcule } = computePaymentInfo(c);
      const status = c.statutCotisation || statutCalcule;

      // Filtre statut
      if (statut && statut !== status) return false;

      // Filtre année
      const y = c.date ? new Date(c.date).getFullYear() : null;
      if (year && y !== Number(year)) return false;

      // Recherche
      if (s) {
        const str = [
          c.membre?.nom,
          c.membre?.prenoms,
          c.motif,
          c.deces?.membre?.nom,
          c.deces?.membre?.prenoms,
        ]
          .join(" ")
          .toLowerCase();
        if (!str.includes(s)) return false;
      }

      return true;
    });
  }, [rows, search, statut, year]);

  // ------------------------------------------------------
  // Colonnes
  // ------------------------------------------------------
  const columns = useMemo(
    () => [
      {
        header: "Membre",
        size: 200,
        cell: ({ row }) => {
          const c = row.original;
          const m = c.membre;

          return (
            <button
              className="text-blue-600 hover:underline"
              onClick={() => setSelected(c)}
            >
              {m ? `${m.nom} ${m.prenoms}` : "—"}
            </button>
          );
        },
      },

      {
        header: "Motif de contributions",
        size: 200,
        cell: ({ row }) =>
          row.original.deces
            ? `Décès de ${row.original.deces.membre?.nom} ${row.original.deces.membre?.prenoms}`
            : row.original.motif || "—",
      },

      {
        header: "Date",
        accessorKey: "date",
        size: 100,
        cell: ({ getValue }) =>
          getValue()
            ? new Date(getValue()).toLocaleDateString("fr-FR")
            : "—",
      },

      {
        header: "Montant",
        accessorKey: "montant",
        size: 110,
        cell: (i) => `${i.getValue().toLocaleString("fr-FR")} FCFA`,
      },

      {
        header: "Payé",
        size: 110,
        cell: (i) =>
          `${computePaymentInfo(i.row.original).totalPaye.toLocaleString(
            "fr-FR"
          )} FCFA`,
      },

      {
        header: "Reste",
        size: 110,
        cell: (i) =>
          `${computePaymentInfo(i.row.original).reste.toLocaleString(
            "fr-FR"
          )} FCFA`,
      },

      {
        header: "Statut",
        size: 100,
        cell: ({ row }) => {
          const { label, colorClass } = getStatusDisplay(row.original);
          return (
            <span className={`px-2 py-1 rounded text-xs ${colorClass}`}>
              {label}
            </span>
          );
        },
      },

      {
        header: "Actions",
        id: "actions",
        size: 130,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <ActionsInline
              actions={[
                {
                  label: "Détails",
                  icon: <HiInformationCircle size={18} />,
                  onClick: () => setSelected(c),
                },
                {
                  label: "Modifier",
                  icon: <HiPencilSquare size={18} />,
                  onClick: () => {
                    setEditing(c);
                    setModalOpen(true);
                  },
                },
                {
                  label: "Supprimer",
                  icon: <MdDelete size={18} className="text-red-600" />,
                  onClick: () => handleDelete(c),
                },
              ]}
            />
          );
        },
      },
    ],
    []
  );

  // ------------------------------------------------------
  // Suppression
  // ------------------------------------------------------
  const handleDelete = async (row) => {
    if (!confirm("Supprimer cette cotisation ?")) return;

    await apiDelete(`/cotisations/${row.id}`);

    if (selected?.id === row.id) setSelected(null);
    await loadData();
  };

  // ------------------------------------------------------
  // Save
  // ------------------------------------------------------
  const handleSave = async (payload) => {
    if (editing) await apiPut(`/cotisations/${editing.id}`, payload);
    else await apiPost("/cotisations", payload);

    setEditing(null);
    setModalOpen(false);
    await loadData();
  };

  // ------------------------------------------------------
  // Export
  // ------------------------------------------------------
  const exportColumns = [
    "Membre",
    "Date",
    "Montant",
    "Payé",
    "Reste",
    "Statut",
    "Motif",
  ];

  const exportData = filteredRows.map((c) => ({
    Membre: c.membre ? `${c.membre.nom} ${c.membre.prenoms}` : "—",
    Date: c.date
      ? new Date(c.date).toLocaleDateString("fr-FR")
      : "—",
    Montant: c.montant,
    Payé: computePaymentInfo(c).totalPaye,
    Reste: computePaymentInfo(c).reste,
    Statut: c.statutCotisation || computePaymentInfo(c).statutCalcule,
    Motif: c.motif || "",
  }));

  // ------------------------------------------------------
  // Reset Filtres
  // ------------------------------------------------------
  const resetFilters = () => {
    setSearch("");
    setStatut("");
    setYear("");
  };

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------
  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contributions</h1>

        <div className="flex gap-2">
          <ExportButton
            filename="contributions"
            columns={exportColumns}
            data={exportData}
          />

          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            <HiPlus size={18} /> Ajouter
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <FilterBar
        searchValue={search}
        onSearch={setSearch}
        onReset={resetFilters}
        filters={[
          {
            label: "Statut",
            value: statut,
            onChange: setStatut,
            options: ["Payé", "Partiel", "Impayé"],
          },
          {
            label: "Année",
            value: year,
            onChange: setYear,
            options: yearsOptions,
          },
        ]}
      />

      {/* TABLE */}
      {loading ? (
        <p>Chargement…</p>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRows}
          onRowClick={() => {}}
          getRowClassName={(row) =>
            row.id === selected?.id ? "bg-blue-50" : ""
          }
        />
      )}

      {/* PANEL DETAIL */}
      <DetailsPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Détails de la cotisation"
        width="520px"
        stayOpenOnChange={true}
      >
        {selected && <CotisationDetailPanel cot={selected} />}
      </DetailsPanel>

      {/* MODAL FORM */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <CotisationForm
          initial={editing}
          onSubmit={handleSave}
          onCancel={() => {
            setEditing(null);
            setModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

// ------------------------------------------------------
// DETAILS PANEL
// ------------------------------------------------------
function CotisationDetailPanel({ cot }) {
  const m = cot.membre;
  const payment = computePaymentInfo(cot);

  return (
    <div className="space-y-4 text-sm">

      {/* Titre */}
      <h2 className="text-xl font-bold">
        {m ? `${m.nom} ${m.prenoms}` : "—"}
      </h2>

      {/* Infos principales */}
      <div className="grid grid-cols-2 gap-3">
        <Info label="Date" value={cot.date ? new Date(cot.date).toLocaleDateString("fr-FR") : "—"} />
        <Info label="Montant" value={`${cot.montant.toLocaleString("fr-FR")} FCFA`} />
        <Info label="Payé" value={`${payment.totalPaye.toLocaleString("fr-FR")} FCFA`} />
        <Info label="Reste" value={`${payment.reste.toLocaleString("fr-FR")} FCFA`} />
      </div>

      {/* Motif */}
      <Info label="Motif" value={cot.motif || "—"} />

      {/* Paiements */}
      <div className="p-3 bg-gray-50 border rounded space-y-2">
        <h3 className="font-semibold text-gray-600">Paiements</h3>

        {cot.paiements?.length > 0 ? (
          <ul className="space-y-1">
            {cot.paiements.map((p) => (
              <li key={p.id} className="text-sm">
                {new Date(p.date).toLocaleDateString("fr-FR")} —{" "}
                <strong>{p.montant.toLocaleString("fr-FR")} FCFA</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 italic">Aucun paiement enregistré</p>
        )}
      </div>

    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-gray-50 border rounded p-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-700">{value}</div>
    </div>
  );
}
