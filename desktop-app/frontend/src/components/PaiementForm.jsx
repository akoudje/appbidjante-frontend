import { useEffect, useState } from "react";
import { apiGet } from "../utils/api";
import { toast } from "sonner";

/**
 * Props :
 *  - initial : paiement existant (édition)
 *  - cotisationFixe : si on ouvre depuis une fiche cotisation
 *  - onSubmit : callback
 *  - onCancel : callback
 */
export default function PaiementForm({
  initial = null,
  cotisationFixe = null,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    cotisationId: "",
    montant: "",
    date: "",
    mode: "Espèces",
  });

  const [cotisations, setCotisations] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // 1) Charger cotisations (SEULEMENT si pas de cotisationFixe)
  // ------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (!cotisationFixe) {
          const list = await apiGet("/cotisations?withMembre=true");
          setCotisations(list);
        }
      } catch (err) {
        toast.error("Erreur lors du chargement des cotisations.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [cotisationFixe]);

  // ------------------------------------------------------------
  // 2) Précharger initial (édition)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!initial) return;

    setForm({
      cotisationId: initial.cotisationId,
      montant: initial.montant || "",
      date: initial.date ? initial.date.slice(0, 10) : "",
      mode: initial.mode || "Espèces",
    });
  }, [initial]);

  // ------------------------------------------------------------
  // 3) Pré-fixer la cotisation si fournie
  // ------------------------------------------------------------
  useEffect(() => {
    if (cotisationFixe) {
      setForm((f) => ({
        ...f,
        cotisationId: cotisationFixe.id,
      }));
    }
  }, [cotisationFixe]);

  // ------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // ------------------------------------------------------------
  // 4) Validation + Toasts + Submit
  // ------------------------------------------------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    // — VALIDATIONS —
    if (!form.cotisationId) {
      toast.warning("Veuillez sélectionner une cotisation.");
      return;
    }

    if (!form.montant || Number(form.montant) <= 0) {
      toast.warning("Le montant doit être supérieur à 0.");
      return;
    }

    if (!form.date) {
      toast.warning("La date est obligatoire.");
      return;
    }

    const chosen = new Date(form.date);
    const today = new Date();
    if (chosen > today) {
      toast.warning("La date de paiement ne peut pas être dans le futur.");
      return;
    }

    // — ENVOI —
    try {
      onSubmit({
        ...form,
        montant: Number(form.montant),
        date: new Date(form.date).toISOString(),
      });

      toast.success("Paiement enregistré avec succès !");
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement du paiement.");
    }
  };

  if (loading) return <p>Chargement…</p>;

  // ------------------------------------------------------------
  // 5) RENDER
  // ------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">
        {initial ? "Modifier le paiement" : "Ajouter un paiement"}
      </h2>

      {/* COTISATION */}
      <div>
        <label className="block text-sm mb-1">Cotisation *</label>

        {/* Lecture seule */}
        {cotisationFixe ? (
          <div className="p-2 border rounded bg-gray-100 text-gray-700">
            #{cotisationFixe.id} — {cotisationFixe.montant} FCFA —{" "}
            {cotisationFixe.membre?.nom} {cotisationFixe.membre?.prenoms}
          </div>
        ) : (
          <select
            name="cotisationId"
            value={form.cotisationId}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Choisir</option>

            {cotisations.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} — {c.montant} FCFA — {c.membre?.nom}{" "}
                {c.membre?.prenoms}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* MONTANT */}
      <div>
        <label className="block text-sm mb-1">Montant *</label>
        <input
          type="number"
          name="montant"
          value={form.montant}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          min={1}
          required
        />
      </div>

      {/* DATE */}
      <div>
        <label className="block text-sm mb-1">Date *</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      {/* MODE DE PAIEMENT */}
      <div>
        <label className="block text-sm mb-1">Mode de paiement</label>
        <select
          name="mode"
          value={form.mode}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option>Espèces</option>
          <option>Mobile Money</option>
          <option>Virement</option>
        </select>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded"
        >
          Annuler
        </button>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}
