// frontend/src/components/TreeView.jsx
import { useState } from "react";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

export default function TreeView({ data = [] }) {
  return (
    <div className="space-y-2">
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucune donnée.</p>
      ) : (
        data.map((famille) => <FamilyNode key={famille.id} node={famille} />)
      )}
    </div>
  );
}

/* ----------------------------- */
/*   NIVEAU 1 : GRANDE FAMILLE   */
/* ----------------------------- */
function FamilyNode({ node }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded bg-white">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 select-none"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDownIcon className="w-5 h-5 text-gray-700" />
        ) : (
          <ChevronRightIcon className="w-5 h-5 text-gray-700" />
        )}

        <UsersIcon className="w-5 h-5 text-blue-700" />
        <span className="font-semibold">{node.nom}</span>

        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          {node.lignees.length} lignées
        </span>
      </div>

      {open && (
        <div className="pl-6 py-2 space-y-2 border-t bg-gray-50">
          {node.lignees.map((l) => (
            <LigneeNode key={l.id} node={l} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- */
/*        NIVEAU 2 : LIGNEE      */
/* ----------------------------- */
function LigneeNode({ node }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded bg-white">
      <div
        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDownIcon className="w-4 h-4 text-gray-700" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-gray-700" />
        )}

        <span className="font-medium text-gray-700">{node.nom}</span>

        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          {node.membres.length} membres
        </span>
      </div>

      {open && (
        <div className="pl-6 py-2 space-y-1 bg-gray-50 border-t">
          {node.membres.map((m) => (
            <MemberNode key={m.id} node={m} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- */
/*         NIVEAU 3 : MEMBRE     */
/* ----------------------------- */
function MemberNode({ node }) {
  return (
    <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded select-none">
      <UserIcon className="w-4 h-4 text-gray-600" />
      <span className="text-gray-700">
        {node.nom} {node.prenoms}
      </span>
      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
        {node.statut}
      </span>
    </div>
  );
}
