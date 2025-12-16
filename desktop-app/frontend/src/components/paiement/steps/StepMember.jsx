// src/components/paiement/steps/StepMember.jsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Combobox } from "@headlessui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  XMarkIcon,
  FunnelIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

function StepMemberInner(
  { members = [], categorie = null, onSelect, loading = false, initialValue = null },
  ref
) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    statut: "Actif",
  });
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.select();
      setIsOpen(true);
    },
    reset: () => {
      setSelected(null);
      setQuery("");
      setIsOpen(false);
      onSelect?.(null);
    },
  }));

  const filtered = useMemo(() => {
    let list = members;
    
    // Filtrer par catégorie
    if (categorie) {
      list = list.filter((m) => String(m.categorieId) === String(categorie.id));
    }
    
    // Filtrer par statut
    if (filters.statut) {
      list = list.filter((m) => m.statutMembre === filters.statut);
    }
    
    // Filtrer par recherche textuelle
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter((m) =>
        `${m.nom} ${m.prenoms} ${m.codeMembre || ''}`.toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [members, categorie, debouncedQuery, filters]);

  const handleChange = (val) => {
    setSelected(val);
    onSelect?.(val);
    setIsOpen(false);
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
    onSelect?.(null);
    inputRef.current?.focus();
  };

  if (!categorie) {
    return (
      <div className="text-center py-12">
        <ExclamationCircleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Sélectionnez d'abord une catégorie
        </h3>
        <p className="text-gray-600">
          Veuillez choisir une catégorie à l'étape précédente pour continuer
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Étape 2 : Choisir un membre
        </h2>
        <p className="text-gray-600">
          Sélectionnez un membre de la catégorie{" "}
          <span className="font-semibold text-blue-600">{categorie.label}</span>
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <FunnelIcon className="w-5 h-5" />
          <span className="font-medium">Filtres</span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={filters.statut}
                    onChange={(e) => setFilters(f => ({ ...f, statut: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="">Tous les statuts</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Combobox value={selected} onChange={handleChange} disabled={!categorie}>
        <div className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Combobox.Input
              ref={inputRef}
              className="w-full pl-12 pr-12 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              displayValue={(m) => (m ? `${m.nom} ${m.prenoms}` : query)}
              placeholder="Rechercher un membre par nom, prénom ou code..."
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              disabled={!categorie || loading}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {isOpen && (
              <Combobox.Options
                static
                as={motion.div}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-auto"
              >
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Chargement des membres...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p className="font-medium">Aucun membre trouvé</p>
                    <p className="text-sm mt-1">
                      {debouncedQuery
                        ? `Aucun résultat pour "${debouncedQuery}"`
                        : "Aucun membre disponible avec ces filtres"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                      {filtered.length} membre{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
                    </div>
                    {filtered.map((m) => (
                      <Combobox.Option
                        key={m.id}
                        value={m}
                        className={({ active }) =>
                          `p-4 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors
                          ${active ? 'bg-blue-50' : ''}`
                        }
                      >
                        {({ selected: isSel }) => (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserCircleIcon className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                  {m.nom} {m.prenoms}
                                  {isSel && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      Sélectionné
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {m.codeMembre && `Code: ${m.codeMembre} • `}
                                  Statut:{" "}
                                  <span className={`font-medium ${
                                    m.statutMembre === 'Actif' ? 'text-green-600' :
                                    m.statutMembre === 'Inactif' ? 'text-gray-600' :
                                    'text-red-600'
                                  }`}>
                                    {m.statutMembre}
                                  </span>
                                </div>
                                {m.email && (
                                  <div className="text-sm text-gray-500 truncate">
                                    📧 {m.email}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isSel && (
                              <CheckIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        )}
                      </Combobox.Option>
                    ))}
                  </>
                )}
              </Combobox.Options>
            )}
          </AnimatePresence>
        </div>
      </Combobox>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-900">
                  Membre sélectionné
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {selected.nom} {selected.prenoms}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selected.codeMembre && `Code: ${selected.codeMembre} • `}
                  Statut:{" "}
                  <span className={`font-medium ${
                    selected.statutMembre === 'Actif' ? 'text-green-600' :
                    'text-yellow-600'
                  }`}>
                    {selected.statutMembre}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            >
              Changer
            </button>
          </div>
        </motion.div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Total membres</div>
          <div className="text-2xl font-bold text-gray-900">
            {members.filter(m => String(m.categorieId) === String(categorie.id)).length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Membres actifs</div>
          <div className="text-2xl font-bold text-gray-900">
            {members.filter(m => 
              String(m.categorieId) === String(categorie.id) && 
              m.statutMembre === 'Actif'
            ).length}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 font-medium">Membres inactifs</div>
          <div className="text-2xl font-bold text-gray-900">
            {members.filter(m => 
              String(m.categorieId) === String(categorie.id) && 
              m.statutMembre !== 'Actif'
            ).length}
          </div>
        </div>
      </div>
    </div>
  );
}

const StepMember = forwardRef(StepMemberInner);
export default StepMember;