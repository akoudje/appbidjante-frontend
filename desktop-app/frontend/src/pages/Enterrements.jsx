// src/pages/Enterrements.jsx

import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import DetailsPanel from "../components/DetailsPanel";
import Modal from "../components/Modal";
import EnterrementForm from "../components/EnterrementForm";
import ActionsInline from "../components/ActionsInline";
import { apiGet } from "../utils/api";

import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

import ExportButton from "../components/filters/ExportButton";
import StatusBadge from "../components/StatusBadge";

export default function Enterrements() {
  const [loading, setLoading] = useState(true);
  const [enterrements, setEnterrements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [openForm, setOpenForm] = useState(false);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiGet("/enterrements?withRelations=true");
      setEnterrements(data || []);
    } catch (err) {
      console.error("Erreur chargement enterrements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------
  // TABLE COLUMNS
  // -------------------------------------
  const columns = [
    {
      header: "Défunt",
      id: "defunt",
      size: 240,
      cell: ({ row }) => {
        const m = row.original.deces?.membre;
        const dateDeces = row.original.deces?.dateDeces;
        
        return (
          <div className="flex flex-col">
            <button
              onClick={() => setSelected(row.original)}
              className="text-blue-600 hover:underline font-medium text-left"
            >
              {m ? `${m.nom} ${m.prenoms}` : "—"}
            </button>
            <div className="text-xs text-gray-500 mt-1">
              {dateDeces ? new Date(dateDeces).toLocaleDateString('fr-FR') : "—"} • 
              {m?.lignee?.nom || "—"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Famille",
      id: "famille",
      size: 140,
      cell: ({ row }) => {
        const famille = row.original.deces?.membre?.lignee?.famille?.nom;
        return (
          <div className="font-medium">{famille || "—"}</div>
        );
      },
    },
    {
      header: "Date enterrement",
      id: "date",
      size: 140,
      cell: ({ row }) => {
        const date = row.original.dateEnterrement;
        return (
          <div className="font-medium">
            {date ? new Date(date).toLocaleDateString('fr-FR') : "À définir"}
          </div>
        );
      },
    },
    {
      header: "Lieu",
      id: "lieu",
      size: 140,
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex items-center gap-2">
            <MapPinIcon className={`w-4 h-4 ${
              e.enterreAuVillage ? "text-green-600" : "text-blue-600"
            }`} />
            <span className="text-sm">
              {e.enterreAuVillage ? "Au village" : e.lieuEnterrement || "—"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Statut",
      id: "statut",
      size: 120,
      cell: ({ row }) => {
        const statut = row.original.statut;
        const config = {
          "programme": { color: "blue", icon: ClockIcon, label: "Programmé" },
          "effectue": { color: "green", icon: CheckCircleIcon, label: "Effectué" },
          "annule": { color: "red", icon: XCircleIcon, label: "Annulé" },
        };
        
        const conf = config[statut] || { color: "gray", icon: ClockIcon, label: "Inconnu" };
        
        return (
          <StatusBadge
            status={conf.label}
            color={conf.color}
            icon={<conf.icon className="w-3.5 h-3.5" />}
          />
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      size: 140,
      cell: ({ row }) => {
        const e = row.original;
        const actions = [
          {
            label: "Voir",
            icon: <EyeIcon className="w-4 h-4" />,
            onClick: () => setSelected(e),
            color: "blue",
          },
          {
            label: "Modifier",
            icon: <PencilSquareIcon className="w-4 h-4" />,
            onClick: () => {
              setEditing(e);
              setOpenForm(true);
            },
            color: "amber",
          },
          {
            label: "Supprimer",
            icon: <TrashIcon className="w-4 h-4" />,
            onClick: async () => {
              if (window.confirm("Êtes-vous sûr de vouloir supprimer cet enterrement ?")) {
                try {
                  await apiDelete(`/enterrements/${e.id}`);
                  toast.success("Enterrement supprimé");
                  loadData();
                } catch (err) {
                  console.error("Erreur suppression:", err);
                  toast.error("Erreur lors de la suppression");
                }
              }
            },
            color: "red",
            destructive: true,
          },
        ];

        return <ActionsInline actions={actions} compact />;
      },
    },
  ];

  // -------------------------------------
  // EXPORT FORMAT
  // -------------------------------------
  const exportData = useMemo(() => {
    return enterrements.map((e) => {
      const m = e.deces?.membre;
      return {
        "Nom complet": m ? `${m.nom} ${m.prenoms}` : "—",
        "Famille": m?.lignee?.famille?.nom || "—",
        "Lignée": m?.lignee?.nom || "—",
        "Date décès": e.deces?.dateDeces ? new Date(e.deces.dateDeces).toLocaleDateString('fr-FR') : "—",
        "Date enterrement": e.dateEnterrement ? new Date(e.dateEnterrement).toLocaleDateString('fr-FR') : "—",
        "Lieu enterrement": e.enterreAuVillage ? "Au village" : e.lieuEnterrement || "—",
        "Statut": e.statut === "programme" ? "Programmé" : e.statut === "effectue" ? "Effectué" : "Annulé",
        "Déclaré au village": e.declareAuVillage ? "Oui" : "Non",
        "Funérailles au village": e.funeraillesAuVillage ? "Oui" : "Non",
        "Observations": e.observations || "",
      };
    });
  }, [enterrements]);

  // Fonction de suppression
  const apiDelete = async (url) => {
    const response = await fetch(`http://localhost:4000${url}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  // -------------------------------------
  // RENDER
  // -------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Enterrements</h1>
          <p className="text-sm text-gray-500">
            Planification et suivi des cérémonies funéraires
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton
            data={exportData}
            filename={`enterrements_${new Date().toISOString().split('T')[0]}`}
          />
          
          <button
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <CalendarIcon className="w-5 h-5" />
            Nouvel enterrement
          </button>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-white shadow-sm overflow-hidden">

        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">Chargement des enterrements...</p>
            </div>
          </div>
        ) : enterrements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-8">
            <CalendarIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun enterrement</h3>
            <p className="text-gray-500 text-center mb-6">
              Aucun enterrement n'a été enregistré pour le moment.
            </p>
            <button
              onClick={() => {
                setEditing(null);
                setOpenForm(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Ajouter un enterrement
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={enterrements}
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
              <div className="p-2 rounded-lg bg-green-100">
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Fiche enterrement</h3>
                <p className="text-sm text-gray-500">
                  {selected.deces?.membre?.nom} {selected.deces?.membre?.prenoms}
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
                onClick={() => {
                  setEditing(selected);
                  setOpenForm(true);
                  setSelected(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Modifier
              </button>
            </div>
          )
        }
      >
        {selected && <EnterrementDetail item={selected} />}
      </DetailsPanel>

      {/* MODAL FORM */}
      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editing ? "Modifier l'enterrement" : "Nouvel enterrement"}
        size="lg"
        confirmOnClose={true}
      >
        <EnterrementForm
          enterrement={editing}
          onSaved={() => {
            loadData();
            setOpenForm(false);
            setEditing(null);
          }}
          onClose={() => setOpenForm(false)}
        />
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------
// PANEL DÉTAILS
// ------------------------------------------------------------
function EnterrementDetail({ item }) {
  const m = item.deces?.membre;
  const d = item.deces;
  
  const formatDate = (date, showTime = false) => {
    if (!date) return "—";
    const d = new Date(date);
    if (showTime) {
      return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString("fr-FR");
  };

  const getStatutConfig = (statut) => {
    const config = {
      "programme": { color: "blue", label: "Programmé", icon: ClockIcon },
      "effectue": { color: "green", label: "Effectué", icon: CheckCircleIcon },
      "annule": { color: "red", label: "Annulé", icon: XCircleIcon },
    };
    return config[statut] || { color: "gray", label: "Inconnu", icon: ClockIcon };
  };

  const statutConfig = getStatutConfig(item.statut);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {m ? `${m.nom} ${m.prenoms}` : "—"}
        </h2>
        <div className="flex justify-center gap-2 mt-2">
          <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {m?.lignee?.famille?.nom || "—"}
          </div>
          <StatusBadge 
            status={statutConfig.label} 
            color={statutConfig.color} 
            icon={<statutConfig.icon className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Sections organisées */}
      <div className="space-y-4">
        <Section title="Informations de l'enterrement">
          <InfoRow label="Date enterrement" value={formatDate(item.dateEnterrement, true)} />
          <InfoRow 
            label="Lieu" 
            value={
              <div className="flex items-center gap-2">
                <MapPinIcon className={`w-4 h-4 ${
                  item.enterreAuVillage ? "text-green-600" : "text-blue-600"
                }`} />
                <span>
                  {item.enterreAuVillage ? "Au village" : item.lieuEnterrement || "—"}
                </span>
              </div>
            }
          />
          <InfoRow label="Heure" value={item.heureEnterrement || "—"} />
          <InfoRow label="Déclaré au village" value={item.declareAuVillage ? "Oui" : "Non"} />
          <InfoRow label="Funérailles au village" value={item.funeraillesAuVillage ? "Oui" : "Non"} />
        </Section>

        <Section title="Informations du décès">
          <InfoRow label="Date décès" value={formatDate(d?.dateDeces)} />
          <InfoRow label="Heure décès" value={d?.heureDeces || "—"} />
          <InfoRow label="Lieu décès" value={d?.lieuDeces || "—"} />
          <InfoRow label="Cause décès" value={d?.causeDeces || "—"} />
        </Section>

        {item.observations && (
          <Section title="Observations">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-line">{item.observations}</p>
            </div>
          </Section>
        )}

        {item.notes && (
          <Section title="Notes complémentaires">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 whitespace-pre-line">{item.notes}</p>
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