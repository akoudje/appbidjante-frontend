// src/components/amendes/MembreSelect.jsx

import { useEffect, useState } from "react";
import { apiGet } from "@/utils/api";
import { Combobox } from "@headlessui/react";

export default function MembreSelect({ value, onChange, disabled, error }) {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadMembres();
  }, []);

  const loadMembres = async () => {
    try {
      setLoading(true);
      const data = await apiGet("/membres?statut=ACTIF&include=categorie,lignee");
      const membresTries = (data || []).sort((a, b) => {
        const nomCompare = (a.nom || '').localeCompare(b.nom || '');
        if (nomCompare !== 0) return nomCompare;
        return (a.prenom || '').localeCompare(b.prenom || '');
      });
      setMembres(membresTries);
    } catch (error) {
      console.error("Erreur chargement membres:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembres = query === ''
    ? membres
    : membres.filter((membre) => {
        const searchString = `${membre.nom} ${membre.prenom} ${membre.categorie?.nom || ''} ${membre.matricule || ''}`.toLowerCase();
        return searchString.includes(query.toLowerCase());
      });

  const getDisplayName = (membre) => {
    let display = `${membre.nom || ''} ${membre.prenom || ''}`.trim();
    if (membre.categorie?.nom) {
      display += ` (${membre.categorie.nom})`;
    }
    if (membre.matricule) {
      display += ` - ${membre.matricule}`;
    }
    return display;
  };

  const selectedMembre = membres.find(m => m.id === value);

  return (
    <div className="relative">
      <Combobox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Combobox.Input
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            displayValue={(membreId) => {
              const m = membres.find(x => x.id === membreId);
              return m ? getDisplayName(m) : "";
            }}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un membre..."
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            ▼
          </Combobox.Button>
        </div>
        
        {loading ? (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg">
            <div className="px-4 py-2 text-gray-500">Chargement...</div>
          </div>
        ) : (
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg">
            {filteredMembres.length === 0 && query !== '' ? (
              <div className="px-4 py-2 text-gray-500">Aucun membre trouvé</div>
            ) : (
              filteredMembres.map((membre) => (
                <Combobox.Option
                  key={membre.id}
                  value={membre.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-4 pr-4 ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex flex-col">
                        <span className={`font-medium ${selected ? 'underline' : ''}`}>
                          {membre.nom} {membre.prenom}
                        </span>
                        <div className="flex gap-2 text-sm">
                          {membre.categorie?.nom && (
                            <span className={active ? 'text-indigo-100' : 'text-gray-500'}>
                              {membre.categorie.nom}
                            </span>
                          )}
                          {membre.matricule && (
                            <span className={active ? 'text-indigo-100' : 'text-gray-500'}>
                              - {membre.matricule}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        )}
      </Combobox>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

