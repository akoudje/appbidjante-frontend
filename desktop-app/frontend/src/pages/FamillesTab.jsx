// frontend/src/pages/FamillesTab.jsx

import { useEffect, useState, useMemo } from "react";
import DataTable from "../components/DataTable";
import DetailsPanel from "../components/DetailsPanel";
import Modal from "../components/Modal";
import ActionsInline from "../components/ActionsInline";
import FamilleForm from "../components/FamilleForm";

import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api";

import {
  HiPlus,
  HiPencilSquare,
  HiInformationCircle,
} from "react-icons/hi2";
import { MdDelete } from "react-icons/md";

export default function FamillesTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState("");

  // Modales
  const [selected, setSelected] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // ----------------------------------
  // CHARGEMENT
  // ----------------------------------
  const load = async () => {
    try {
      setLoading(true);
      const data = await apiGet("/familles?withRelations=true");
      setRows(data);
    } catch (err) {
      console.error("Erreur chargement familles :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ----------------------------------
  // FILTRAGE
  // ----------------------------------
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((f) => {
      const txt = [
        f.nom,
        f.description,
        f.village,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return txt.includes(q);
    });
  }, [rows, search]);

  // ----------------------------------
  // CRUD
  // ----------------------------------
  const handleSave = async (payload) => {
    try {
      if (editing) {
        await apiPut(`/familles/${editing.id}`, payload);
      } else {
        await apiPost("/familles", payload);
      }

      setEditModal(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert("Erreur lors de la sauvegarde.");
      console.error(err);
    }
  };

  const handleDelete = async (row) => {
    if (!confirm(`Supprimer la grande famille "${row.nom}" ?`)) return;

    try {
      await apiDelete(`/familles/${row.id}`);
      if (selected?.id === row.id) setSelected(null);
      await load();
    } catch (err) {
      alert(
        "Impossible de supprimer cette famille (il existe peut-être des lignées ou membres liés)."
      );
      console.error(err);
    }
  };

  // ----------------------------------
  // EXPORTS
  // ----------------------------------
  const exportColumns = ["Nom", "Description", "Village", "Nombre de lignées"];

  const exportRows = filteredRows.map((f) => ({
    Nom: f.nom,
    Description: f.description || "",
    Village: f.village || "",
    "Nombre de lignées": f.lignees?.length ?? 0,
  }));

  // ----------------------------------
  // COLONNES TABLEAU
  // ----------------------------------
  const columns = [
    {
      header: "Nom",
      accessorKey: "nom",
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
      header: "Nombre de Lignées",
      cell: ({ row }) => row.original.lignees?.length ?? 0,
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
  // RENDU
  // ----------------------------------
  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Grandes familles</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditing(null);
              setEditModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            <HiPlus size={18} /> Ajouter
          </button>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Chargement…</p>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRows}
          onRowClick={(row) => setSelected(row)}
          getRowClassName={(row) =>
            row.id === selected?.id ? "bg-blue-50" : ""
          }
        />
      )}

      {/* Details PANEL DETAILS */}
      <DetailsPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        stayOpenOnChange={true}
        title="Détails de la famille"
        width="500px"
      >
        {selected && (
          <FamilleDetailPanel
            famille={selected}
            onEdit={() => {
              setEditing(selected);
              setEditModal(true);
            }}
            onDelete={() => handleDelete(selected)}
          />
        )}
      </DetailsPanel>

      {/* MODAL FORM */}
      <Modal open={editModal} onClose={() => setEditModal(false)}>
        <FamilleForm
          initial={editing}
          onSubmit={handleSave}
          onCancel={() => {
            setEditModal(false);
            setEditing(null);
          }}
        />
      </Modal>
    </div>
  );
}

// --------------------------------------------------
// PANEL DÉTAIL
// --------------------------------------------------
function FamilleDetailPanel({ famille, onEdit, onDelete }) {
  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-xl font-bold">{famille.nom}</h2>
      {/* Liste des lignées */}
      {Array.isArray(famille.lignees) && famille.lignees.length > 0 && (
        <div className="border rounded p-3 bg-gray-50 text-sm">
          <p className="font-semibold mb-1">Lignées associées</p>
          <ul className="list-disc ml-5 space-y-1">
            {famille.lignees.map((l) => (
              <li key={l.id}>{l.nom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onEdit}
          className="flex-1 bg-blue-600 text-white py-2 rounded"
        >
          Modifier
        </button>

        <button
          onClick={onDelete}
          className="flex-1 bg-red-50 text-red-700 border border-red-200 py-2 rounded"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
