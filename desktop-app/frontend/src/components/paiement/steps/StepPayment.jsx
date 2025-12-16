// src/components/paiement/steps/StepPayment.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  DocumentCheckIcon,
  CalendarIcon,
} from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function StepPayment({
  membre,
  cotisationsSelected = [],
  totalSelectedAmount = 0,
  submitPayments,
  onBack,
  loading = false,
  soldeRestant = 0,
}) {
  const [mode, setMode] = useState("Espèces");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalInput, setTotalInput] = useState(totalSelectedAmount.toString());
  const [reference, setReference] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Mettre à jour le total quand les cotisations changent
  useEffect(() => {
    if (totalSelectedAmount > 0) {
      setTotalInput(totalSelectedAmount.toString());
    }
  }, [totalSelectedAmount]);

  const total = useMemo(() => {
    return totalInput !== "" ? Number(totalInput) || 0 : totalSelectedAmount;
  }, [totalInput, totalSelectedAmount]);

  const paymentModes = [
    {
      value: "Espèces",
      icon: BanknotesIcon,
      color: "bg-green-100 text-green-600",
    },
    {
      value: "Mobile Money",
      icon: DevicePhoneMobileIcon,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (total <= 0) {
      newErrors.total = "Le montant doit être supérieur à 0";
    } else if (total > soldeRestant + 100) {
      newErrors.total = `Le montant dépasse le solde restant (${soldeRestant.toLocaleString()} FCFA)`;
    }

    if (!date) {
      newErrors.date = "La date est requise";
    }

    if (["Mobile Money", "Virement", "Chèque"].includes(mode)) {
      if (!reference.trim()) {
        newErrors.reference =
          "La référence est requise pour ce mode de paiement";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPayments({
        date,
        mode,
        reference,
        commentaire,
        totalAmountIfProvided: total,
      });
    } catch (err) {
      console.error("Erreur soumission paiement:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "Espèces") {
      setReference("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Étape 4 : Paiement
        </h2>
        <p className="text-gray-600">Renseignez les informations de paiement</p>
      </div>

      {/* Informations membre et résumé */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCardIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Résumé</div>
              <div className="text-sm text-gray-600">
                {cotisationsSelected.length} contribution(s) sélectionnée(s)
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total sélectionné:</span>
              <span className="font-semibold">
                {totalSelectedAmount.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Solde restant:</span>
              <span className="font-semibold">
                {soldeRestant.toLocaleString()} FCFA
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900">Montant à payer:</span>
                <span className="text-blue-600">
                  {total.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <div className="font-medium text-gray-900 mb-3">Membre concerné</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="font-bold text-green-600">
                {membre?.nom?.[0]}
                {membre?.prenoms?.[0]}
              </span>
            </div>
            <div>
              <div className="font-semibold">
                {membre?.nom} {membre?.prenoms}
              </div>
              {membre?.codeMembre && (
                <div className="text-sm text-gray-600">
                  Code: {membre.codeMembre}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Mode de paiement */}
        <div>
          <label className="block font-medium text-gray-900 mb-4">
            Mode de paiement *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
            {paymentModes.map((pm) => {
              const Icon = pm.icon;
              const isSelected = mode === pm.value;
              return (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => handleModeChange(pm.value)}
                  className={`
                    p-4 rounded-xl border-2 transition-all
                    ${
                      isSelected
                        ? `${pm.color.replace(
                            "bg-",
                            "border-"
                          )} border-2 bg-white shadow-md`
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 rounded-full ${pm.color} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-medium">{pm.value}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Montant total + Date sur la même ligne */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Montant total */}
          <div>
            <label className="block font-medium text-gray-900 mb-2">
              Montant total à payer *
            </label>
            <div className="relative">
              <input
                type="number"
                step="100"
                min="0"
                max={soldeRestant}
                value={totalInput}
                onChange={(e) => {
                  setTotalInput(e.target.value);
                  if (errors.total) {
                    setErrors((prev) => ({ ...prev, total: undefined }));
                  }
                }}
                className={`w-full p-4 text-lg border-2 rounded-xl ${
                  errors.total
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                } focus:ring-4 transition-all`}
                placeholder="0"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                FCFA
              </div>
            </div>
            {errors.total && (
              <p className="mt-2 text-sm text-red-600">{errors.total}</p>
            )}
            <div className="mt-2 text-sm text-gray-500">
              Solde maximum disponible : {soldeRestant.toLocaleString()} FCFA
            </div>
          </div>

          {/* Date du paiement */}
          <div>
            <label className="block font-medium text-gray-900 mb-2">
              Date du paiement *
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) {
                    setErrors((prev) => ({ ...prev, date: undefined }));
                  }
                }}
                className={`w-full pl-12 p-4 border-2 rounded-xl ${
                  errors.date
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                } focus:ring-4 transition-all`}
              />
            </div>
            {errors.date && (
              <p className="mt-2 text-sm text-red-600">{errors.date}</p>
            )}
          </div>
        </div>

        {/* Référence conditionnelle alignée sous les deux champs */}
        {["Mobile Money", "Virement", "Chèque"].includes(mode) && (
          <div className="mt-6">
            <label className="block font-medium text-gray-900 mb-2">
              Référence du paiement *
            </label>
            <input
              type="text"
              className={`w-full p-4 border-2 rounded-xl ${
                errors.reference
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
              } focus:ring-4 transition-all`}
              required
              value={reference}
              onChange={(e) => {
                setReference(e.target.value);
                if (errors.reference) {
                  setErrors((prev) => ({ ...prev, reference: undefined }));
                }
              }}
              placeholder={
                mode === "Mobile Money"
                  ? "Numéro de transaction"
                  : mode === "Virement"
                  ? "Référence du virement"
                  : "Numéro du chèque"
              }
            />
            {errors.reference && (
              <p className="mt-2 text-sm text-red-600">{errors.reference}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Retour aux cotisations
          </button>

          <button
            type="submit"
            disabled={isSubmitting || loading || total <= 0}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Traitement en cours...
              </div>
            ) : (
              `Valider le paiement de ${total.toLocaleString()} FCFA`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
