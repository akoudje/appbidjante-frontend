// src/components/StatusBadgeTo.jsx

export default function StatusBadgeTo({
  value,
  status,
  statut,
  colors = {},
}) {
  const s = value || status || statut;

  if (!s) {
    return (
      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-400">
        —
      </span>
    );
  }

  const color = colors[s] || "gray";

  const colorMap = {
    gray: "bg-gray-100 text-gray-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    amber: "bg-amber-100 text-amber-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium
        ${colorMap[color] || colorMap.gray}`}
    >
      {s}
    </span>
  );
}
