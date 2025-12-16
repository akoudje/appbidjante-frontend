// frontend/src/components/QuickActions.jsx
import { useState } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

export default function QuickActions({ actions = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (actions.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3 ${
                    action.destructive ? "text-red-600 hover:text-red-700" : "text-gray-700"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <span className="ml-auto text-xs text-gray-400">
                      {action.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
            
            {actions.length > 0 && (
              <div className="border-t border-gray-200 my-1"></div>
            )}
            
            <div className="px-4 py-2 text-xs text-gray-500">
              Actions rapides
            </div>
          </div>
        </>
      )}
    </div>
  );
}