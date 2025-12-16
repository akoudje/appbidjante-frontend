// frontend/src/pages/Soldes.jsx

import { useEffect, useState, useMemo } from "react";
import DataTable from "../components/DataTable";
import DetailsPanel from "../components/DetailsPanel";
import FilterBar from "../components/filters/FilterBar";
import ActionsInline from "../components/ActionsInline";
import { apiGet } from "../utils/api";

export default function Soldes() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);

  // ----------------------------------------
  // Charger la liste des membres avec leur solde
  // ----------------------------------------
  const load = async () => {
    try {
      setLoading(true);
      const data = await apiGet("/soldes");
      
      // CORRECTION ICI : L'API retourne { membres: [...], stats: {...} }
      // Vérifiez la structure de la réponse
      console.log("Données API /soldes:", data);
      
      if (data && Array.isArray(data.membres)) {
        setRows(data.membres);
      } else if (Array.isArray(data)) {
        // Si l'API retourne directement un tableau (ancienne version)
        setRows(data);
      } else {
        console.error("Format de données inattendu:", data);
        setRows([]);
      }
    } catch (err) {
      console.error("Erreur load soldes :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ----------------------------------------
  // Charger détail d'un membre sélectionné
  // ----------------------------------------
  const loadDetails = async (id) => {
    try {
      const detail = await apiGet(`/soldes/${id}`);
      setDetails(detail);
    } catch (err) {
      console.error("Erreur load solde détail:", err);
    }
  };

  useEffect(() => {
    if (selected) loadDetails(selected.id);
    else setDetails(null);
  }, [selected]);

  // ----------------------------------------
  // Filtres - AJOUT DE VÉRIFICATIONS
  // ----------------------------------------
  const [search, setSearch] = useState("");
  const [famille, setFamille] = useState("");
  const [lignee, setLignee] = useState("");

  // Vérifier que rows est un tableau avant d'utiliser map
  const familleOptions = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return [
      ...new Set(rows.map((r) => r.famille).filter(Boolean)),
    ].sort();
  }, [rows]);

  const ligneeOptions = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return [...new Set(rows.map((r) => r.lignee).filter(Boolean))].sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    
    const s = search.toLowerCase();
    return rows.filter((r) => {
      if (famille && r.famille !== famille) return false;
      if (lignee && r.lignee !== lignee) return false;

      if (s) {
        const text = `${r.nom} ${r.prenoms} ${r.famille} ${r.lignee}`
          .toLowerCase();
        if (!text.includes(s)) return false;
      }

      return true;
    });
  }, [rows, search, famille, lignee]);

  // ----------------------------------------
  // Colonnes du tableau
  // ----------------------------------------
  const columns = useMemo(
    () => [
      {
        header: "Nom complet",
        id: "nom",
        size: 230,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <button
              onClick={() => setSelected(r)}
              className="text-blue-600 hover:underline"
            >
              {r.nom} {r.prenoms}
            </button>
          );
        },
      },
      {
        header: "Famille",
        size: 120,
        cell: (info) => info.row.original.famille || "—",
      },
      {
        header: "Lignée",
        size: 120,
        cell: (info) => info.row.original.lignee || "—",
      },
      {
        header: "Total dû",
        accessorKey: "totalDu",
        size: 120,
        cell: (info) =>
          `${Number(info.getValue() || 0).toLocaleString("fr-FR")} FCFA`,
      },
      {
        header: "Total payé",
        accessorKey: "totalPaye",
        size: 120,
        cell: (info) =>
          `${Number(info.getValue() || 0).toLocaleString("fr-FR")} FCFA`,
      },
      {
        header: "Solde",
        accessorKey: "solde",
        size: 120,
        cell: (info) => {
          const v = info.getValue() || 0;
          const color =
            v === 0
              ? "text-gray-700"
              : v > 0
              ? "text-green-700"
              : "text-red-700";
          return <strong className={color}>{v.toLocaleString("fr-FR")} FCFA</strong>;
        },
      },
    ],
    []
  );

  // ----------------------------------------
  // Render - AJOUT DE VÉRIFICATIONS
  // ----------------------------------------
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Soldes des membres</h1>

      {/* FILTER BAR */}
      <FilterBar
        searchValue={search}
        onSearch={setSearch}
        onReset={() => {
          setSearch("");
          setFamille("");
          setLignee("");
        }}
        filters={[
          {
            label: "Famille",
            value: famille,
            onChange: setFamille,
            options: familleOptions,
          },
          {
            label: "Lignée",
            value: lignee,
            onChange: setLignee,
            options: ligneeOptions,
          },
        ]}
      />

      {/* TABLE */}
      {loading ? (
        <p>Chargement…</p>
      ) : !Array.isArray(filteredRows) || filteredRows.length === 0 ? (
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <p className="text-gray-600">
            {!Array.isArray(rows) 
              ? "Erreur de chargement des données" 
              : rows.length === 0 
                ? "Aucun membre trouvé" 
                : "Aucun membre ne correspond à vos critères de recherche"}
          </p>
          <button
            onClick={load}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Actualiser
          </button>
        </div>
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
        title="Détails du solde"
        width="520px"
      >
        {selected && details && (
          <SoldeDetail selected={selected} details={details} />
        )}
      </DetailsPanel>
    </div>
  );
}

// -------------------------------------------------------
// DETAIL PANEL : Solde d'un membre
// -------------------------------------------------------
function SoldeDetail({ selected, details }) {
  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-lg font-bold">
        Solde de {selected.nom} {selected.prenoms}
      </h2>

      <div className="bg-gray-50 border p-3 rounded space-y-2">
        <p>
          <strong>Famille :</strong> {selected.famille || "—"}
        </p>
        <p>
          <strong>Lignée :</strong> {selected.lignee || "—"}
        </p>
        <p>
          <strong>Total dû :</strong>{" "}
          {(details.totalDu || 0).toLocaleString("fr-FR")} FCFA
        </p>
        <p>
          <strong>Total payé :</strong>{" "}
          {(details.totalPaye || 0).toLocaleString("fr-FR")} FCFA
        </p>
        <p>
          <strong>Solde :</strong>{" "}
          <span
            className={
              (details.solde || 0) >= 0
                ? "text-green-700 font-bold"
                : "text-red-700 font-bold"
            }
          >
            {(details.solde || 0).toLocaleString("fr-FR")} FCFA
          </span>
        </p>
      </div>

      <h3 className="font-semibold text-base">Cotisations</h3>

      <div className="space-y-2 max-h-72 overflow-auto pr-1">
        {details.cotisations && details.cotisations.length > 0 ? (
          details.cotisations.map((c) => (
            <div
              key={c.id}
              className="border rounded p-3 bg-white shadow-sm space-y-1"
            >
              <p>
                <strong>Date :</strong>{" "}
                {new Date(c.date).toLocaleDateString("fr-FR")}
              </p>
              <p>
                <strong>Montant :</strong>{" "}
                {(c.montant || 0).toLocaleString("fr-FR")} FCFA
              </p>
              <p>
                <strong>Motif :</strong> {c.motif || "—"}
              </p>
              <p>
                <strong>Payé :</strong>{" "}
                {(c.totalPaye || 0).toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            Aucune cotisation trouvée
          </p>
        )}
      </div>
    </div>
  );
}