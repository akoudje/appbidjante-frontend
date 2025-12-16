// frontend/src/components/VillageMap.jsx

import { useEffect, useState } from "react";
import VillageMapCard from "./VillageMapCard";
import SidePanel from "./SidePanel";
import TreeView from "./TreeView";
import { apiGet } from "../utils/api";

export default function VillageMap() {
  const [familles, setFamilles] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet("/familles?withRelations=true");
        setFamilles(data);
      } catch (e) {
        console.error("Erreur chargement familles:", e);
      }
    };

    load();
  }, []);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">Carte du village</h1>
      <p className="text-gray-600 mb-6">
        Représentation visuelle des Grandes Familles Ebrié.
      </p>

      {/* GRID DES FAMILLES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {familles.map((f) => (
          <VillageMapCard
            key={f.id}
            famille={f}
            onClick={() => setSelected(f)}
          />
        ))}
      </div>

      {/* PANEL DÉTAILS */}
      <SidePanel open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{selected.nom}</h2>

            <p className="text-gray-600">
              {selected.lignees.length} lignées —{" "}
              {selected.lignees.reduce(
                (s, l) => s + l.membres.length,
                0
              )}{" "}
              membres
            </p>

            {/* Affichage arborescent */}
            <TreeView data={[selected]} />
          </div>
        )}
      </SidePanel>
    </div>
  );
}
