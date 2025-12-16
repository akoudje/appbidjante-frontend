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
  XMarkIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

function StepLigneeInner(
  { lignees = [], famille = null, onSelect, loading = false, initialValue = null },
  ref
) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  // expose methods
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

  // filtering
  const filtered = useMemo(() => {
    let list = lignees;

    if (famille) {
      list = list.filter((l) => String(l.familleId) === String(famille.id));
    }

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter((l) => l.nom.toLowerCase().includes(q));
    }

    return list;
  }, [lignees, famille, debouncedQuery]);

  // secure selection
  const handleChange = (val) => {
    setSelected(val);

    if (val?.id) {
      onSelect?.(val);
    } else {
      onSelect?.(null);
    }

    setIsOpen(false);
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
    onSelect?.(null);
    inputRef.current?.focus();
  };

  if (!famille) {
    return (
      <div className="text-center py-12">
        <ExclamationCircleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Sélectionnez d'abord une famille
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Étape 2 : Choisir une lignée
        </h2>
        <p className="text-gray-600">
          Lignées de la grande famille{" "}
          <span className="font-semibold text-blue-600">
            {famille?.nom}
          </span>
        </p>
      </div>

      <Combobox value={selected} onChange={handleChange}>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

          <Combobox.Input
            ref={inputRef}
            className="w-full pl-12 pr-12 py-3 text-lg border rounded-xl"
            displayValue={(l) => (l ? l.nom : query)}
            placeholder="Rechercher une lignée..."
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

          <AnimatePresence>
            {isOpen && (
              <Combobox.Options
                static
                as={motion.div}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border max-h-96 overflow-auto"
              >
                {loading ? (
                  <div className="p-6 text-center">Chargement...</div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Aucune lignée trouvée
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                      {filtered.length} lignée(s)
                    </div>

                    {filtered.map((l) => (
                      <Combobox.Option
                        key={l.id}
                        value={l}
                        className={({ active }) =>
                          `p-4 cursor-pointer border-b ${
                            active ? "bg-blue-50" : ""
                          }`
                        }
                      >
                        {({ selected: isSel }) => (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UsersIcon className="w-6 h-6 text-blue-600" />
                              </div>

                              <div className="font-medium">{l.nom}</div>
                            </div>

                            {isSel && (
                              <CheckIcon className="w-6 h-6 text-blue-600" />
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
          className="p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-blue-900">
                Lignée sélectionnée
              </div>
              <div className="text-lg font-bold">{selected.nom}</div>
            </div>

            <button
              onClick={clearSelection}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              Changer
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default forwardRef(StepLigneeInner);
