// src/components/communiques/CommuniqueForm.jsx

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut } from "@/utils/api";
import { toast } from "sonner";

const TYPES = [
  "GRIOT",
  "REUNION",
  "CONVOCATION",
  "DECES",
  "COTISATION",
  "GENERAL",
];

const CANAUX = ["SMS", "EMAIL", "WHATSAPP", "PUSH"];

const CIBLES = [
  { value: "ALL", label: "Tout le monde" },
  { value: "FAMILLE", label: "Grande famille" },
  { value: "LIGNEE", label: "Lignée" },
  { value: "CATEGORIE", label: "Catégorie" },
  { value: "CUSTOM", label: "Sélection personnalisée" },
];

export default function CommuniqueForm({
  initialData = null,
  onSuccess,
  onCancel,
}) {
  const isEdit = Boolean(initialData?.id);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titre: "",
    contenu: "",
    type: "GENERAL",
    canaux: [],
    cibleType: "ALL",
    cibleIds: [],
  });

  // Chargement initial (édition)
  useEffect(() => {
    if (initialData) {
      setForm({
        titre: initialData.titre ?? "",
        contenu: initialData.contenu ?? "",
        type: initialData.type ?? "GENERAL",
        canaux: initialData.canaux ?? [],
        cibleType: initialData.cibleType ?? "ALL",
        cibleIds: initialData.cibleIds ?? [],
      });
    }
  }, [initialData]);

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleCanal = (canal) => {
    setForm((f) => ({
      ...f,
      canaux: f.canaux.includes(canal)
        ? f.canaux.filter((c) => c !== canal)
        : [...f.canaux, canal],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.titre || !form.contenu) {
      toast.error("Titre et contenu sont obligatoires");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await apiPut(`/communiques/${initialData.id}`, form);
        toast.success("Communiqué mis à jour");
      } else {
        await apiPost("/communiques", form);
        toast.success("Communiqué créé");
      } 
      onSuccess?.();
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l’enregistrement");
    } finally {
      setLoading(false);
    }
  };
       
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* TITRE */}
      <div>
        <label className="block text-sm font-medium mb-1">Titre</label>
        <input
          type="text"
          value={form.titre}
          onChange={(e) => handleChange("titre", e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
      </div>

      {/* TYPE */}
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={form.type}
          onChange={(e) => handleChange("type", e.target.value)}
          className="w-full rounded border px-3 py-2"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* CONTENU */}
      <div>
        <label className="block text-sm font-medium mb-1">Contenu</label>
        <textarea
          rows={6}
          value={form.contenu}
          onChange={(e) => handleChange("contenu", e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
      </div>

      {/* CANAUX */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Canaux de diffusion
        </label>
        <div className="flex flex-wrap gap-3">
          {CANAUX.map((canal) => (
            <label
              key={canal}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={form.canaux.includes(canal)}
                onChange={() => toggleCanal(canal)}
              />
              {canal}
            </label>
          ))}
        </div>
      </div>

      {/* CIBLE */}
      <div>
        <label className="block text-sm font-medium mb-1">Cible</label>
        <select
          value={form.cibleType}
          onChange={(e) => handleChange("cibleType", e.target.value)}
          className="w-full rounded border px-3 py-2"
        >
          {CIBLES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded border"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
        >
          {isEdit ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  );
}
