// frontend/src/components/MembreForm.jsx
import { useEffect, useState } from "react";
import { apiGet } from "../utils/api";

const API_BASE = "http://localhost:4000";

const getPhotoUrl = (p) => {
  if (!p) return `${API_BASE}/uploads/default.png`;
  if (p.startsWith("http")) return p;
  if (!p.startsWith("/")) p = "/" + p;
  return `${API_BASE}${p}`;
};

// Fonction de formatage des numéros de téléphone
const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
  if (numbers.length <= 6)
    return `${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4)}`;
  if (numbers.length <= 8)
    return `${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(
      4,
      6
    )} ${numbers.slice(6)}`;
  return `${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(
    4,
    6
  )} ${numbers.slice(6, 8)} ${numbers.slice(8)}`;
};

export default function MembreForm({
  initial = null,
  onSubmit,
  onCancel,
  hideActions = false,
}) {
  const [form, setForm] = useState({
    nom: "",
    prenoms: "",
    genre: "Homme",
    dateNaissance: "",
    categorieId: "",
    grandeFamilleId: "",
    ligneeId: "",
    statutMembre: "Actif",
    photo: null,
    email: "",
    contact1: "",
    contact2: "",
  });

  const [categorieOpts, setCategorieOpts] = useState([]);
  const [familleOpts, setFamilleOpts] = useState([]);
  const [ligneeOpts, setLigneeOpts] = useState([]);

  const [preview, setPreview] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  const [errors, setErrors] = useState({});
  const [loadingLignees, setLoadingLignees] = useState(false);

  /* ----- Load initial reference data ------ */
  useEffect(() => {
    apiGet("/categories").then(setCategorieOpts);
    apiGet("/familles").then(setFamilleOpts);
  }, []);

  /* ----- Edit mode ----- */
  useEffect(() => {
    if (!initial) return;

    setForm({
      nom: initial.nom || "",
      prenoms: initial.prenoms || "",
      genre: initial.genre || "Homme",
      dateNaissance: initial.dateNaissance?.slice(0, 10) || "",
      categorieId: initial.categorieId || "",
      grandeFamilleId: initial.lignee?.famille?.id || "",
      ligneeId: initial.ligneeId || "",
      statutMembre: initial.statutMembre || "Actif",
      photo: initial.photo || null,
      email: initial.email || "",
      contact1: initial.contact1 || "",
      contact2: initial.contact2 || "",
    });

    setPreview(initial.photo ? getPhotoUrl(initial.photo) : null);
  }, [initial]);

  /* ----- Fetch lignees when famille changes ----- */
  useEffect(() => {
    if (!form.grandeFamilleId) {
      setLigneeOpts([]);
      setForm((f) => ({ ...f, ligneeId: "" }));
      return;
    }

    setLoadingLignees(true);

    apiGet(`/lignees/by-famille/${form.grandeFamilleId}`)
      .then((data) => {
        setLigneeOpts(data);

        // autofill when 1 only
        if (data.length === 1) {
          setForm((f) => ({ ...f, ligneeId: data[0].id }));
        }
      })
      .finally(() => setLoadingLignees(false));
  }, [form.grandeFamilleId]);

  /* ----- general change ------ */
  const handleChange = (e) => {
    setErrors({});
    const { name, value } = e.target;

    // Formatage automatique pour les numéros de téléphone
    if (name === "contact1" || name === "contact2") {
      const formatted = formatPhone(value);
      setForm((f) => ({ ...f, [name]: formatted }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  /* ----- photo ------ */
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadFile(file);
    setPreview(URL.createObjectURL(file));
  };

  /* ----- Validation ------ */
  const validate = () => {
    const e = {};

    if (!form.nom.trim()) e.nom = "Nom requis";
    if (!form.prenoms.trim()) e.prenoms = "Prénoms requis";
    if (!form.grandeFamilleId) e.grandeFamilleId = "Choisir famille";
    if (!form.ligneeId) e.ligneeId = "Choisir lignée";

    // Validation optionnelle pour l'email
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Email invalide";
    }

    // Validation pour le contact principal
    if (
      form.contact1 &&
      !/^[0-9]{10}$/.test(form.contact1.replace(/\s/g, ""))
    ) {
      e.contact1 = "Numéro invalide (10 chiffres requis)";
    }

    // Validation pour le contact secondaire
    if (
      form.contact2 &&
      !/^[0-9]{10}$/.test(form.contact2.replace(/\s/g, ""))
    ) {
      e.contact2 = "Numéro invalide (10 chiffres requis)";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ----- submit ------ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      nom: form.nom.trim(),
      prenoms: form.prenoms.trim(),
      genre: form.genre,
      dateNaissance: form.dateNaissance
        ? new Date(form.dateNaissance).toISOString()
        : null,
      categorieId: form.categorieId || null,
      ligneeId: form.ligneeId,
      statutMembre: form.statutMembre,
      email: form.email.trim() || null,
      contact1: form.contact1.replace(/\s/g, "") || null,
      contact2: form.contact2.replace(/\s/g, "") || null,
    };

    const saved = await onSubmit(payload);

    if (uploadFile && saved?.id) {
      const data = new FormData();
      data.append("photo", uploadFile);

      await fetch(`${API_BASE}/api/membres/${saved.id}/photo`, {
        method: "POST",
        body: data,
      });
    }

    onCancel();
  };

  /* ------------------------------------------------------------------ */

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* HEADER */}
      <h2 className="text-2xl font-bold pb-2 border-b">
        {initial ? "Modifier un membre" : "Ajouter un membre"}
      </h2>

      {/* IDENTITÉ */}
      <section className="bg-gray-50 p-4 rounded-lg border space-y-4">
        <h3 className="font-semibold text-gray-700">Identité</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              name="nom"
              value={form.nom}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Entrez le nom"
            />
            {errors.nom && (
              <p className="text-xs text-red-600 mt-1">{errors.nom}</p>
            )}
          </div>

          {/* Prénoms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénoms *
            </label>
            <input
              name="prenoms"
              value={form.prenoms}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Entrez les prénoms"
            />
            {errors.prenoms && (
              <p className="text-xs text-red-600 mt-1">{errors.prenoms}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          {/* Genre */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genre
            </label>
            <select
              name="genre"
              value={form.genre}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>Homme</option>
              <option>Femme</option>
            </select>
          </div>

          {/* Date de naissance */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de naissance
            </label>
            <input
              type="date"
              name="dateNaissance"
              value={form.dateNaissance}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* AFFILIATION */}
      <section className="bg-gray-50 p-4 rounded-lg border space-y-4">
        <h3 className="font-semibold text-gray-700">Familles & Lignées</h3>

        {/* Famille */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grande Famille *
          </label>
          <select
            name="grandeFamilleId"
            value={form.grandeFamilleId}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">— Sélectionner —</option>
            {familleOpts.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
          {errors.grandeFamilleId && (
            <p className="text-xs text-red-600 mt-1">
              {errors.grandeFamilleId}
            </p>
          )}
        </div>

        {/* Lignée */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lignée *
          </label>
          <select
            name="ligneeId"
            value={form.ligneeId}
            onChange={handleChange}
            disabled={!form.grandeFamilleId || loadingLignees}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">— Sélectionner —</option>
            {ligneeOpts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom}
              </option>
            ))}
          </select>
          {loadingLignees && (
            <p className="text-xs text-gray-500 mt-1">
              Chargement des lignées...
            </p>
          )}
          {errors.ligneeId && (
            <p className="text-xs text-red-600 mt-1">{errors.ligneeId}</p>
          )}
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie
          </label>
          <select
            name="categorieId"
            value={form.categorieId}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Aucune catégorie</option>
            {categorieOpts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* CONTACTS */}
      <section className="bg-gray-50 p-4 rounded-lg border space-y-4">
        <h3 className="font-semibold text-gray-700">Contacts</h3>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ex: exemple@gmail.com"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Contact 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact principal (WhatsApp)
          </label>
          <input
            type="tel"
            name="contact1"
            value={form.contact1}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ex: 01 02 03 04 05"
          />
          {errors.contact1 && (
            <p className="text-red-600 text-xs mt-1">{errors.contact1}</p>
          )}
        </div>

        {/* Contact 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact secondaire
          </label>
          <input
            type="tel"
            name="contact2"
            value={form.contact2}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ex: 05 06 07 08 09"
          />
          {errors.contact2 && (
            <p className="text-red-600 text-xs mt-1">{errors.contact2}</p>
          )}
        </div>
      </section>

      {/* Statut */}
      <section className="bg-gray-50 p-4 rounded-lg border space-y-4">
        <h3 className="font-semibold text-gray-700">Statut</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut du membre
          </label>
          <select
            name="statutMembre"
            value={form.statutMembre}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Actif">Actif</option>
            <option value="Actif Exempté">Exempté</option>
            <option value="Non actif">Non actif</option>
            <option value="Decedé">Décédé</option>
          </select>
        </div>
      </section>

      {/* PHOTO */}
      <section className="bg-gray-50 p-4 rounded-lg border space-y-4">
        <h3 className="font-semibold text-gray-700">Photo</h3>

        <div className="flex items-center gap-6">
          {preview && (
            <img
              src={preview}
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
              alt="Photo du membre"
            />
          )}

          <div>
            <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded border border-blue-300 inline-block transition-colors">
              {preview ? "Changer l'image" : "Choisir une image"}
              <input
                type="file"
                onChange={handlePhotoSelect}
                accept="image/*"
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Formats acceptés: JPG, PNG
            </p>
          </div>
        </div>
      </section>

      {/* ACTIONS - conditionnelles */}
      {!hideActions && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {initial ? "Mettre à jour" : "Créer le membre"}
          </button>
        </div>
      )}
    </form>
  );
}
