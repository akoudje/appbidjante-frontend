import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiGet } from "@/utils/api";
import StatusBadge from "@/components/StatusBadge";

export default function CommuniqueDetailPanel({ communique }) {
  const [diffusions, setDiffusions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!communique?.id) return;

    setLoading(true);
    apiGet(`/communiques/${communique.id}/diffusions`)
      .then(setDiffusions)
      .catch(() =>
        toast.error("Erreur lors du chargement de l’historique")
      )
      .finally(() => setLoading(false));
  }, [communique?.id]);

  if (!communique) return null;

  return (
    <div className="space-y-6">
      {/* META */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Informations</h3>
          <StatusBadge value={communique.statut} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium">Type :</span>{" "}
            {communique.type}
          </div>
          <div>
            <span className="font-medium">Cible :</span>{" "}
            {communique.cibleType}
          </div>
          <div>
            <span className="font-medium">Canaux :</span>{" "}
            {communique.canaux?.join(", ") || "—"}
          </div>
          <div>
            <span className="font-medium">Créé par :</span>{" "}
            {communique.createdBy?.username || "—"}
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section>
        <h3 className="font-semibold mb-2 text-gray-900">
          Contenu du communiqué
        </h3>

        <div className="bg-gray-50 border rounded p-3 text-sm whitespace-pre-line">
          {communique.contenu}
        </div>
      </section>

      {/* HISTORIQUE */}
      <section>
        <h3 className="font-semibold mb-2 text-gray-900">
          Historique de diffusion
        </h3>

        <div className="bg-white border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Canal</th>
                <th className="p-2 text-left">Destinataire</th>
                <th className="p-2 text-left">Statut</th>
                <th className="p-2 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Chargement…
                  </td>
                </tr>
              )}

              {!loading && diffusions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Aucune diffusion enregistrée
                  </td>
                </tr>
              )}

              {!loading &&
                diffusions.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-2">{d.canal}</td>
                    <td className="p-2 truncate max-w-[200px]">
                      {d.destinataire}
                    </td>
                    <td className="p-2">
                      <StatusBadge value={d.statut} />
                    </td>
                    <td className="p-2">
                      {new Date(d.sentAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
