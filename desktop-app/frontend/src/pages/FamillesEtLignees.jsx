// frontend/src/pages/FamillesEtLignees.jsx

import { useEffect, useState } from "react";
import { apiGet } from "../utils/api";
import FamillesTab from "./FamillesTab";
import LigneesTab from "./LigneesTab";

export default function FamillesEtLignees() {
  const [activeTab, setActiveTab] = useState("familles");
  const [dataTree, setDataTree] = useState([]);

  const loadTreeData = async () => {
    try {
      const familles = await apiGet("/familles"); // include : { lignees : { include : { membres } } }
      setDataTree(familles);
    } catch (err) {
      console.error("Erreur arbre :", err);
    }
  };

  useEffect(() => {
    if (activeTab === "arbre") loadTreeData();
  }, [activeTab]);

  return (
    <div className="space-y-4">
      {/* Onglets */}
      <div className="flex gap-2 bg-white p-2 rounded-lg shadow border w-fit">
        <TabButton label="Grandes Familles" tab="familles" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton label="Lignées" tab="lignees" activeTab={activeTab} setActiveTab={setActiveTab} />
        
      </div>

      {/* Contenu selon onglet */}
      {activeTab === "familles" && <FamillesTab />}
      {activeTab === "lignees" && <LigneesTab />}
    </div>
  );
}

function TabButton({ label, tab, activeTab, setActiveTab }) {
  const active = activeTab === tab;
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition 
      ${active ? "bg-blue-600 text-white shadow" : "bg-gray-100 hover:bg-gray-200"}`}
    >
      {label}
    </button>
  );
}
