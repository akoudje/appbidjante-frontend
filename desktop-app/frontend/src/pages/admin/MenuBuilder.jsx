import React, { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import * as FaIcons from "react-icons/fa";
import * as GiIcons from "react-icons/gi";
import * as MdIcons from "react-icons/md";
import * as HiIcons from "react-icons/hi2";
import * as HeroIconsOutline from "@heroicons/react/24/outline";

// -------------------- ICON RESOLVER --------------------
function getDynamicIcon(name, className = "w-6 h-6 text-gray-700") {
  if (!name) return null;

  const libs = [FaIcons, GiIcons, MdIcons, HiIcons, HeroIconsOutline];
  for (const lib of libs) {
    if (lib[name]) {
      const Icon = lib[name];
      return <Icon className={className} />;
    }
  }
  return <span className="text-gray-500">?</span>;
}

// -------------------- DND WRAPPERS --------------------
const ItemTypes = { MENU: "menu" };

function DraggableItem({ item, index, moveItem, children }) {
  const [, drag] = useDrag(() => ({
    type: ItemTypes.MENU,
    item: { index },
  }));
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.MENU,
    hover(dragged) {
      if (dragged.index !== index) {
        moveItem(dragged.index, index);
        dragged.index = index;
      }
    },
  }));
  return (
    <div ref={(node) => drag(drop(node))} className="cursor-move">
      {children}
    </div>
  );
}

// -------------------- MAIN COMPONENT --------------------
export default function MenuBuilder() {
  const [items, setItems] = useState([]);
  const [roots, setRoots] = useState([]);
  const [childrenByParent, setChildrenByParent] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  // ---- Fetch data ----
  async function loadMenu() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/menu");
      const data = await res.json();
      setItems(data);
      hydrateMenu(data);
    } catch (e) {
      console.error("Erreur /api/menu :", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMenu();
  }, []);

  // ---- Build structure parent → children ----
  function hydrateMenu(data) {
    const r = data.filter((i) => !i.parentId);
    const map = {};
    data.forEach((i) => {
      if (i.parentId) {
        map[i.parentId] = map[i.parentId] || [];
        map[i.parentId].push(i);
      }
    });
    setRoots(r);
    setChildrenByParent(map);
  }

  // ---- Update item on server ----
  async function updateItem(id, updates) {
    try {
      await fetch(`http://localhost:4000/api/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await loadMenu();
    } catch (e) {
      console.error("PATCH error :", e);
    }
  }

  // ---- Delete ----
  async function deleteItem(id) {
    if (!confirm("Supprimer cet élément ?")) return;
    try {
      await fetch(`http://localhost:4000/api/menu/${id}`, {
        method: "DELETE",
      });
      await loadMenu();
    } catch (e) {
      console.error("DELETE error :", e);
    }
  }

  // ---- Add new item ----
  async function addItem() {
    try {
      await fetch(`http://localhost:4000/api/menu/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: "Nouvel élément",
          path: "/nouveau",
          order: items.length + 1,
          visible: true,
          icon: "FaUsers",
          minRole: "user",
          parentId: null,
          groupId: null,
        }),
      });
      await loadMenu();
    } catch (e) {
      console.error("POST error :", e);
    }
  }

  // ---- Local drag & drop reorder ----
  function moveItem(from, to) {
    const updated = [...roots];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    updated.forEach((item, idx) => updateItem(item.id, { order: idx + 1 }));
    setRoots(updated);
  }

  // ---- Toggle collapse ----
  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Menu Builder</h2>

          <button
            onClick={addItem}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            + Ajouter un item
          </button>
        </div>

        {/* ---------------- ROOT ITEMS ---------------- */}
        {roots
          .sort((a, b) => a.order - b.order)
          .map((item, index) => (
            <DraggableItem
              key={item.id}
              item={item}
              index={index}
              moveItem={moveItem}
            >
              <div className="bg-white border rounded-lg shadow p-4 space-y-3">
                {/* HEADER */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getDynamicIcon(item.icon)}
                  </div>

                  <input
                    value={item.label}
                    onChange={(e) =>
                      updateItem(item.id, { label: e.target.value })
                    }
                    className="font-semibold text-gray-800 bg-gray-50 px-2 rounded"
                  />

                  <button
                    className="ml-auto px-3 py-1 text-xs bg-red-100 text-red-700 rounded"
                    onClick={() => deleteItem(item.id)}
                  >
                    Supprimer
                  </button>
                </div>

                {/* PATH / ROLE */}
                <div className="flex items-center gap-3">
                  <input
                    value={item.path || ""}
                    onChange={(e) =>
                      updateItem(item.id, { path: e.target.value })
                    }
                    className="text-sm px-2 py-1 bg-gray-50 rounded border w-64"
                  />

                  <select
                    value={item.minRole}
                    onChange={(e) =>
                      updateItem(item.id, { minRole: e.target.value })
                    }
                    className="text-sm px-2 py-1 bg-gray-50 border rounded"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.visible}
                      onChange={(e) =>
                        updateItem(item.id, { visible: e.target.checked })
                      }
                    />
                    Visible
                  </label>

                  {childrenByParent[item.id]?.length > 0 && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="ml-auto text-blue-600 text-sm"
                    >
                      {expanded[item.id] ? "Réduire" : "Voir sous-menus"}
                    </button>
                  )}
                </div>

                {/* ---------------- CHILDREN ---------------- */}
                {expanded[item.id] && (
                  <div className="ml-10 border-l pl-5 space-y-3 animate-fade-in">
                    {childrenByParent[item.id]
                      ?.sort((a, b) => a.order - b.order)
                      .map((child) => (
                        <div
                          key={child.id}
                          className="bg-gray-50 border rounded p-3 flex items-center gap-3"
                        >
                          {getDynamicIcon(child.icon)}

                          <input
                            value={child.label}
                            onChange={(e) =>
                              updateItem(child.id, {
                                label: e.target.value,
                              })
                            }
                            className="font-medium text-gray-800 bg-white px-2 rounded"
                          />

                          <input
                            value={child.path || ""}
                            onChange={(e) =>
                              updateItem(child.id, {
                                path: e.target.value,
                              })
                            }
                            className="text-sm bg-white border rounded px-2 py-1 w-52"
                          />

                          <button
                            className="ml-auto px-3 py-1 bg-red-100 text-red-700 text-xs rounded"
                            onClick={() => deleteItem(child.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </DraggableItem>
          ))}
      </div>
    </DndProvider>
  );
}
