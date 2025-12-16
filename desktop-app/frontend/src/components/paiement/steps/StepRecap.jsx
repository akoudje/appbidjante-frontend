// src/components/paiement/steps/StepRecap.jsx

import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  CheckIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  EyeIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ================= HOOKS PERSONNALISÉS =================
const usePaiementCalculations = (paiementResult, paiementData) => {
  return useMemo(() => {
    const totalPaye = paiementResult.reduce((s, p) => s + (p.montant || 0), 0);
    const montantTotalAPayer = paiementData?.montantTotal || 0;
    const soldeRestant = Math.max(0, montantTotalAPayer - totalPaye);
    
    return { totalPaye, montantTotalAPayer, soldeRestant };
  }, [paiementResult, paiementData]);
};

const usePdfActions = (paiementId, membreEmail) => {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const handlePdfAction = async (actionType, endpoint, options = {}) => {
    try {
      setLoadingAction(actionType);
      const res = await fetch(endpoint, options);
      
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      
      return await res.blob();
    } catch (error) {
      toast.error(`Erreur lors de ${actionType}`);
      throw error;
    } finally {
      setLoadingAction(null);
    }
  };

  const previewPdf = async () => {
    try {
      const blob = await handlePdfAction(
        "preview",
        `/api/paiements/${paiementId}/receipt`
      );
      setPdfPreviewUrl(URL.createObjectURL(blob));
    } catch {
      // Error already handled
    }
  };

  const downloadPdf = async () => {
    try {
      const blob = await handlePdfAction(
        "download",
        `/api/paiements/${paiementId}/receipt`
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu_${Date.now()}.pdf`;
      a.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      // Error already handled
    }
  };

  const sendPdfByEmail = async () => {
    if (!membreEmail) {
      toast.error("Aucune adresse email disponible");
      return;
    }

    try {
      await handlePdfAction(
        "email",
        `/api/paiements/${paiementId}/send-receipt`,
        { method: "POST" }
      );
      toast.success("Reçu envoyé par email avec succès");
    } catch {
      // Error already handled
    }
  };

  return {
    pdfPreviewUrl,
    loadingAction,
    previewPdf,
    downloadPdf,
    sendPdfByEmail,
    setPdfPreviewUrl,
  };
};

// ================= COMPOSANTS DÉCOUPÉS =================
const RecapHeader = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center"
  >
    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
      <CheckIcon className="w-10 h-10 text-emerald-600" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900">
      Paiement effectué avec succès !
    </h2>
    <p className="text-gray-600 mt-2">
      Les contributions ont été enregistrées avec succès.
    </p>
  </motion.div>
);

const RecapTable = ({ paiementResult, formatDateShort }) => (
  <div className="overflow-x-auto border border-gray-200 rounded-xl mb-8">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
        <tr>
          <th className="px-6 py-4 text-center">N°</th>
          <th className="px-6 py-4">Motif</th>
          <th className="px-6 py-4 text-right">Montant</th>
          <th className="px-6 py-4 text-center">Date</th>
        </tr>
      </thead>
      <tbody>
        {paiementResult.map((p, i) => (
          <tr key={i} className="border-t">
            <td className="px-6 py-4 text-center">{i + 1}</td>
            <td className="px-6 py-4">{p.motif}</td>
            <td className="px-6 py-4 text-right font-semibold text-green-600">
              {p.montant.toLocaleString()} FCFA
            </td>
            <td className="px-6 py-4 text-center">{formatDateShort(p.date)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ActionButtons = ({ actions }) => (
  <div className="flex flex-wrap gap-4 justify-center">
    {actions.map((action, index) => (
      <ActionButton key={index} {...action} />
    ))}
  </div>
);

const PdfPreviewModal = ({ pdfPreviewUrl, onClose }) => (
  <AnimatePresence>
    {pdfPreviewUrl && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
      >
        <div className="bg-white w-[90vw] h-[90vh] rounded-xl overflow-hidden relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white p-2 rounded-full"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <iframe src={pdfPreviewUrl} className="w-full h-full" title="Aperçu PDF" />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ================= COMPOSANTS HELPER (inchangés) =================
const Info = ({ label, value }) => (
  <div className="bg-blue-50 p-4 rounded-lg">
    <p className="text-xs text-blue-600 font-semibold uppercase">{label}</p>
    <p className="font-bold text-gray-900">{value}</p>
  </div>
);

const SummaryCard = ({ title, value, subtitle, color }) => {
  const colors = {
    green: "bg-green-50 border-green-200 text-green-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };

  return (
    <div className={`p-6 border rounded-xl ${colors[color]}`}>
      <p className="font-bold text-lg">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1">{subtitle}</p>
    </div>
  );
};

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "secondary",
  loading = false,
  disabled = false,
}) => {
  const variants = {
    secondary: "bg-gray-100 hover:bg-gray-200",
    outline: "border border-gray-300 hover:bg-gray-50",
    success: "bg-green-600 hover:bg-green-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-6 py-3 rounded-xl flex items-center gap-3 font-medium ${variants[variant]} disabled:opacity-50`}
    >
      <Icon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
};

// ================= COMPOSANT PRINCIPAL =================
export default function StepRecap({ wizardData, onFinish, onRestart, onBack }) {
  const { membre, categorie, paiementResult = [], paiementData, paiementId } = wizardData;
  const recapRef = useRef(null);
  
  const { totalPaye, soldeRestant } = usePaiementCalculations(paiementResult, paiementData);
  const {
    pdfPreviewUrl,
    loadingAction,
    previewPdf,
    downloadPdf,
    sendPdfByEmail,
    setPdfPreviewUrl,
  } = usePdfActions(paiementId, membre?.email);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatDateShort = (date) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const actions = [
    { icon: ArrowLeftIcon, label: "Retour", onClick: onBack, variant: "outline" },
    {
      icon: loadingAction === "email" ? ArrowPathIcon : PaperAirplaneIcon,
      label: "Envoyer par email",
      onClick: sendPdfByEmail,
      loading: loadingAction === "email",
      disabled: !membre?.email,
    },
    {
      icon: loadingAction === "preview" ? ArrowPathIcon : EyeIcon,
      label: "Aperçu PDF",
      onClick: previewPdf,
      loading: loadingAction === "preview",
    },
    {
      icon: loadingAction === "download" ? ArrowPathIcon : ArrowDownTrayIcon,
      label: "Télécharger PDF",
      onClick: downloadPdf,
      loading: loadingAction === "download",
    },
    { icon: CheckIcon, label: "Terminer", onClick: onFinish, variant: "success" },
  ];

  return (
    <div className="space-y-8">
      <RecapHeader />
      
      <motion.div
        ref={recapRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg"
      >
        <div className="text-center mb-8 border-b pb-6">
          <h3 className="text-2xl font-bold text-blue-800">
            RÉCAPITULATIF DE PAIEMENT
          </h3>
          <p className="text-gray-600 font-medium mt-2">
            Date : {formatDate(new Date())}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Info label="Membre" value={`${membre.nom} ${membre.prenoms}`} />
          <Info label="Catégorie" value={categorie?.label} />
          <Info label="Mode de paiement" value={paiementData?.mode} />
          <Info
            label="Référence"
            value={paiementData?.reference || "Non spécifiée"}
          />
        </div>

        <RecapTable paiementResult={paiementResult} formatDateShort={formatDateShort} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SummaryCard
            title="TOTAL PAYÉ"
            value={`${totalPaye.toLocaleString()} FCFA`}
            color="green"
            subtitle={`${paiementResult.length} contribution(s) réglée(s)`}
          />

          {soldeRestant > 0 && (
            <SummaryCard
              title="SOLDE RESTANT"
              value={`${soldeRestant.toLocaleString()} FCFA`}
              color="amber"
              subtitle="Montant restant à payer"
            />
          )}
        </div>

        <p className="text-center text-sm text-gray-500 pt-4 border-t">
          Le notable chargé des contributions
        </p>
      </motion.div>

      <ActionButtons actions={actions} />
      <PdfPreviewModal pdfPreviewUrl={pdfPreviewUrl} onClose={() => setPdfPreviewUrl(null)} />
    </div>
  );
}