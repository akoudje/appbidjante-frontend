// src/components/paiement/steps/StepCotisations.jsx
import React, { useMemo, useCallback, useState } from "react";
import { 
  ArrowLeftIcon, 
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  DocumentTextIcon
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

const StepCotisations = React.memo(function StepCotisations({
  solde,
  cotisationsSelected = [],
  toggleSelection,
  updateAmount,
  onProceed,
  onBack,
  distributeAutomatically,
  loading = false,
  membre,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  const totalRestant = useMemo(() => {
    if (!solde) return 0;
    return (solde.totalDu || 0) - (solde.totalPaye || 0);
  }, [solde]);

  const totalSelected = useMemo(
    () =>
      cotisationsSelected.reduce(
        (sum, item) => sum + (Number(item.amountToPay) || 0),
        0
      ),
    [cotisationsSelected]
  );

  const handleAmountChange = useCallback(
    (cotId, value) => {
      const numValue = Math.max(0, Number(value) || 0);
      updateAmount(cotId, numValue);
    },
    [updateAmount]
  );

  const handleSelectAll = useCallback(() => {
    if (!solde?.cotisationsImpayees) return;
    
    if (selectAll) {
      // Désélectionner tout
      solde.cotisationsImpayees.forEach(cot => {
        if (cotisationsSelected.find(c => c.cotisation.id === cot.id)) {
          toggleSelection(cot);
        }
      });
    } else {
      // Sélectionner tout
      solde.cotisationsImpayees.forEach(cot => {
        if (!cotisationsSelected.find(c => c.cotisation.id === cot.id)) {
          toggleSelection(cot);
        }
      });
    }
    setSelectAll(!selectAll);
  }, [selectAll, solde, cotisationsSelected, toggleSelection]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600">Chargement des contributions...</p>
      </div>
    );
  }

  if (!solde) {
    return (
      <div className="text-center p-12 bg-yellow-50 rounded-xl border border-yellow-200">
        <ExclamationCircleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-yellow-800 mb-2">
          Aucune donnée de solde disponible
        </p>
        <p className="text-yellow-700">
          Impossible de charger les contributions du membre
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  const impayees = solde.cotisationsImpayees || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Étape 3 : Gestion des contributions
        </h2>
        <p className="text-gray-600">
          Sélectionnez les contributions à payer pour {membre?.nom} {membre?.prenoms}
        </p>
      </div>

      {/* Résumé solde amélioré */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">Total dû</div>
            <div className="text-3xl font-bold text-gray-900">
              {solde.totalDu?.toLocaleString()} FCFA
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">Total payé</div>
            <div className="text-3xl font-bold text-green-600">
              {solde.totalPaye?.toLocaleString()} FCFA
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">Reste à payer</div>
            <div className="text-3xl font-bold text-orange-600">
              {totalRestant.toLocaleString()} FCFA
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">Sélectionné</div>
            <div className="text-3xl font-bold text-blue-600">
              {totalSelected.toLocaleString()} FCFA
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {cotisationsSelected.length} Contribution(s)
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progression du paiement</span>
            <span>{Math.round((solde.totalPaye / solde.totalDu) * 100) || 0}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(solde.totalPaye / solde.totalDu) * 100}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-green-500 to-green-600"
            />
          </div>
        </div>
      </div>

      {impayees.length === 0 ? (
        <div className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-green-600 text-xl font-medium mb-2">
            🎉 Félicitations !
          </div>
          <p className="text-green-700 mb-4">
            {membre?.nom} {membre?.prenoms} est à jour sur toutes ses contributions.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
          >
            Retour au choix du membre
          </button>
        </div>
      ) : (
        <>
          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Retour
              </button>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectAll && impayees.length === cotisationsSelected.length}
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="selectAll" className="text-sm text-gray-700">
                  Tout sélectionner
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={() => distributeAutomatically(totalRestant)}
                disabled={loading || totalRestant <= 0}
              >
                <BanknotesIcon className="w-4 h-4" />
                Répartir automatiquement
              </button>

              <button
                type="button"
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={onProceed}
                disabled={cotisationsSelected.length === 0 || loading}
              >
                Poursuivre vers paiement
                <ChevronUpIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Liste des Contributions */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {impayees.map((cot) => {
              const selectedItem = cotisationsSelected.find(
                (x) => x.cotisation.id === cot.id
              );
              const isSelected = !!selectedItem;
              const amountToPay = selectedItem?.amountToPay || 0;
              const isExpanded = expandedId === cot.id;

              const isDeces =
                cot.motif &&
                cot.motif.toLowerCase().includes("décès") &&
                cot.deces;

              const defNom =
                cot.deces?.defuntNom || cot.deces?.membre?.nom || "";
              const defPrenoms =
                cot.deces?.defuntPrenoms || cot.deces?.membre?.prenoms || "";
              const dateDeces =
                cot.deces?.dateDeces || cot.deces?.date || cot.date;

              return (
                <motion.div
                  key={cot.id}
                  layout
                  className={`border rounded-xl p-4 transition-all ${
                    isSelected
                      ? "border-blue-300 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(cot)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                    />

                    {/* Contenu principal */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-gray-900">
                            {cot.motif}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <CalendarDaysIcon className="w-4 h-4" />
                              {new Date(cot.date).toLocaleDateString("fr-FR")}
                            </span>
                            {isDeces && (
                              <span className="flex items-center gap-1">
                                🕊 Défunt : {defNom} {defPrenoms}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : cot.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="w-5 h-5" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Détails dépliables */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gray-200"
                          >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-gray-500">Montant initial</div>
                                <div className="font-semibold">
                                  {cot.montant.toLocaleString()} FCFA
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Déjà payé</div>
                                <div className="font-semibold text-green-600">
                                  {(cot.montant - cot.reste).toLocaleString()} FCFA
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Reste à payer</div>
                                <div className="font-semibold text-red-600">
                                  {cot.reste.toLocaleString()} FCFA
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Échéance</div>
                                <div className="font-semibold">
                                  {cot.dateEcheance 
                                    ? new Date(cot.dateEcheance).toLocaleDateString("fr-FR")
                                    : "Non définie"}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Montant à payer */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Montant à payer</div>
                        <input
                          type="number"
                          min="0"
                          max={cot.reste}
                          step="100"
                          value={amountToPay}
                          onChange={(e) =>
                            handleAmountChange(cot.id, e.target.value)
                          }
                          disabled={!isSelected}
                          className={`w-32 p-2 border rounded-lg text-right font-bold text-lg ${
                            isSelected
                              ? "border-blue-300 bg-white focus:ring-2 focus:ring-blue-500"
                              : "border-gray-200 bg-gray-100"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Résumé en bas */}
          {cotisationsSelected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky bottom-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl shadow-lg mt-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Résumé de la sélection</div>
                  <div className="text-sm opacity-90">
                    {cotisationsSelected.length} contibution(s) sélectionnée(s)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {totalSelected.toLocaleString()} FCFA
                  </div>
                  <div className="text-sm opacity-90">
                    sur {totalRestant.toLocaleString()} FCFA restants
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
});

export default StepCotisations;