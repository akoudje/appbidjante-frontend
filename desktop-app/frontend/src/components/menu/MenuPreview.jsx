import React, { useEffect, useState } from "react";

// Import dynamiques possibles
import * as FaIcons from "react-icons/fa";
import * as GiIcons from "react-icons/gi";
import * as MdIcons from "react-icons/md";
import * as HiIcons from "react-icons/hi2";
import * as HeroIconsOutline from "@heroicons/react/24/outline";

// Fonction qui résout dynamiquement les icônes depuis leur nom
function getDynamicIcon(name) {
  if (!name) return null;

  const libraries = [
    FaIcons,
    GiIcons,
    MdIcons,
    HiIcons,
    HeroIconsOutline,
  ];

  for (const lib of libraries) {
    if (lib[name]) {
      const Icon = lib[name];
      return <Icon className="w-6 h-6 text-gray-700" />;
    }
  }

  return <span className="text-gray-500">?</span>;
}

export default function MenuPreview() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchMenu() {
    try {
      const res = await fetch("http://localhost:4000/api/menu");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Erreur GET /api/menu :", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMenu();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-600 animate-pulse">
        Chargement du menu…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="p-6 text-gray-500">
        Aucun élément à afficher.
      </div>
    );
  }

  // Fonction pour organiser les items parent → enfants
  const roots = items.filter((i) => !i.parentId);
  const childrenByParent = {};

  items.forEach((item) => {
    if (item.parentId) {
      childrenByParent[item.parentId] = childrenByParent[item.parentId] || [];
      childrenByParent[item.parentId].push(item);
    }
  });

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">
        Aperçu du Menu
      </h2>

      {roots.sort((a, b) => a.order - b.order).map((item) => {
        const childs = childrenByParent[item.id] || [];

        return (
          <div
            key={item.id}
            className="bg-white shadow rounded-lg p-4 border border-gray-200 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              {/* Icône */}
              <div className="p-2 bg-gray-100 rounded-lg">
                {getDynamicIcon(item.icon)}
              </div>

              {/* Texte principal */}
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-gray-900">
                  {item.label}
                </span>

                <span className="text-sm text-gray-500">{item.path}</span>
              </div>

              {/* Etat visible / caché */}
              <span
                className={`ml-auto px-3 py-1 text-xs rounded-full ${
                  item.visible
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {item.visible ? "Visible" : "Caché"}
              </span>

              {/* Rôle */}
              <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                {item.minRole}
              </span>
            </div>

            {/* Enfants (sous-menus) */}
            {childs.length > 0 && (
              <div className="mt-3 ml-10 border-l pl-5 space-y-2 animate-fade-in">
                {childs
                  .sort((a, b) => a.order - b.order)
                  .map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-md"
                    >
                      <div className="p-2 bg-gray-200 rounded-lg">
                        {getDynamicIcon(child.icon)}
                      </div>

                      <span className="font-medium text-gray-800">
                        {child.label}
                      </span>

                      <span className="text-xs text-gray-500">
                        {child.path}
                      </span>

                      <span
                        className={`ml-auto px-2 py-1 text-xs rounded-full ${
                          child.visible
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {child.visible ? "Visible" : "Caché"}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
