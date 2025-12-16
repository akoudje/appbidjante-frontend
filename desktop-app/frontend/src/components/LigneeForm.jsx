// src/components/LigneeForm.jsx
import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import { apiGet } from "../utils/api";
import { 
  UserCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  HomeIcon
} from "@heroicons/react/24/outline";

export default function LigneeForm({
  initial = null,
  familles = [],
  parentFamilleId = null,
  onSubmit,
  onCancel,
}) {
  const [nom, setNom] = useState(initial?.nom || "");
  const [familleId, setFamilleId] = useState(initial?.familleId || parentFamilleId || "");
  
  // Pas besoin de chefLigneeId séparé car le nom de la lignée = nom du chef
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (initial) {
      setNom(initial.nom || "");
      setFamilleId(initial.familleId || parentFamilleId || "");
      
      // Si une lignée existe, pré-remplir la recherche avec son nom
      // (car nom de la lignée = nom du chef de lignée)
      if (initial.nom) {
        setSearchQuery(initial.nom);
      }
    } else {
      setFamilleId(parentFamilleId || "");
    }
  }, [initial, parentFamilleId]);

  // Fonction de recherche des membres par nom/prénom
  const searchMembers = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchError("");

      try {
        const response = await apiGet(
          `/membres/search/name?q=${encodeURIComponent(query)}&limit=10`
        );
        
        if (response && Array.isArray(response)) {
          setSearchResults(response);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Erreur recherche membres:", error);
        setSearchError("Erreur lors de la recherche");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchMembers(searchQuery);
    return () => searchMembers.cancel();
  }, [searchQuery, searchMembers]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Si l'utilisateur tape dans le champ de recherche,
    // cela devient aussi le nom de la lignée
    setNom(value);
    
    // Si l'utilisateur efface le champ
    if (!value.trim()) {
      setSelectedMember(null);
      setShowDropdown(false);
    }
  };

  const selectMember = (member) => {
    setSelectedMember(member);
    setSearchQuery(`${member.nom} ${member.prenoms}`);
    setNom(`${member.nom} ${member.prenoms}`);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const clearSelection = () => {
    setSelectedMember(null);
    setSearchQuery("");
    setNom("");
    setSearchResults([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nom.trim()) {
      alert("Veuillez entrer le nom de la lignée (nom du chef de lignée).");
      return;
    }

    const finalFamilleId = initial 
      ? familleId 
      : (parentFamilleId || familleId);

    if (!finalFamilleId) {
      alert("Veuillez sélectionner une grande famille.");
      return;
    }

    // Le nom de la lignée = nom du chef de lignée
    const payload = {
      nom: nom.trim(),
      familleId: finalFamilleId,
      // Vous pouvez ajouter chefLigneeId si votre modèle le supporte
      // chefLigneeId: selectedMember?.id || null
    };

    onSubmit(payload);
  };

  const selectedFamille = familles.find(f => f.id === familleId);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-[420px] max-w-full mx-auto"
    >
      <div className="bg-gradient from-amber-50 to-orange-50 rounded-lg p-4 mb-2">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {initial ? (
            <>
              <HomeIcon className="w-5 h-5" />
              Modifier la lignée
            </>
          ) : (
            <>
              <HomeIcon className="w-5 h-5" />
              Créer une nouvelle lignée
            </>
          )}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Le nom de la lignée correspond au nom du chef de lignée.
        </p>
      </div>

      {/* SECTION INFOS */}
      <div className="space-y-5">
        {/* Nom de la lignée = Chef de lignée */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chef de lignée (Nom de la lignée) *
          </label>
          
          {selectedMember ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCircleIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedMember.nom} {selectedMember.prenoms}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          {selectedMember.statutMembre}
                        </span>
                        <span className="text-xs text-gray-500">
                          {selectedMember.genre} • {selectedMember.categorie?.label || 'Non spécifié'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="p-1 hover:bg-red-100 rounded-full transition-colors"
                    title="Supprimer la sélection"
                  >
                    <XMarkIcon className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                {selectedMember.contact1 && (
                  <p className="text-xs text-gray-600 mt-2">
                    📞 {selectedMember.contact1}
                    {selectedMember.contact2 && `, ${selectedMember.contact2}`}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 italic">
                Le nom de la lignée sera : <span className="font-semibold">"{selectedMember.nom} {selectedMember.prenoms}"</span>
              </p>
              <button
                type="button"
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Changer de chef de lignée
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                           transition-all duration-200"
                  placeholder="Rechercher un membre (nom ou prénom)..."
                  required
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Indicateur de recherche */}
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                </div>
              )}

              {/* Dropdown résultats */}
              {showDropdown && (searchResults.length > 0 || searchError || searchQuery.length >= 2) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                      <p className="text-sm text-gray-500 mt-2">Recherche en cours...</p>
                    </div>
                  ) : searchError ? (
                    <div className="p-4 text-center text-red-600">
                      <ExclamationCircleIcon className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-sm">{searchError}</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500">
                        {searchQuery.length < 2 
                          ? "Tapez au moins 2 caractères..." 
                          : "Aucun membre actif trouvé"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Essayez un autre nom ou prénom
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="px-3 py-2 border-b border-gray-100 bg-amber-50">
                        <p className="text-xs font-medium text-amber-800">
                          Membres actifs ({searchResults.length})
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          Sélectionnez un chef de lignée parmi les membres vivants
                        </p>
                      </div>
                      {searchResults.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => selectMember(member)}
                          className="w-full text-left px-3 py-2.5 hover:bg-amber-50 
                                   border-b border-gray-100 last:border-0 
                                   transition-colors duration-150 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <UserCircleIcon className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {member.nom} {member.prenoms}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">{member.genre}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {member.categorie?.label || 'Non spécifié'}
                              </span>
                              {member.contact1 && (
                                <>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-500 truncate">
                                    📞 {member.contact1}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                              ${member.statutMembre === 'Actif' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'}`}>
                              {member.statutMembre}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            Seuls les membres avec statut "Actif" ou "Actif Exempté" sont affichés.
          </p>
        </div>

        {/* Sélection de la famille */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grande Famille *
          </label>
          {parentFamilleId && !initial ? (
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800">
                  Famille présélectionnée
                </p>
                <p className="text-sm text-amber-600 font-semibold">
                  {selectedFamille?.nom || "Chargement..."}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                Cette lignée sera ajoutée à la famille ci-dessus.
                Vous pouvez changer la famille si nécessaire :
              </div>
              <select
                value={familleId}
                onChange={(e) => setFamilleId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 
                         bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 
                         focus:border-amber-500 transition-all duration-200"
              >
                <option value="">— Changer de famille —</option>
                {familles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={familleId}
              onChange={(e) => setFamilleId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 
                       bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 
                       focus:border-amber-500 transition-all duration-200"
              required
            >
              <option value="">— Choisir une famille —</option>
              {familles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* INFORMATION IMPORTANTE */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <ExclamationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Information importante</p>
            <p className="text-xs text-blue-600 mt-1">
              Le nom de la lignée correspond au nom du chef de lignée. 
              Une fois la lignée créée, vous pourrez y ajouter d'autres membres.
            </p>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 
                   hover:bg-gray-50 font-medium transition-colors duration-200"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={!nom.trim() || !familleId}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 
                   hover:from-amber-700 hover:to-orange-700 text-white rounded-lg 
                   font-medium shadow-sm hover:shadow transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {initial ? "Enregistrer" : "Créer la lignée"}
        </button>
      </div>
    </form>
  );
}