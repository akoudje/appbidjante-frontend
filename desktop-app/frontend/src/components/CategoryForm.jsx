import { useState, useEffect } from "react";

const GENERATIONS = ["DOUGBO", "TCHAGBA", "BLESSOUE", "GNANDO"];
const CLASSES = ["ASSOUKROU", "AGBAN", "DONGBA", "DJEHOU"];

export default function CategoryForm({ initial = null, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    id: initial?.id ?? null,
    generation: initial?.generation ?? GENERATIONS[0],
    classe: initial?.classe ?? CLASSES[0],
    born_from: initial?.born_from ?? "",
    born_to: initial?.born_to ?? "",
    label: initial?.label ?? "",
    date_sortie_1er_guerrier: initial?.date_sortie_1er_guerrier ?? "",
    date_sortie_2eme_guerrier: initial?.date_sortie_2eme_guerrier ?? "",
    description: initial?.description ?? "",
  });

  const [manualLabel, setManualLabel] = useState(Boolean(initial?.label));
  const [errors, setErrors] = useState({});

  /* Auto-label */
  useEffect(() => {
    if (!manualLabel) {
      setForm((f) => ({ ...f, label: `${f.generation} ${f.classe}` }));
    }
  }, [form.generation, form.classe]);

  /* Generic change */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors({});
  };

  /* Validation */
  const validate = () => {
    const e = {};

    if (!form.label.trim()) e.label = "Label requis";
    if (!form.date_sortie_1er_guerrier) e.date1 = "Date obligatoire";

    const from = Number(form.born_from);
    const to = Number(form.born_to);
    if (from && to && from > to) e.bornRange = "Doit être inférieur à l'année fin";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* Submit */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      born_from: form.born_from ? Number(form.born_from) : null,
      born_to: form.born_to ? Number(form.born_to) : null,
    };

    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <h2 className="text-xl font-bold">
        {form.id ? "Modifier la catégorie" : "Créer une catégorie"}
      </h2>

      {/* Bloc Generation */}
      <section className="p-4 bg-gray-50 rounded-lg border space-y-4">
        <h3 className="font-semibold text-gray-700">Génération & Classe</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Génération</label>
            <select
              name="generation"
              value={form.generation}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              {GENERATIONS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Classe</label>
            <select
              name="classe"
              value={form.classe}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              {CLASSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Bloc Dates et born */}
      <section className="p-4 bg-gray-50 rounded-lg border space-y-4">
        <h3 className="font-semibold text-gray-700">Période</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Année début</label>
            <input
              type="number"
              name="born_from"
              value={form.born_from}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Année fin</label>
            <input
              type="number"
              name="born_to"
              value={form.born_to}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        {errors.bornRange && (
          <p className="text-xs text-red-600">{errors.bornRange}</p>
        )}
      </section>

      {/* Label */}
      <div>
        <label className="text-sm font-medium">Label *</label>
        <input
          type="text"
          name="label"
          value={form.label}
          onChange={(e) => {
            setManualLabel(true);
            handleChange(e);
          }}
          className={`w-full border p-2 rounded ${
            errors.label && "border-red-400"
          }`}
        />
        {errors.label && (
          <p className="text-xs text-red-600">{errors.label}</p>
        )}
      </div>

      {/* Dates Guerrier */}
      <div>
        <label className="text-sm font-medium">
          Date sortie du 1er guerrier *
        </label>
        <input
          type="date"
          name="date_sortie_1er_guerrier"
          value={form.date_sortie_1er_guerrier}
          onChange={handleChange}
          className={`w-full border p-2 rounded ${
            errors.date1 && "border-red-400"
          }`}
        />
        {errors.date1 && (
          <p className="text-xs text-red-600">{errors.date1}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">
          Date sortie du 2ᵉ guerrier
        </label>
        <input
          type="date"
          name="date_sortie_2eme_guerrier"
          value={form.date_sortie_2eme_guerrier}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">
          Annuler
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Enregistrer
        </button>
      </div>
    </form>
  );
}
