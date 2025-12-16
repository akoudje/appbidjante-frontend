import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  DocumentCheckIcon,
  CalendarIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import { toast } from "sonner";

export default function StepPaymentLignee({
  lignee,
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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTotalInput(totalSelectedAmount.toString());
  }, [totalSelectedAmount]);

  const total = useMemo(
    () => (totalInput !== "" ? Number(totalInput) || 0 : totalSelectedAmount),
    [totalInput, totalSelectedAmount]
  );

  const paymentModes = [
    { value: "Espèces", icon: BanknotesIcon, color: "bg-green-100 text-green-600" },
    { value: "Mobile Money", icon: DevicePhoneMobileIcon, color: "bg-purple-100 text-purple-600" },
    { value: "Virement", icon: CreditCardIcon, color: "bg-blue-100 text-blue-600" },
    { value: "Chèque", icon: DocumentCheckIcon, color: "bg-yellow-100 text-yellow-600" },
  ];

  const validateForm = () => {
    const e = {};

    if (total <= 0) e.total = "Le montant doit être supérieur à 0";

    if (!date) e.date = "La date est requise";

    if (["Mobile Money", "Virement", "Chèque"].includes(mode)) {
      if (!reference.trim()) e.reference = "Référence requise";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateForm()) return toast.error("Corrige les erreurs");

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
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Étape 4 : Paiement Lignée
        </h2>
        <p className="text-gray-600">Veuillez renseigner les détails du paiement de la lignée</p>
      </div>

      {/* résumé */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* section résumé */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCardIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Résumé</div>
              <div className="text-sm text-gray-600">
                {cotisationsSelected.length} cotisation(s)
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total sélectionné</span>
              <span className="font-semibold">
                {totalSelectedAmount.toLocaleString()} FCFA
              </span>
            </div>

            <div className="flex justify-between">
              <span>Solde restant</span>
              <span className="font-semibold">
                {soldeRestant.toLocaleString()} FCFA
              </span>
            </div>

            <div className="pt-3 border-t flex justify-between font-bold text-lg">
              <span>À payer</span>
              <span className="text-blue-600">
                {total.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* section lignée */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <div className="font-medium text-gray-900 mb-2">Lignée</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="font-semibold">{lignee?.nom}</div>
              {lignee?.famille?.nom && (
                <div className="text-sm text-gray-600">
                  Famille : {lignee.famille.nom}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* modes */}
        <div>
          <label className="block font-medium mb-4">Mode de paiement *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {paymentModes.map((pm) => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setMode(pm.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    mode === pm.value
                      ? "border-blue-500 bg-white shadow-md"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full ${pm.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-medium">{pm.value}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* montant */}
        <div>
          <label className="block font-medium mb-2">Montant *</label>
          <input
            type="number"
            min={0}
            max={soldeRestant}
            step={500}
            value={totalInput}
            onChange={(e) => setTotalInput(e.target.value)}
            className="w-full p-4 border-2 rounded-xl"
          />
        </div>

        {/* référence */}
        {["Mobile Money", "Virement", "Chèque"].includes(mode) && (
          <div>
            <label className="block font-medium mb-2">Référence *</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full p-4 border-2 rounded-xl"
            />
          </div>
        )}

        {/* date & commentaire */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-2">Date *</label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 border-2 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">
              Commentaire (optionnel)
            </label>

            <textarea
              rows={3}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="w-full p-4 border-2 rounded-xl"
            />
          </div>
        </div>

        {/* actions */}
        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border-2 rounded-xl"
          >
            <ArrowLeftIcon className="w-5 h-5 inline-block mr-2" />
            Retour
          </button>

          <button
            type="submit"
            className="px-8 py-3 bg-green-600 text-white rounded-xl"
            disabled={isSubmitting || loading}
          >
            Valider {total.toLocaleString()} FCFA
          </button>
        </div>
      </form>
    </div>
  );
}
