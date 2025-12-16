// src/components/paiement/steps/StepCategory.jsx
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
  MagnifyingGlassIcon,
  XMarkIcon 
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

function StepCategoryInner(
  { categories = [], onSelect, loading = false, initialValue = null },
  ref
) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
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
    if (!debouncedQuery) return categories;
    const q = debouncedQuery.toLowerCase();
    return categories.filter((c) => 
      c.label.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, debouncedQuery]);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Étape 1 : Choisir une catégorie
        </h2>
        <p className="text-gray-600">
          Sélectionnez la catégorie du membre pour continuer
        </p>
      </div>

      <Combobox value={selected} onChange={handleChange}>
        <div className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Combobox.Input
              ref={inputRef}
              className="w-full pl-12 pr-12 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              displayValue={(c) => (c ? c.label : query)}
              placeholder="Rechercher une catégorie..."
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              disabled={loading}
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
                    <p className="mt-2 text-gray-500">Chargement...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p className="font-medium">Aucune catégorie trouvée</p>
                    <p className="text-sm mt-1">Essayez d'autres termes de recherche</p>
                  </div>
                ) : (
                  <>
                    {debouncedQuery && (
                      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                        {filtered.length} résultat{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
                      </div>
                    )}
                    {filtered.map((c) => (
                      <Combobox.Option
                        key={c.id}
                        value={c}
                        className={({ active }) =>
                          `p-4 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors
                          ${active ? 'bg-blue-50' : ''}`
                        }
                      >
                        {({ selected: isSel }) => (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 flex items-center gap-2">
                                {c.label}
                                {isSel && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    Sélectionnée
                                  </span>
                                )}
                              </div>
                              {c.description && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {c.description}
                                </div>
                              )}
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
          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <div className="font-medium text-blue-900">
                  Catégorie sélectionnée
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {selected.label}
                </div>
                {selected.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {selected.description}
                  </div>
                )}
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

      {/* Catégories populaires */}
      {!selected && categories.length > 0 && (
        <div className="mt-8">
          <h3 className="font-medium text-gray-700 mb-3">
            Catégories fréquemment utilisées
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleChange(cat)}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="font-medium text-gray-900">{cat.label}</div>
                {cat.description && (
                  <div className="text-sm text-gray-600 truncate">
                    {cat.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const StepCategory = forwardRef(StepCategoryInner);
export default StepCategory;