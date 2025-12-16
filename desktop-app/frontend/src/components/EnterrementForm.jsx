// src/components/EnterrementForm.jsx

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Switch } from "@headlessui/react";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import dayjs from "dayjs";
import "react-datepicker/dist/react-datepicker.css";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

import { apiGet, apiPost, apiPut } from "../utils/api";

export default function EnterrementForm({
  enterrement = null,
  deces = null,
  onSaved,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [decesList, setDecesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingDeces, setLoadingDeces] = useState(false);
  const dropdownRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    decesId: "",
    declareAuVillage: false,
    funeraillesAuVillage: false,
    enterreAuVillage: false,
    lieuEnterrement: "",
    dateEnterrement: null,
    heureEnterrement: "",
    statut: "effectue", // Par défaut "effectué"
    observations: "",
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load deceased (excluding those already buried)
  useEffect(() => {
    const loadDeces = async () => {
      setLoadingDeces(true);
      try {
        const decesData = await apiGet("/deces?withRelations=true");
        const enterrementsData = await apiGet("/enterrements?withRelations=true");
        const enterrementsDecesIds = enterrementsData
          .filter(e => !enterrement || e.id !== enterrement.id)
          .map(e => e.decesId);
        
        const filteredDeces = decesData.filter(d => 
          !enterrementsDecesIds.includes(d.id)
        );
        
        setDecesList(filteredDeces);
      } catch (err) {
        console.error("Erreur chargement décès :", err);
        toast.error("Erreur lors du chargement des décès");
      } finally {
        setLoadingDeces(false);
      }
    };
    
    if (!deces) {
      loadDeces();
    }
  }, [deces, enterrement]);

  // Initialize form
  useEffect(() => {
    if (enterrement) {
      // EDIT MODE
      const enterrementDate = enterrement.dateEnterrement 
        ? dayjs(enterrement.dateEnterrement).toDate() 
        : null;
      
      // Extraire l'heure si elle existe dans la date
      let heureEnterrement = "";
      if (enterrement.dateEnterrement) {
        const date = new Date(enterrement.dateEnterrement);
        heureEnterrement = date.toTimeString().slice(0, 5); // Format HH:mm
      }
      
      setForm({
        decesId: enterrement.decesId,
        declareAuVillage: enterrement.declareAuVillage,
        funeraillesAuVillage: enterrement.funeraillesAuVillage,
        enterreAuVillage: enterrement.enterreAuVillage,
        lieuEnterrement: enterrement.lieuEnterrement || "",
        dateEnterrement: enterrementDate,
        heureEnterrement: heureEnterrement || enterrement.heureEnterrement || "",
        statut: enterrement.statut || "effectue",
        observations: enterrement.observations || "",
      });
      
      if (enterrement.deces) {
        const m = enterrement.deces.membre;
        setSearchQuery(`${m.nom} ${m.prenoms}`);
      }
    } else if (deces) {
      // CREATE MODE WITH PREDEFINED DECEASED
      setForm({
        decesId: deces.id,
        declareAuVillage: false,
        funeraillesAuVillage: false,
        enterreAuVillage: false,
        lieuEnterrement: "",
        dateEnterrement: null,
        heureEnterrement: "",
        statut: "effectue",
        observations: "",
      });
      
      const m = deces.membre;
      setSearchQuery(`${m.nom} ${m.prenoms}`);
    } else {
      // CREATE MODE WITHOUT PREDEFINED DECEASED
      setForm({
        decesId: "",
        declareAuVillage: false,
        funeraillesAuVillage: false,
        enterreAuVillage: false,
        lieuEnterrement: "",
        dateEnterrement: null,
        heureEnterrement: "",
        statut: "effectue",
        observations: "",
      });
      setSearchQuery("");
    }
  }, [enterrement, deces]);

  // Filter deceased for autocomplete
  const filteredDeces = useMemo(() => {
    if (!searchQuery.trim()) {
      return decesList.slice(0, 10);
    }

    const query = searchQuery.toLowerCase();
    return decesList.filter(d => {
      const m = d.membre;
      const fullName = `${m.nom} ${m.prenoms}`.toLowerCase();
      const nom = m.nom.toLowerCase();
      const prenoms = m.prenoms.toLowerCase();
      const famille = m.lignee?.famille?.nom?.toLowerCase() || "";
      const lignee = m.lignee?.nom?.toLowerCase() || "";
      
      return (
        fullName.includes(query) ||
        nom.includes(query) ||
        prenoms.includes(query) ||
        famille.includes(query) ||
        lignee.includes(query)
      );
    }).slice(0, 15);
  }, [searchQuery, decesList]);

  // Handle deceased selection
  const handleSelectDeces = (decesItem) => {
    setForm({ ...form, decesId: decesItem.id });
    const m = decesItem.membre;
    setSearchQuery(`${m.nom} ${m.prenoms}`);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    setForm({ ...form, decesId: "" });
    setSearchQuery("");
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle date change (combine with time if exists)
  const handleDateChange = (date) => {
    if (date && form.heureEnterrement) {
      // Combine date with existing time
      const [hours, minutes] = form.heureEnterrement.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
    }
    setForm({ ...form, dateEnterrement: date });
  };

  // Handle time change (update date object if exists)
  const handleTimeChange = (time) => {
    setForm({ ...form, heureEnterrement: time });
    if (form.dateEnterrement && time) {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(form.dateEnterrement);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      setForm(prev => ({ ...prev, dateEnterrement: newDate }));
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.decesId) {
      return toast.error("Veuillez sélectionner un défunt");
    }

    if (!form.dateEnterrement) {
      return toast.error("Veuillez sélectionner une date d'enterrement");
    }

    // Prepare final date with time
    let finalDate = new Date(form.dateEnterrement);
    if (form.heureEnterrement) {
      const [hours, minutes] = form.heureEnterrement.split(':');
      finalDate.setHours(parseInt(hours), parseInt(minutes));
    }

    const payload = {
      decesId: form.decesId,
      declareAuVillage: form.declareAuVillage,
      funeraillesAuVillage: form.funeraillesAuVillage,
      enterreAuVillage: form.enterreAuVillage,
      lieuEnterrement: form.enterreAuVillage ? null : form.lieuEnterrement.trim(),
      dateEnterrement: finalDate.toISOString(),
      heureEnterrement: form.heureEnterrement || null,
      statut: form.statut,
      observations: form.observations.trim(),
    };

    setLoading(true);

    try {
      if (enterrement) {
        await apiPut(`/enterrements/${enterrement.id}`, payload);
        toast.success("Enterrement mis à jour avec succès");
      } else {
        await apiPost("/enterrements", payload);
        toast.success("Enterrement enregistré avec succès");
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error("Erreur enregistrement:", err);
      
      if (err.response?.data?.error?.includes("existe déjà")) {
        toast.error("Un enterrement existe déjà pour ce défunt");
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    } finally {
      setLoading(false);
    }
  };

  // Find selected deceased for display
  const selectedDeces = useMemo(() => {
    return decesList.find(d => d.id === form.decesId);
  }, [form.decesId, decesList]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* HEADER */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {enterrement ? "Modifier l'enterrement" : "Nouvel enterrement"}
        </h3>
        <p className="text-sm text-gray-500">
          Enregistrez les informations relatives à l'enterrement
        </p>
      </div>

      {/* DECEASED SELECTION */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Défunt <span className="text-red-500">*</span>
        </label>
        
        {deces ? (
          // Show directly if deceased is predefined
          <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium">
                    {deces.membre.nom} {deces.membre.prenoms}
                  </div>
                  <div className="text-sm text-gray-500">
                    Décès le {new Date(deces.dateDeces).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ComboBox with autocomplete
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!showDropdown) setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Rechercher un défunt par nom, prénom ou famille..."
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                disabled={loadingDeces}
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

            {/* Loading indicator */}
            {loadingDeces && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Chargement des décès...</span>
                </div>
              </div>
            )}

            {/* Autocomplete dropdown */}
            {showDropdown && !loadingDeces && filteredDeces.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {filteredDeces.map((decesItem) => {
                  const isSelected = form.decesId === decesItem.id;
                  const m = decesItem.membre;
                  return (
                    <div
                      key={decesItem.id}
                      onClick={() => handleSelectDeces(decesItem)}
                      className={`p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {m.nom} {m.prenoms}
                            </div>
                            <div className="text-sm text-gray-500">
                              {m.lignee?.famille?.nom || "—"} • {m.lignee?.nom || "—"}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckIcon className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Décès le {new Date(decesItem.dateDeces).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No results */}
            {showDropdown && searchQuery && !loadingDeces && filteredDeces.length === 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                <div className="text-center text-gray-500">
                  <UserIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p>Aucun défunt trouvé pour "{searchQuery}"</p>
                  <p className="text-sm mt-1">
                    Tous les décès peuvent déjà avoir un enterrement enregistré
                  </p>
                </div>
              </div>
            )}

            {/* Selection indicator */}
            {selectedDeces && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-800">
                        Sélectionné: {selectedDeces.membre.nom} {selectedDeces.membre.prenoms}
                      </div>
                      <div className="text-sm text-green-600">
                        Prêt pour l'enregistrement de l'enterrement
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-sm text-green-700 hover:text-green-900 font-medium"
                  >
                    Changer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-2 text-xs text-gray-500">
          Seuls les décès sans enterrement enregistré sont affichés
        </div>
      </div>

      {/* DATE AND TIME */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'enterrement <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <DatePicker
              selected={form.dateEnterrement}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholderText="Sélectionner une date"
              showYearDropdown
              yearDropdownItemNumber={15}
              scrollableYearDropdown
              maxDate={new Date()} // Permettre les dates passées
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Heure d'enterrement
          </label>
          <div className="relative">
            <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="time"
              value={form.heureEnterrement}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* STATUS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Statut
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, statut: "programme" })}
            className={`py-3 px-4 rounded-lg border-2 transition-all ${
              form.statut === "programme"
                ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
            }`}
          >
            <div className="flex flex-col items-center">
              <CalendarIcon className={`w-5 h-5 mb-1 ${form.statut === "programme" ? "text-blue-600" : "text-gray-500"}`} />
              <span>Programmé</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, statut: "effectue" })}
            className={`py-3 px-4 rounded-lg border-2 transition-all ${
              form.statut === "effectue"
                ? "bg-green-50 border-green-500 text-green-700 font-medium"
                : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
            }`}
          >
            <div className="flex flex-col items-center">
              <CheckIcon className={`w-5 h-5 mb-1 ${form.statut === "effectue" ? "text-green-600" : "text-gray-500"}`} />
              <span>Effectué</span>
            </div>
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {form.statut === "programme" 
            ? "L'enterrement est prévu pour une date future"
            : "L'enterrement a déjà eu lieu"}
        </p>
      </div>

      {/* BURIAL INFORMATION */}
      <div className="space-y-4">
        <SwitchRow
          label="Déclaré aux autorités"
          checked={form.declareAuVillage}
          onChange={(checked) => setForm({ ...form, declareAuVillage: checked })}
        />

        <SwitchRow
          label="Funérailles au village"
          checked={form.funeraillesAuVillage}
          onChange={(checked) => setForm({ ...form, funeraillesAuVillage: checked })}
        />

        <SwitchRow
          label="Enterré au village"
          checked={form.enterreAuVillage}
          onChange={(checked) => setForm({ ...form, enterreAuVillage: checked })}
        />

        {!form.enterreAuVillage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lieu d'enterrement
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="lieuEnterrement"
                value={form.lieuEnterrement}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Nom du cimetière ou lieu précis"
              />
            </div>
          </div>
        )}
      </div>

      {/* OBSERVATIONS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observations
        </label>
        <textarea
          name="observations"
          value={form.observations}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Informations complémentaires, détails sur la cérémonie, etc."
        />
      </div>

      {/* BUTTONS */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        
        <button
          type="submit"
          disabled={loading || !form.decesId || !form.dateEnterrement}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {enterrement ? "Mise à jour..." : "Enregistrement..."}
            </div>
          ) : enterrement ? (
            "Mettre à jour l'enterrement"
          ) : (
            "Enregistrer l'enterrement"
          )}
        </button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// SWITCH COMPONENT
// ------------------------------------------------------------
const SwitchRow = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <Switch
      checked={checked}
      onChange={onChange}
      className={`${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
    >
      <span
        className={`${
          checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform bg-white rounded-full transition-transform`}
      />
    </Switch>
  </div>
);