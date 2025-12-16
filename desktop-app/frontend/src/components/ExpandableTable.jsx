// frontend/src/components/ExpandableTable.jsx
import { useState } from "react";

export default function ExpandableTable({ columns, data, renderExpanded }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          {/* Colonne vide pour bouton expand */}
          <th className="w-10"></th>

          {columns.map((col, index) => (
            <th key={index} className="px-4 py-2 text-left">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row) => {
          const isOpen = expandedId === row.id;

          return (
            <>
              {/* Ligne principale */}
              <tr
                key={row.id}
                className={`
                  border-t border-gray-300
                  hover:bg-gray-50 transition
                `}
              >
                <td className="px-2">
                  <button
                    onClick={() => toggle(row.id)}
                    className="text-gray-600 hover:text-black"
                  >
                    {isOpen ? "▼" : "▶"}
                  </button>
                </td>

                {columns.map((col, i) => (
                  <td key={i} className="px-4 py-2">
                    {col.cell ? col.cell({ row }) : row[col.accessorKey]}
                  </td>
                ))}
              </tr>

              {/* Ligne enfant (collapse) */}
              {isOpen && (
                <tr className="bg-gray-50">
                  <td colSpan={columns.length + 1} className="p-4">
                    {renderExpanded(row)}
                  </td>
                </tr>
              )}
            </>
          );
        })}
      </tbody>
    </table>
  );
}
