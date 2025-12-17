import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../utils/api";

import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import DetailsPanel from "../components/DetailsPanel";
import ExportButton from "../components/filters/ExportButton";
import StatusBadge from "../components/StatusBadge";

import {
  PlusCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  ArchiveBoxIcon,
  PaperAirplaneIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

import CommuniqueForm from "../components/communiques/CommuniqueForm";
import CommuniqueDetailPanel from "../components/communiques/CommuniqueDetailPanel";

export default function Communiques() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);

  const [filters, setFilters] = useState({
    statut: "",
    type: "",
  });

  // FORM (create / edit)
  const [openForm, setOpenForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  // VIEW (details panel)
  const [selectedView, setSelectedView] = useState(null);

  /* =========================
     LOAD
  ========================== */
  const loadData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(filters).toString();
      const res = await apiGet(`/communiques?${q}`);
      setData(res);
    } catch (err) {
      console.error("Erreur chargement communiqués", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  /* =========================
     ACTIONS
  ========================== */
  const publier = async (row) => {
    if (!row.canaux || row.canaux.length === 0) {
      alert("Veuillez sélectionner au moins un canal de diffusion.");
      return;
    }

    const message = `
Vous êtes sur le point de PUBLIER ce communiqué.

Titre : ${row.titre}
Type : ${row.type}
Canaux : ${row.canaux.join(", ")}

⚠️ Cette action déclenchera la diffusion immédiate.
Souhaitez-vous continuer ?
`;

    if (!confirm(message)) return;

    try {
      await apiPost(`/communiques/${row.id}/publier`);
      toast.success("Communiqué publié et diffusé");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.error ||
          "Erreur lors de la publication du communiqué"
      );
    }
  };

  const archiver = async (row) => {
    if (!confirm("Archiver ce communiqué ?")) return;
    await apiPost(`/communiques/${row.id}/archiver`);
    loadData();
  };

  const rediffuser = async (id) => {
    if (!confirm("Rediffuser ce communiqué ?")) return;
    await apiPost(`/communiques/${id}/rediffuser`);
    loadData();
  };

  /* =========================
     TABLE
  ========================== */
  const columns = useMemo(
    () => [
      {
        header: "Titre",
        accessorKey: "titre",
      },
      {
        header: "Type",
        accessorKey: "type",
      },
      {
        header: "Canaux",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.canaux?.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 text-xs rounded bg-slate-100 border"
              >
                {c}
              </span>
            ))}
          </div>
        ),
      },
      {
        header: "Statut",
        accessorKey: "statut",
        cell: ({ value }) => (
          <StatusBadge
            value={value}
            colors={{
              BROUILLON: "gray",
              PUBLIE: "green",
              ARCHIVE: "red",
            }}
          />
        ),
      },
      {
        header: "Créé le",
        accessorKey: "createdAt",
        cell: ({ value }) => new Date(value).toLocaleDateString("fr-FR"),
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex gap-2">
              {/* VOIR */}
              <button
                title="Voir"
                className="btn-icon"
                onClick={() => setSelectedView(r)}
              >
                <EyeIcon className="w-5 h-5" />
              </button>

              {/* EDIT / PUBLISH */}
              {r.statut === "BROUILLON" && (
                <>
                  <button
                    title="Modifier"
                    className="btn-icon"
                    onClick={() => {
                      setSelectedForm(r);
                      setOpenForm(true);
                    }}
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>

                  <button
                    disabled={publishingId === r.id}
                    onClick={async () => {
                      setPublishingId(r.id);
                      await publier(r);
                      setPublishingId(null);
                    }}
                  >
                    {publishingId === r.id ? (
                      "Publication..."
                    ) : (
                      <PaperAirplaneIcon />
                    )}
                  </button>
                </>
              )}

              {/* ARCHIVE */}
              {r.statut === "PUBLIE" && (
                <button
                  title="Archiver"
                  className="btn-icon text-red-600"
                  onClick={() => archiver(r)}
                >
                  <ArchiveBoxIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">📢 Avis & Communiqués</h1>

        <div className="flex gap-2">
          <ExportButton data={data} fileName="communiques" />
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => {
              setSelectedForm(null);
              setOpenForm(true);
            }}
          >
            <PlusCircleIcon className="w-5 h-5" />
            Nouveau
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 items-center bg-white p-3 rounded border">
        <FunnelIcon className="w-5 h-5 text-gray-500" />

        <select
          className="input"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">Tous les types</option>
          <option value="GRIOT">Griot</option>
          <option value="REUNION">Réunion</option>
          <option value="CONVOCATION">Convocation</option>
          <option value="DECES">Décès</option>
          <option value="COTISATION">Cotisation</option>
          <option value="GENERAL">Général</option>
        </select>

        <select
          className="input"
          value={filters.statut}
          onChange={(e) =>
            setFilters((f) => ({ ...f, statut: e.target.value }))
          }
        >
          <option value="">Tous les statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="PUBLIE">Publié</option>
          <option value="ARCHIVE">Archivé</option>
        </select>
      </div>

      {/* TABLE */}
      <DataTable columns={columns} data={data} loading={loading} />

      {/* FORM MODAL */}
      <Modal
        open={openForm}
        title={selectedForm ? "Modifier le communiqué" : "Nouveau communiqué"}
        onClose={() => setOpenForm(false)}
      >
        <CommuniqueForm
          initialData={selectedForm}
          onSuccess={() => {
            setOpenForm(false);
            loadData();
          }}
          onCancel={() => setOpenForm(false)}
        />
      </Modal>

      {/* DETAILS PANEL */}
      <DetailsPanel
        open={!!selectedView}
        onClose={() => setSelectedView(null)}
        title={selectedView?.titre}
        subtitle={`Type : ${selectedView?.type}`}
        width="620px"
        actions={
          selectedView?.statut === "PUBLIE" && (
            <button
              onClick={() => rediffuser(selectedView.id)}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              🔁 Rediffuser
            </button>
          )
        }
      >
        {selectedView && <CommuniqueDetailPanel communique={selectedView} />}
      </DetailsPanel>
    </div>
  );
}
