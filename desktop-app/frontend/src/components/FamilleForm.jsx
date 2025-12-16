// frontend/src/components/FamilleForm.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiGet } from "../utils/api";

/**
 * FamilleForm
 *
 * Props:
 *  - initial: object|null (édition)
 *  - onSubmit(payload)
 *  - onCancel()
 *
 * Comportement :
 *  - select prérempli avec la liste prédéfinie (options fixes)
 *  - vérification immédiate contre les familles déjà présentes en base
 *  - message inline + toast lors d'un doublon
 *  - bouton Enregistrer désactivé en cas de doublon (sauf si on édite la même famille)
 */
export default function FamilleForm({ initial = null, onSubmit, onCancel }) {
  const PREDEFINED = [
    "AGOUA",
    "KOUEDOMAN",
    "GODOUMAN",
    "LOKOMAN",
    "TCHADOMAN",
    "FIEDOMAN",
    "M'GBADOMAN",
    "DJOUMANDO",
    "ABROMANDO",
  ];

  const [value, setValue] = useState(initial?.nom || "");
  const [existingNames, setExistingNames] = useState([]); // from API
  const [error, setError] = useState(""); // validation message

  // Charger noms existants pour contrôle de doublon
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiGet("/familles"); // attend un array d'obj {id, nom, ...}
        if (!mounted) return;
        const names = Array.isArray(res) ? res.map((f) => (f.nom || "").toLowerCase()) : [];
        setExistingNames(names);
      } catch (err) {
        console.error("Impossible de charger les familles pour validation :", err);
        setExistingNames([]);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Quand initial change (mode édition) : positionner value
  useEffect(() => {
    setValue(initial?.nom || "");
    setError("");
  }, [initial]);

  // Validation en temps réel dès que la sélection change
  useEffect(() => {
    setError("");

    if (!value) {
      // pas d'erreur si rien choisi (mais on demandera à l'envoi)
      return;
    }

    const valLower = (value || "").trim().toLowerCase();
    // si mode édition, autoriser la valeur qui correspond à l'initial
    const isEditingSame =
      initial && initial.nom && initial.nom.trim().toLowerCase() === valLower;

    // existe-t-il déjà (dans DB) et n'est-ce pas l'élément édité ?
    const existsInDb = existingNames.includes(valLower);

    if (existsInDb && !isEditingSame) {
      const msg = `La grande famille "${value}" existe déjà dans la base. Choisissez une autre option.`;
      setError(msg);
      // toast une seule fois par sélection (utile pour feedback fort) :
      toast.error(msg);
      return;
    }

    // Tout bon => clear error
    setError("");
  }, [value, existingNames, initial]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!value || !value.trim()) {
      setError("Veuillez sélectionner une grande famille.");
      return;
    }

    if (error) {
      // protection supplémentaire
      toast.error("Impossible d'enregistrer : corrigez les erreurs du formulaire.");
      return;
    }

    const payload = { nom: value.trim() };
    if (initial?.id) payload.id = initial.id;

    onSubmit(payload);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">
        {initial ? "Modifier la grande famille" : "Nouvelle grande famille"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-semibold block mb-1">Nom *</label>

          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`w-full border p-2 rounded ${
              error ? "border-red-500" : ""
            }`}
          >
            <option value="">— Choisir une grande famille —</option>
            {PREDEFINED.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          {error ? (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Choisissez une des grandes familles prédéfinies.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!!error}
            className={`flex-1 py-2 rounded text-white ${
              error ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Enregistrer
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border py-2 rounded"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
