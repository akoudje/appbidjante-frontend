// frontend/src/components/DecesForm.jsx
import { useEffect, useState, useRef } from "react";
import { apiGet, apiPost, apiPut } from "../utils/api";
import EnterrementForm from "./EnterrementForm";
import Modal from "./Modal";
import {
  MagnifyingGlassIcon,
  UserIcon,
  CheckIcon,
  ChevronUpDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function DecesForm({
  initial = null,
  membreFixe = null,
  onSubmit,
  onCancel,
}) {
  const [mode, setMode] = useState("existing");

  const [loading, setLoading] = useState(true);
  const [loadingLignees, setLoadingLignees] = useState(false);
  const [searching, setSearching] = useState(false);

  const [membres, setMembres] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [lignees, setLignees] = useState([]);

  // États pour l'autocomplétion
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembres, setFilteredMembres] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMembre, setSelectedMembre] = useState(null);
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    membreId: membreFixe?.id || initial?.membreId || "",
    dateDeces: initial?.dateDeces?.slice(0, 10) || "",
    motif: initial?.motif || "",
    nouveauNom: "",
    nouveauPrenoms: "",
    nouveauGenre: "Homme",
    nouveauDateNaissance: "",
    nouveauEmail: "",
    nouveauWhatsapp: "",
    nouveauFamilleId: "",
    nouveauLigneeId: "",
  });

  const [enterrementModalOpen, setEnterrementModalOpen] = useState(false);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (membreFixe) setMode("existing");
  }, [membreFixe]);

  // Charger les données initiales
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFamilles((await apiGet("/familles")) || []);
      if (!membreFixe) {
        const allMembres = (await apiGet("/membres")) || [];
        setMembres(allMembres);
        setFilteredMembres(allMembres.slice(0, 10)); // Limiter initialement
      }
      setLoading(false);
    };
    load();
  }, [membreFixe]);

  // Initialiser le formulaire
  useEffect(() => {
    if (initial) {
      const membreInitial = membres.find(
        (m) => m.id === (initial.membreId || initial.membre?.id)
      );
      if (membreInitial) {
        setSelectedMembre(membreInitial);
      }
      setForm((f) => ({
        ...f,
        membreId: initial.membreId || initial.membre?.id || "",
        dateDeces: initial.dateDeces?.slice(0, 10) || "",
        motif: initial.motif || "",
      }));
      setMode("existing");
    }
  }, [initial, membres]);

  // Recherche dynamique des membres
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembres(membres.slice(0, 10));
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = membres.filter((membre) => {
      const fullName = `${membre.nom} ${membre.prenoms}`.toLowerCase();
      const nom = membre.nom.toLowerCase();
      const prenoms = membre.prenoms.toLowerCase();
      const email = (membre.email || "").toLowerCase();
      const phone = (membre.contact1 || "").toLowerCase();

      return (
        fullName.includes(query) ||
        nom.includes(query) ||
        prenoms.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });

    setFilteredMembres(filtered.slice(0, 20)); // Limiter les résultats
    setShowDropdown(true);
  }, [searchQuery, membres]);

  const loadLignee = async (familleId) => {
    setLoadingLignees(true);
    const list = await apiGet(`/lignees/by-famille/${familleId}`);
    setLignees(list || []);
    setLoadingLignees(false);
  };

  useEffect(() => {
    if (mode === "new" && form.nouveauFamilleId) {
      loadLignee(form.nouveauFamilleId);
    }
  }, [form.nouveauFamilleId, mode]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleMembreSearch = (value) => {
    setSearchQuery(value);
    if (value === "") {
      setSelectedMembre(null);
      setForm((f) => ({ ...f, membreId: "" }));
    }
  };

  const handleSelectMembre = (membre) => {
    setSelectedMembre(membre);
    setForm((f) => ({ ...f, membreId: membre.id }));
    setSearchQuery(`${membre.nom} ${membre.prenoms}`);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    setSelectedMembre(null);
    setSearchQuery("");
    setForm((f) => ({ ...f, membreId: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.dateDeces) return alert("Date obligatoire");
    const iso = new Date(form.dateDeces).toISOString();

    // EDIT
    if (initial?.id) {
      const saved = await apiPut(`/deces/${initial.id}`, {
        dateDeces: iso,
        motif: form.motif,
      });
      onSubmit?.(saved);
      return;
    }

    let membreIdFinal = null;

    /** EXISTANT **/
    if (mode === "existing") {
      membreIdFinal = membreFixe?.id || form.membreId;
      if (!membreIdFinal) return alert("Choisir un membre");

      // PAS BESOIN DE VÉRIFIER ICI - la fonction createDeces le fera
      // Supprimez cette ligne :
      // const mp = await apiGet(`/membres/${membreIdFinal}`);
      // if (mp?.statutMembre === "Décédé") return alert("Déjà enregistré comme décédé");
    }

    /** NOUVEAU **/
    if (mode === "new") {
      if (!form.nouveauNom) return alert("Nom requis");
      if (!form.nouveauFamilleId) return alert("Famille requise");
      if (!form.nouveauLigneeId) return alert("Lignée requise");

      const nouveau = await apiPost("/membres", {
        nom: form.nouveauNom.trim(),
        prenoms: form.nouveauPrenoms,
        genre: form.nouveauGenre,
        dateNaissance: form.nouveauDateNaissance
          ? new Date(form.nouveauDateNaissance).toISOString()
          : null,
        ligneeId: form.nouveauLigneeId,
        statutMembre: "Décédé", // On crée directement comme décédé
        email: form.nouveauEmail,
        contact1: form.nouveauWhatsapp,
      });
      membreIdFinal = nouveau.id;
    }

    // CREATE DOSSIER
    const saved = await apiPost("/deces", {
      membreId: membreIdFinal,
      dateDeces: iso,
      motif: form.motif,
    });

    onSubmit?.(saved);
  };

  const membreAffiche =
    membreFixe || membres.find((m) => m.id === form.membreId) || selectedMembre;

  if (loading)
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-6 p-4">
      {/* Titre */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>{initial ? "Modifier" : "Déclarer"} un décès</span>
          {membreAffiche && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              • {membreAffiche.nom} {membreAffiche.prenoms}
            </span>
          )}
        </h2>
      </div>

      {/* CHOIX MODE */}
      {!initial && !membreFixe && (
        <div className="flex gap-6 p-3 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="existing"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
              className="w-4 h-4 text-red-600"
            />
            <span className="font-medium">Membre existant</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="new"
              checked={mode === "new"}
              onChange={() => setMode("new")}
              className="w-4 h-4 text-red-600"
            />
            <span className="font-medium">Personne non enregistrée</span>
          </label>
        </div>
      )}

      {/* MEMBRE EXISTANT avec ComboBox */}
      {(mode === "existing" || membreFixe || initial) && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Membre concerné <span className="text-red-500">*</span>
            </label>

            {membreFixe || initial ? (
              <div className="p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {membreAffiche
                        ? `${membreAffiche.nom} ${membreAffiche.prenoms}`
                        : "—"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {membreAffiche?.email || "—"} •{" "}
                      {membreAffiche?.contact1 || "—"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                {/* Champ de recherche */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleMembreSearch(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Rechercher par nom, prénom, email ou téléphone..."
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Dropdown d'autocomplétion */}
                {showDropdown && filteredMembres.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {filteredMembres.map((membre) => {
                      const isSelected = selectedMembre?.id === membre.id;
                      return (
                        <div
                          key={membre.id}
                          onClick={() => handleSelectMembre(membre)}
                          className={`p-3 cursor-pointer hover:bg-red-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                            isSelected
                              ? "bg-red-50 border-l-4 border-l-red-500"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {membre.nom} {membre.prenoms}
                                  {membre.statutMembre === "Décédé" && (
                                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                      Décédé
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {membre.email && <span>{membre.email}</span>}
                                  {membre.contact1 && (
                                    <span className="ml-2">
                                      • {membre.contact1}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckIcon className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            Famille: {membre.famille?.nom || "—"} • Lignée:{" "}
                            {membre.lignee?.nom || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Aucun résultat */}
                {showDropdown &&
                  searchQuery &&
                  filteredMembres.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                      <div className="text-center text-gray-500">
                        <UserIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p>Aucun membre trouvé pour "{searchQuery}"</p>
                        <p className="text-sm mt-1">
                          Essayez un autre nom ou prénom
                        </p>
                      </div>
                    </div>
                  )}

                {/* Indicateur de sélection */}
                {selectedMembre && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckIcon className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-800">
                            Sélectionné: {selectedMembre.nom}{" "}
                            {selectedMembre.prenoms}
                          </div>
                          <div className="text-sm text-green-600">
                            Prêt pour l'enregistrement du décès
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-sm text-green-700 hover:text-green-900"
                      >
                        Changer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOUVELLE PERSONNE */}
      {mode === "new" && !membreFixe && !initial && (
        <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="font-medium text-gray-700">Nouvelle personne</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                name="nouveauNom"
                value={form.nouveauNom}
                required
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Nom de famille"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénoms
              </label>
              <input
                name="nouveauPrenoms"
                value={form.nouveauPrenoms}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Prénoms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Genre
              </label>
              <select
                name="nouveauGenre"
                value={form.nouveauGenre}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance
              </label>
              <input
                type="date"
                name="nouveauDateNaissance"
                value={form.nouveauDateNaissance}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="nouveauEmail"
                value={form.nouveauEmail || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="email@exemple.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                name="nouveauWhatsapp"
                value={form.nouveauWhatsapp || ""}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.length === 8) v = `225${v}`;
                  handleChange({
                    target: { name: "nouveauWhatsapp", value: v },
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="07 00 00 00 00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Famille <span className="text-red-500">*</span>
              </label>
              <select
                name="nouveauFamilleId"
                value={form.nouveauFamilleId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Sélectionner une famille...</option>
                {familles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lignée <span className="text-red-500">*</span>
              </label>
              <select
                name="nouveauLigneeId"
                value={form.nouveauLigneeId}
                onChange={handleChange}
                disabled={!form.nouveauFamilleId || loadingLignees}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingLignees
                    ? "Chargement..."
                    : "Sélectionner une lignée..."}
                </option>
                {lignees.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* DATE DU DÉCÈS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date du décès <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="date"
            name="dateDeces"
            value={form.dateDeces}
            onChange={handleChange}
            required
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* MOTIF */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Motif / Circonstances
        </label>
        <textarea
          name="motif"
          value={form.motif}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          placeholder="Décrire les circonstances du décès..."
        />
      </div>

      {/* BOUTONS */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={mode === "existing" && !form.membreId}
          className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {initial ? (
            <>
              <CheckIcon className="w-5 h-5" />
              Enregistrer les modifications
            </>
          ) : (
            <>
              <span className="font-medium">Ajouter le décès</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
