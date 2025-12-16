// frontend/src/components/VillageMapCard.jsx

import { UsersIcon } from "@heroicons/react/24/outline";

const colors = [
  "bg-blue-100 border-blue-300",
  "bg-green-100 border-green-300",
  "bg-purple-100 border-purple-300",
  "bg-orange-100 border-orange-300",
  "bg-red-100 border-red-300",
  "bg-yellow-100 border-yellow-300",
  "bg-cyan-100 border-cyan-300",
  "bg-pink-100 border-pink-300",
  "bg-indigo-100 border-indigo-300",
];

export default function VillageMapCard({ famille, onClick }) {
  const color = colors[famille.index ?? 0] || colors[0];

  const nbLignees = famille.lignees.length;
  const nbMembres = famille.lignees.reduce(
    (s, l) => s + l.membres.length,
    0
  );

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-4 cursor-pointer hover:shadow-lg transition ${color}`}
    >
      <div className="flex items-center gap-2">
        <UsersIcon className="w-6 h-6 text-gray-700" />
        <h2 className="font-bold text-lg">{famille.nom}</h2>
      </div>

      <div className="mt-3 text-sm text-gray-700">
        <p>Lignées : {nbLignees}</p>
        <p>Membres : {nbMembres}</p>
      </div>
    </div>
  );
}
