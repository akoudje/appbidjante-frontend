// src/pages/Communiques.jsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPreviewCommunique } from "../utils/api";
import { toast } from "sonner";

import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import DetailsPanel from "../components/DetailsPanel";
import ExportButton from "../components/filters/ExportButton";
import StatusBadgeTo from "../components/StatusBadgeTo";
import FilterBar from "../components/filters/FilterBar"; // <-- Ajouté

import {
  PlusCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  ArchiveBoxIcon,
  PaperAirplaneIcon,
  FunnelIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  ChartBarIcon, // <-- Ajouté pour le dashboard
  XMarkIcon, // <-- Ajouté pour le dashboard
} from "@heroicons/react/24/outline";

import CommuniqueForm from "../components/communiques/CommuniqueForm";
import CommuniqueDetailPanel from "../components/communiques/CommuniqueDetailPanel";
import CommuniqueDiffusionConfirm from "../components/communiques/CommuniqueDiffusionConfirm";

export default function Communiques() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [preview, setPreview] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const [previewEmailHtml, setPreviewEmailHtml] = useState(null);

  const [filters, setFilters] = useState({ statut: "", type: "", canal: "" });
  const [searchValue, setSearchValue] = useState(""); // Pour FilterBar
  const [showDashboard, setShowDashboard] = useState(true); // Pour contrôler l'affichage du dashboard

  // FORM
  const [openForm, setOpenForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  // VIEW
  const [selectedView, setSelectedView] = useState(null);

  /* =========================
     STATISTIQUES POUR LE DASHBOARD
  ========================== */
  const stats = useMemo(() => {
    return {
      total: data.length,
      brouillons: data.filter((d) => d.statut === "BROUILLON").length,
      publies: data.filter((d) => d.statut === "PUBLIE").length,
      archives: data.filter((d) => d.statut === "ARCHIVE").length,
    };
  }, [data]);

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
     PREVIEW + CONFIRM
  ========================== */
  const openDiffusionConfirm = async (row, action) => {
    try {
      setLoadingAction(true);
      const data = await apiPreviewCommunique(row.id);
      setPreview(data);
      setConfirmAction(action);
    } catch (e) {
      toast.error(
        e?.response?.data?.error || "Erreur lors du chargement du preview"
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const confirmDiffusion = async () => {
    if (!preview || !confirmAction) return;

    try {
      setLoadingAction(true);

      if (confirmAction === "publier") {
        await apiPost(`/communiques/${preview.id}/publier`);
        toast.success("Communiqué publié et diffusé");
      }

      if (confirmAction === "rediffuser") {
        await apiPost(`/communiques/${preview.id}/rediffuser`);
        toast.success("Communiqué rediffusé");
      }

      setPreview(null);
      setConfirmAction(null);
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Erreur lors de la diffusion");
    } finally {
      setLoadingAction(false);
    }
  };

  /* =========================
     AUTRES ACTIONS
  ========================== */
  const archiver = async (row) => {
    if (!confirm("Archiver ce communiqué ?")) return;
    await apiPost(`/communiques/${row.id}/archiver`);
    loadData();
  };

  const dupliquer = async (row) => {
    if (!confirm("Dupliquer ce communiqué ?")) return;
    try {
      await apiPost(`/communiques/${row.id}/dupliquer`);
      toast.success("Communiqué dupliqué");
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la duplication");
    }
  };

  const supprimer = async (row) => {
    if (!confirm("Supprimer ce communiqué ?")) return;
    try {
      await apiPost(`/communiques/${row.id}/supprimer`);
      toast.success("Communiqué supprimé");
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const normalizeStatut = (statut) => {
    if (!statut) return "BROUILLON";

    if (typeof statut === "string") {
      const s = statut.toUpperCase();
      if (["BROUILLON", "PUBLIE", "ARCHIVE"].includes(s)) {
        return s;
      }
    }

    return "BROUILLON";
  };

  /* =========================
     TABLE - Actions améliorées
  ========================== */
  const columns = useMemo(
    () => [
      { header: "Titre", accessorKey: "titre" },
      { header: "Type", accessorKey: "type" },
      {
        header: "Canaux",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.canaux?.map((c) => {
              // Mapping des couleurs par canal
              const canalColors = {
                EMAIL: "bg-blue-100 text-blue-800 border-blue-200",
                SMS: "bg-green-100 text-green-800 border-green-200",
                WHATSAPP: "bg-emerald-100 text-emerald-800 border-emerald-200",
                PUSH: "bg-purple-100 text-purple-800 border-purple-200",
              };

              return (
                <span
                  key={c}
                  className={`px-2 py-1 text-xs rounded-full ${
                    canalColors[c] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {c}
                </span>
              );
            })}
          </div>
        ),
      },
      {
        header: "Statut",
        cell: ({ row }) => (
          <StatusBadgeTo
            statut={normalizeStatut(row.original.statut)}
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
        cell: ({ row }) => {
          const v = row.original.createdAt;
          if (!v) return "—";
          const d = new Date(v);
          return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
        },
      },

      {
        header: "Actions",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex gap-1">
              {/* VOIR - Oeil bleu */}
              <button
                title="Voir le détail"
                className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                onClick={() => setSelectedView(r)}
              >
                <EyeIcon className="w-4 h-4" />
              </button>

              {/* DUPLIQUER - Pour tous les statuts */}
              <button
                title="Dupliquer"
                className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
                onClick={() => dupliquer(r)}
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </button>
              {/* Prévisualiser l'email avant de le diffuser */}
              <button
                title="Prévisualiser email"
                className="p-1.5 rounded hover:bg-slate-100"
                onClick={async () => {
                  const res = await apiGet(
                    `/communiques/${r.id}/preview-email`
                  );
                  setPreviewEmailHtml(res.html);
                }}
              >
                👁️
              </button>
              {/* Envoyer un email de test */}
              <button
                title="Envoyer email de test"
                className="p-1.5 rounded hover:bg-slate-100"
                onClick={async () => {
                  await apiPost(`/communiques/${r.id}/test-email`);
                  toast.success("Email de test envoyé");
                }}
              >
                ✉️
              </button>

              {/* EDIT - Seulement pour les brouillons */}
              {r.statut === "BROUILLON" && (
                <>
                  <button
                    title="Modifier"
                    className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600 transition-colors"
                    onClick={() => {
                      setSelectedForm(r);
                      setOpenForm(true);
                    }}
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>

                  <button
                    title="Publier"
                    className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                    onClick={() => openDiffusionConfirm(r, "publier")}
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </button>

                  <button
                    title="Supprimer"
                    className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                    onClick={() => supprimer(r)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* ARCHIVER - Seulement pour les publiés */}
              {r.statut === "PUBLIE" && (
                <button
                  title="Archiver"
                  className="p-1.5 rounded hover:bg-orange-50 text-orange-600 transition-colors"
                  onClick={() => archiver(r)}
                >
                  <ArchiveBoxIcon className="w-4 h-4" />
                </button>
              )}

              {/* RESTAURER - Seulement pour les archivés */}
              {r.statut === "ARCHIVE" && (
                <button
                  title="Restaurer"
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                  onClick={() => {
                    if (confirm("Restaurer ce communiqué ?")) {
                      apiPost(`/communiques/${r.id}/restaurer`);
                      toast.success("Communiqué restauré");
                      loadData();
                    }
                  }}
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
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
      {/* HEADER avec bouton pour masquer/afficher le dashboard */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">📢 Avis & Communiqués</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="w-5 h-5" />
            {showDashboard ? "Masquer stats" : "Afficher stats"}
          </button>

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

      {/* MINI DASHBOARD */}
      {showDashboard && (
        <div className="bg-white border rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Carte Total */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-2 bg-gray-200 rounded-lg">
                  <ChartBarIcon className="w-5 h-5 text-gray-700" />
                </div>
              </div>
            </div>

            {/* Carte Brouillons */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Brouillons</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.brouillons}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PencilSquareIcon className="w-5 h-5 text-blue-700" />
                </div>
              </div>
            </div>

            {/* Carte Publiés */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Publiés</p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.publies}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <PaperAirplaneIcon className="w-5 h-5 text-green-700" />
                </div>
              </div>
            </div>

            {/* Carte Archivés */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Archivés</p>
                  <p className="text-2xl font-bold text-red-900">
                    {stats.archives}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArchiveBoxIcon className="w-5 h-5 text-red-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS avec FilterBar */}
      <FilterBar
        filters={[
          {
            label: "Type",
            value: filters.type,
            options: [
              { value: "", label: "Tous les types" },
              { value: "GRIOT", label: "Griot" },
              { value: "REUNION", label: "Réunion" },
              { value: "CONVOCATION", label: "Convocation" },
              { value: "DECES", label: "Décès" },
              { value: "COTISATION", label: "Cotisation" },
              { value: "GENERAL", label: "Général" },
            ],
            onChange: (value) => setFilters((f) => ({ ...f, type: value })),
          },
          {
            label: "Statut",
            value: filters.statut,
            options: [
              { value: "", label: "Tous les statuts" },
              { value: "BROUILLON", label: "Brouillon" },
              { value: "PUBLIE", label: "Publié" },
              { value: "ARCHIVE", label: "Archivé" },
            ],
            onChange: (value) => setFilters((f) => ({ ...f, statut: value })),
          },
          {
            label: "Canal",
            value: filters.canal,
            options: [
              { value: "", label: "Tous les canaux" },
              { value: "EMAIL", label: "Email" },
              { value: "SMS", label: "SMS" },
              { value: "WHATSAPP", label: "WhatsApp" },
              { value: "PUSH", label: "Notification Push" },
            ],
            onChange: (value) => setFilters((f) => ({ ...f, canal: value })),
          },
        ]}
        searchValue={searchValue}
        onSearch={setSearchValue}
        onReset={() => {
          setFilters({ statut: "", type: "", canal: "" });
          setSearchValue("");
        }}
      />

      {/* TABLE */}
      <DataTable columns={columns} data={data} loading={loading} />

      {/* FORM MODAL */}
      <Modal
        open={openForm}
        title={selectedForm ? "Modifier le communiqué" : "Nouveau communiqué"}
        onClose={() => setOpenForm(false)}
        size="full"
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
        size="2xl"
        actions={
          selectedView?.statut === "PUBLIE" && (
            <button
              onClick={() => openDiffusionConfirm(selectedView, "rediffuser")}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              🔁 Rediffuser
            </button>
          )
        }
      >
        {selectedView && <CommuniqueDetailPanel communique={selectedView} />}
      </DetailsPanel>

      {/* CONFIRM MODAL */}
      <Modal
        open={!!preview}
        title="Confirmation de diffusion"
        onClose={() => {
          setPreview(null);
          setConfirmAction(null);
        }}
      >
        {preview && (
          <CommuniqueDiffusionConfirm
            preview={preview}
            loading={loadingAction}
            onCancel={() => {
              setPreview(null);
              setConfirmAction(null);
            }}
            onConfirm={confirmDiffusion}
          />
        )}
      </Modal>
      <Modal
        open={!!previewEmailHtml}
        title="Prévisualisation de l’email"
        onClose={() => setPreviewEmailHtml(null)}
        size="2xl"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <div dangerouslySetInnerHTML={{ __html: previewEmailHtml }} />
        </div>
      </Modal>
    </div>
  );
}
