// frontend/src/components/CotisationForm.jsx
import { useEffect, useState } from "react";
import { apiGet } from "../utils/api";

export default function CotisationForm({ initial = null, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    membreId: "",
    date: "",
    montant: 500,
    motif: "Cotisation décès",
    statutCotisation: "Impayé",
    decesId: "",
  });

  const [membres, setMembres] = useState([]);
  const [decesList, setDecesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Synchronisation en édition
  useEffect(() => {
    if (initial) {
      setForm({
        membreId: initial.membreId || "",
        date: initial.date ? initial.date.slice(0, 10) : "",
        montant: initial.montant ?? 500,
        motif: initial.motif ?? "Cotisation décès",
        statutCotisation: initial.statutCotisation || "Impayé",
        decesId: initial.decesId || initial.deces?.id || "",
      });
    } else {
      setForm({
        membreId: "",
        date: "",
        montant: 500,
        motif: "Cotisation décès",
        statutCotisation: "Impayé",
        decesId: "",
      });
    }
  }, [initial]);

 useEffect(() => {
  const load = async () => {
    try {
      const [mems, deces] = await Promise.all([
        apiGet("/membres"),
        apiGet("/deces"),
      ]);

      // 🔥 Seuls les membres actifs
      const actifs = mems.filter((m) => m.statutMembre === "Actif");

      setMembres(actifs);
      setDecesList(deces);
    } catch (err) {
      console.error("Erreur chargement CotisationForm:", err);
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.membreId || !form.date || !form.montant) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const payload = {
      membreId: form.membreId,
      date: new Date(form.date).toISOString(),
      montant: Number(form.montant),
      statutCotisation: form.statutCotisation,
      motif: form.motif || null,
      decesId: form.decesId || null,
    };

    onSubmit(payload);
  };

  if (loading) return <p>Chargement…</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">
        {initial ? "Modifier la cotisation" : "Ajouter une cotisation"}
      </h2>

      {/* Membre */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Membre concerné *
        </label>
        <select
          name="membreId"
          value={form.membreId}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Choisir un membre</option>
          {membres.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom} {m.prenoms} — {m.lignee?.famille?.nom || ""}{" "}
              {m.lignee ? `(${m.lignee.nom})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Décès lié (optionnel) */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Liée à un décès (optionnel)
        </label>
        <select
          name="decesId"
          value={form.decesId}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="">— Aucune —</option>
          {decesList.map((d) => (
            <option key={d.id} value={d.id}>
              {d.membre?.nom} {d.membre?.prenoms} —{" "}
              {d.dateDeces
                ? new Date(d.dateDeces).toLocaleDateString("fr-FR")
                : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-1">Date *</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      {/* Montant */}
      <div>
        <label className="block text-sm font-medium mb-1">Montant *</label>
        <input
          type="number"
          name="montant"
          value={form.montant}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          min={0}
          required
        />
      </div>

      {/* Motif */}
      <div>
        <label className="block text-sm font-medium mb-1">Motif</label>
        <input
          type="text"
          name="motif"
          value={form.motif}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Statut de Cotisation */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Statut de cotisation *
        </label>
        <select
          name="statutCotisation"
          value={form.statutCotisation}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="Impayé">Impayé</option>
          <option value="En retard">En retard</option>
          <option value="Payé">Payé</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-3">
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
          {initial ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}

