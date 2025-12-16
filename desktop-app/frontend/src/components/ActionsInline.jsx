// src/components/ActionsInline.jsx
import React from "react";

export default function ActionsInline({ actions = [] }) {
  return (
    <div className="flex items-center gap-2">
      {actions.map((act, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation(); // empêche onRowClick de se déclencher
            act.onClick?.();
          }}
          title={act.label}
          className={`
            p-2 rounded hover:bg-gray-150 
            flex items-center justify-center transition
          `}
        >
          {act.icon}
        </button>
      ))}
    </div>
  );
}
