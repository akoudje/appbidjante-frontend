//  frontend/src/components/filters/TagFilters.jsx
export default function TagFilters({ tags, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-3 py-1 rounded-full text-sm border transition
            ${
              active === t.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
            }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
