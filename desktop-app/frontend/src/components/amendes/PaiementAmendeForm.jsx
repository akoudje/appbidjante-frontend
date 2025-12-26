// src/components/amendes/PaiementAmendeForm.jsx - CORRIGÉ

import { useState } from "react";
import { apiPost } from "@/utils/api";
import { toast } from "sonner";

export default function PaiementAmendeForm({ amendeId, montantMax, onSuccess, onCancel }) {
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("ESPECES");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!montant || Number(montant) <= 0) {
      toast.error("Montant invalide");
      return;
    }

    const montantNum = Number(montant);
    
    // Vérifier que le montant ne dépasse pas le maximum
    if (montantMax && montantNum > montantMax) {
      toast.error(`Le montant ne peut pas dépasser ${montantMax.toLocaleString()} FCFA`);
      return;
    }

    try {
      setLoading(true);
      console.log("📤 Envoi paiement:", {
        amendeId,
        montant: montantNum,
        mode,
        reference: reference || "" // Envoyer chaîne vide plutôt que null
      });
      
      await apiPost(`/amendes/${amendeId}/paiements`, {
        montant: montantNum,
        mode,
        reference: reference || "", // CHANGÉ: "" au lieu de null
      });
      
      toast.success("Paiement enregistré avec succès");
      onSuccess?.();
    } catch (e) {
      console.error("❌ Erreur paiement:", e);
      const errorMessage = e?.response?.data?.error || "Erreur lors de l'enregistrement";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold">Montant (FCFA)</label>
        <input
          type="number"
          className="w-full mt-1 border rounded-lg px-4 py-2"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder={`Maximum: ${montantMax?.toLocaleString() || "..."} FCFA`}
          max={montantMax}
          min="1"
        />
        {montantMax && (
          <p className="text-xs text-gray-500 mt-1">
            Reste à payer: {montantMax.toLocaleString()} FCFA
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold">Mode de paiement</label>
        <select
          className="w-full mt-1 border rounded-lg px-4 py-2"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="ESPECES">Espèces</option>
          <option value="MOBILE_MONEY">Mobile Money</option>
          <option value="VIREMENT">Virement</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold">
          Référence (optionnelle)
        </label>
        <input
          className="w-full mt-1 border rounded-lg px-4 py-2"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="N° de transaction, référence..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading || !montant}
          className={`px-4 py-2 text-white rounded-lg transition ${
            loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Enregistrement...
            </span>
          ) : (
            "Enregistrer"
          )}
        </button>
      </div>
    </form>
  );
}