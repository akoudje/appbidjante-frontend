import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";

export default function FilterBar({
  filters = [],
  searchValue = "",
  onSearch = () => {},
  onReset = () => {},
}) {
  const hasFilters =
    !!searchValue || filters.some((f) => f.value !== "" && f.value != null);

  // Fonction pour obtenir la valeur d'affichage d'un filtre
  const getFilterDisplayValue = (filter, value) => {
    if (value === "" || value == null) return "";
    
    // Si le filtre a des options, trouver le label correspondant
    if (Array.isArray(filter.options)) {
      const option = filter.options.find(opt => {
        if (typeof opt === "object") {
          return opt.value === value;
        }
        return opt === value;
      });
      
      if (option) {
        return typeof option === "object" ? option.label : option;
      }
    }
    
    // Sinon, convertir en string
    return String(value);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 p-4 rounded-lg shadow-sm mb-4 space-y-3">
      {/* Ligne principale */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* Search box */}
        <div className="relative flex-1 min-w-[200px] max-w-[400px]">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            placeholder="Rechercher..."
            onChange={(e) => onSearch(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 pl-10 pr-3 py-2 rounded-lg w-full text-sm"
            aria-label="Rechercher"
          />
        </div>

        {/* SELECT Filters */}
        {filters.map((filter) => (
          <select
            key={filter.label}
            value={filter.value ?? ""}
            onChange={(e) => filter.onChange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm py-2 px-3 rounded-lg min-w-[150px] max-w-[250px]"
            aria-label={`Filtrer par ${filter.label}`}
          >
            <option value="">{filter.label}</option>
            {Array.isArray(filter.options) &&
              filter.options.map((option, index) => {
                const value = typeof option === "object" ? option.value : option;
                const label = typeof option === "object" ? option.label : option;
                const key = `${filter.label}-${value ?? `opt-${index}`}`;
                
                return (
                  <option key={key} value={value}>
                    {label}
                  </option>
                );
              })}
          </select>
        ))}

        {/* RESET button */}
        {hasFilters && (
          <button
            onClick={onReset}
            className="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            type="button"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* TAGS */}
      <div className="flex gap-2 flex-wrap min-h-[28px]">
        {filters.map(
          (filter) =>
            filter.value && (
              <button
                key={`${filter.label}-tag`}
                type="button"
                onClick={() => filter.onChange("")}
                className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-150"
                aria-label={`Supprimer le filtre ${filter.label}`}
              >
                {filter.label}: {getFilterDisplayValue(filter, filter.value)}
                <XMarkIcon className="w-3 h-3" />
              </button>
            )
        )}

        {searchValue && (
          <button
            type="button"
            onClick={() => onSearch("")}
            className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-150"
            aria-label="Supprimer la recherche"
          >
            Recherche : "{searchValue}"
            <XMarkIcon className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// PropTypes pour la validation
FilterBar.propTypes = {
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      options: PropTypes.array,
      onChange: PropTypes.func.isRequired,
    })
  ),
  searchValue: PropTypes.string,
  onSearch: PropTypes.func,
  onReset: PropTypes.func,
};