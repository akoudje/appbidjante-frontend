import React, { useMemo, useRef } from "react";
import {
  CheckIcon,
  PrinterIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import ExportButton from "../../filters/ExportButton";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function StepRecapLignee({ wizardData, onFinish, onRestart, onBack }) {
  const { lignee, famille, paiementResult = [], paiementData } = wizardData;
  const recapRef = useRef();

  const total = useMemo(
    () => paiementResult.reduce((s, p) => s + (p.montant || 0), 0),
    [paiementResult]
  );

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  /** copier */
  const copyToClipboard = () => {
    const text =
      `Paiement lignée confirmé\n` +
      `Lignée: ${lignee?.nom}\n` +
      `Famille: ${famille?.nom}\n` +
      `Total: ${total.toLocaleString()} FCFA\n` +
      `Date: ${formatDate(new Date())}\n`;

    navigator.clipboard.writeText(text);
    toast.success("Informations copiées");
  };

  /** mail (facultatif) */
  const sendEmail = () => {
    const email = lignee?.email || "";
    if (!email) return toast.error("Aucun email disponible pour cette lignée");

    const subject = encodeURIComponent(`Reçu paiement lignée ${lignee.nom}`);
    const body = encodeURIComponent(
      `Bonjour,
  
Veuillez trouver le détail du paiement effectué pour la lignée ${lignee.nom}.

Montant total: ${total.toLocaleString()} FCFA
Mode: ${paiementData?.mode}
Date: ${formatDate(new Date())}

Cordialement.`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  /** impression */
  const handlePrint = () => {
    const printContent = recapRef.current.innerHTML;
    const original = document.body.innerHTML;

    document.body.innerHTML = `
      <html><body>${printContent}</body></html>
    `;

    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  /** export */
  const exportData = paiementResult.map((p, i) => ({
    "#": i + 1,
    "Lignée": lignee?.nom,
    "Famille": famille?.nom,
    "Montant": p.montant,
    "Mode": p.mode,
    "Référence": p.reference,
    "Date": formatDate(p.date),
  }));

  const exportCols = Object.keys(exportData[0] || {}).map((k) => ({
    header: k,
    accessorKey: k,
  }));

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-10 h-10 text-green-600" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Paiement lignée effectué !
        </h2>
        <p className="text-gray-600">
          Les contributions de la lignée ont été enregistrées.
        </p>
      </motion.div>

      <div ref={recapRef} className="bg-white border rounded-2xl p-6">
        {/* infos */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold">Récapitulatif Paiement Lignée</h3>
          <p className="text-gray-600">Date: {formatDate(new Date())}</p>
        </div>

        {/* LIGNÉE */}
        <div className="flex items-center gap-4 mb-6">
          <UserGroupIcon className="w-10 h-10 text-green-600" />
          <div>
            <div className="text-lg font-bold">{lignee?.nom}</div>
            <div className="text-gray-600">Famille: {famille?.nom}</div>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="font-bold text-gray-900 mb-4">Détail</h4>
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="py-2 px-4">#</th>
                <th className="py-2 px-4">Montant</th>
                <th className="py-2 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {paiementResult.map((p, i) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{p.montant.toLocaleString()} FCFA</td>
                  <td className="p-2">{formatDate(p.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* total */}
        <div className="text-right text-2xl font-bold text-green-600">
          Total: {total.toLocaleString()} FCFA
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-t pt-6">
        <button onClick={onBack} className="btn">
          <ArrowLeftIcon className="w-4 h-4" /> Retour
        </button>

        <div className="flex gap-3">
          <button onClick={copyToClipboard} className="btn">
            <DocumentDuplicateIcon className="w-4 h-4" />
            Copier
          </button>

          <button onClick={sendEmail} className="btn">
            <EnvelopeIcon className="w-4 h-4" />
            Email
          </button>

          <button onClick={handlePrint} className="btn">
            <PrinterIcon className="w-4 h-4" />
            Imprimer
          </button>

          <ExportButton
            data={exportData}
            columns={exportCols}
            filename={`paiement_lignee_${lignee?.nom}_${Date.now()}`}
            className="btn"
          >
            <ShareIcon className="w-4 h-4" />
            Export
          </ExportButton>

          <button onClick={onFinish} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
}
