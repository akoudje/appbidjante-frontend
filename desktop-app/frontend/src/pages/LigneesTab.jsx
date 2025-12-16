// frontend/src/pages/Lignees.jsx

import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import DetailsPanel from "../components/DetailsPanel";
import Modal from "../components/Modal";
import FilterBar from "../components/filters/FilterBar";
import ActionsInline from "../components/ActionsInline";
import LigneeForm from "../components/LigneeForm";
import ExportButton from "../components/filters/ExportButton";

import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api";

import {
  HiPlus,
  HiPencilSquare,
  HiInformationCircle,
} from "react-icons/hi2";
import { MdDelete } from "react-icons/md";

export default function Lignees() {
  const [rows, setRows] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterFamille, setFilterFamille] = useState("");
  const [filterMembres, setFilterMembres] = useState("");

  const [selected, setSelected] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // ----------------------------------
  // CHARGEMENT
  // ----------------------------------
  const load = async () => {
    try {
      setLoading(true);

      const data = await apiGet("/lignees?withRelations=true");
      const families = await apiGet("/familles");

      setRows(data);
      setFamilles(families);
    } catch (err) {
      console.error("Erreur chargement lignées :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ----------------------------------
  // OPTIONS FILTRES
  // ----------------------------------
  const familleOptions = familles.map((f) => f.nom);
  const membresOptions = ["0", "1-10", "10+"];

  // ----------------------------------
  // FILTRAGE
  // ----------------------------------
  const filteredRows = useMemo(() => {
    let list = [...rows];

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((l) => l.nom.toLowerCase().includes(s));
    }

    if (filterFamille) {
      list = list.filter((l) => l.famille?.nom === filterFamille);
    }

    if (filterMembres === "0") list = list.filter((l) => l.membres.length === 0);
    if (filterMembres === "1-10")
      list = list.filter((l) => l.membres.length >= 1 && l.membres.length <= 10);
    if (filterMembres === "10+") list = list.filter((l) => l.membres.length > 10);

    return list;
  }, [rows, search, filterFamille, filterMembres]);

  // ----------------------------------
  // CRUD
  // ----------------------------------
  const handleSave = async (payload) => {
    if (editing) {
      await apiPut(`/lignees/${editing.id}`, payload);
    } else {
      await apiPost("/lignees", payload);
    }

    setOpenModal(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!confirm(`Supprimer la lignée "${row.nom}" ?`)) return;

    try {
      await apiDelete(`/lignees/${row.id}`);
      if (selected?.id === row.id) setSelected(null);
      load();
    } catch (err) {
      alert("Impossible de supprimer la lignée : " + err.message);
    }
  };

  // ----------------------------------
  // TABLE COLUMNS
  // ----------------------------------
  const columns = [
    {
      header: "Lignée",
      accessorKey: "nom",
      size: 240,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <button
            onClick={() => setSelected(r)}
            className="text-blue-600 hover:underline"
          >
            {r.nom}
          </button>
        );
      },
    },
    {
      header: "Famille",
      size: 180,
      cell: (info) => info.row.original.famille?.nom || "—",
    },
    {
      header: "Membres",
      size: 120,
      cell: (info) => info.row.original.membres.length,
    },
    {
      header: "Actions",
      id: "actions",
      size: 140,
      cell: ({ row }) => {
        const m = row.original;
        return (
          <ActionsInline
            actions={[
              {
                label: "Voir détails",
                icon: <HiInformationCircle size={18} />,
                onClick: () => setSelected(m),
              },
              {
                label: "Modifier",
                icon: <HiPencilSquare size={18} />,
                onClick: () => {
                  setEditing(m);
                  setOpenModal(true);
                },
              },
              {
                label: "Supprimer",
                icon: <MdDelete size={18} className="text-red-600" />,
                onClick: () => handleDelete(m),
              },
            ]}
          />
        );
      },
    },
  ];

  // ----------------------------------
  // RENDER
  // ----------------------------------
  return (
    <div className="space-y-4 w-full">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lignées</h1>

        <div className="flex gap-2 items-center">
          <ExportButton
            data={filteredRows}
            columns={columns}
            filename="lignees"
          />

          <button
            onClick={() => {
              setEditing(null);
              setOpenModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            <HiPlus size={18} /> Ajouter
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <FilterBar
        searchValue={search}
        onSearch={setSearch}
        onReset={() => {
          setSearch("");
          setFilterFamille("");
          setFilterMembres("");
        }}
        filters={[
          {
            label: "Famille",
            value: filterFamille,
            onChange: setFilterFamille,
            options: familleOptions,
          },
          {
            label: "Membres",
            value: filterMembres,
            onChange: setFilterMembres,
            options: membresOptions,
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

      {/* SPLIT VIEW PANEL */}
      <DetailsPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        stayOpenOnChange={true}
        title="Détails de la lignée"
        width="520px"
      >
        {selected && <LigneeDetail selected={selected} />}
      </DetailsPanel>

      {/* MODAL FORM */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <LigneeForm
          initial={editing}
          familles={familles}
          onSubmit={handleSave}
          onCancel={() => setOpenModal(false)}
        />
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------
// DETAIL PANEL
// ------------------------------------------------------------
function LigneeDetail({ selected }) {
  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-xl font-bold">{selected.nom}</h2>

      <div className="bg-gray-50 border rounded p-3 space-y-1">
        <p>
          <strong>Famille :</strong> {selected.famille?.nom || "—"}
        </p>
        <p>
          <strong>Nombre de membres :</strong> {selected.membres.length}
        </p>
      </div>

      <h3 className="font-semibold">Membres de la lignée</h3>

      <div className="max-h-64 overflow-auto pr-1 space-y-1">
        {selected.membres.map((m) => (
          <div key={m.id} className="p-2 border rounded bg-white shadow-sm">
            {m.nom} {m.prenoms}
          </div>
        ))}
      </div>
    </div>
  );
}
