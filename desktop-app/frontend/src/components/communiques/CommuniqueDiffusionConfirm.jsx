// src/components/communiques/CommuniqueDiffusionConfirm.jsx
export default function CommuniqueDiffusionConfirm({
  preview,
  onConfirm,
  onCancel,
  loading,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        📣 Confirmation de rediffusion
      </h3>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Canaux :</strong>{" "}
          {preview.canaux.join(", ")}
        </div>

        <div>
          <strong>Destinataires :</strong>
          <ul className="list-disc pl-5 mt-1">
            {Object.entries(preview.details).map(([canal, count]) => (
              <li key={canal}>
                {canal} : {count}
              </li>
            ))}
          </ul>
        </div>

        {preview.avertissements.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-3 rounded">
            {preview.avertissements.map((w, i) => (
              <div key={i}>⚠️ {w}</div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button className="btn" onClick={onCancel}>
          Annuler
        </button>
        <button
          className="btn-primary"
          disabled={loading || preview.totalDestinataires === 0}
          onClick={onConfirm}
        >
          Confirmer la rediffusion
        </button>
      </div>
    </div>
  );
}
