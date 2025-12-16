// src/components/paiementLignee/steps/StepFamille.jsx
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
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

function StepFamilleInner({ familles = [], onSelect, loading = false, initialValue = null }, ref) {
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
    if (!debouncedQuery) return familles;
    const q = debouncedQuery.toLowerCase();
    return familles.filter((f) => f.nom.toLowerCase().includes(q));
  }, [familles, debouncedQuery]);

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
          Étape 1 : Choisir une famille
        </h2>
        <p className="text-gray-600">Sélectionnez une famille du village</p>
      </div>

      <Combobox value={selected} onChange={handleChange}>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Combobox.Input
            ref={inputRef}
            className="w-full pl-12 pr-12 py-3 border rounded-xl"
            displayValue={(f) => (f ? f.nom : query)}
            placeholder="Rechercher une famille..."
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400" />
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
                {filtered.map((f) => (
                  <Combobox.Option
                    key={f.id}
                    value={f}
                    className={({ active }) =>
                      `p-4 cursor-pointer border-b ${active ? "bg-blue-50" : ""}`
                    }
                  >
                    <div className="flex justify-between">
                      <div className="font-semibold text-gray-900">{f.nom}</div>
                      {selected?.id === f.id && (
                        <CheckIcon className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            )}
          </AnimatePresence>
        </div>
      </Combobox>
    </div>
  );
}

export default forwardRef(StepFamilleInner);
