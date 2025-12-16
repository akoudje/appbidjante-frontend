import React, { useMemo, useCallback, useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

const StepCotisationLignee = React.memo(function StepCotisationLignee({
  solde,
  cotisationsSelected = [],
  toggleSelection,
  updateAmount,
  onProceed,
  onBack,
  distributeAutomatically,
  loading = false,
  lignee,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  /** reste = totalDu - totalPaye */
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

  const impayees = solde?.cotisationsImpayees || [];

  const handleAmountChange = useCallback(
    (cotId, value) => {
      const numValue = Math.max(0, Number(value) || 0);
      updateAmount(cotId, numValue);
    },
    [updateAmount]
  );

  const handleSelectAll = useCallback(() => {
    if (!impayees.length) return;

    if (selectAll) {
      // décocher tout
      impayees.forEach((cot) => {
        if (cotisationsSelected.find((c) => c.cotisation.id === cot.id)) {
          toggleSelection(cot);
        }
      });
    } else {
      // cocher tout
      impayees.forEach((cot) => {
        if (!cotisationsSelected.find((c) => c.cotisation.id === cot.id)) {
          toggleSelection(cot);
        }
      });
    }
    setSelectAll(!selectAll);
  }, [selectAll, impayees, cotisationsSelected, toggleSelection]);

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
        <p className="text-lg font-medium text-yellow-800 mb-2">
          Aucune donnée de solde disponible
        </p>
        <p className="text-yellow-700">
          Impossible de charger les contributions de cette lignée
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Étape 3 : Contribution des lignées
        </h2>
        <p className="text-gray-600">
          Sélectionnez les contributions à payer pour la lignée{" "}
          <span className="font-semibold text-blue-600">{lignee?.nom}</span>
        </p>
      </div>

      {/* résumé */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">Total dû</div>
            <div className="text-3xl font-bold text-gray-900">
              {solde.totalDu?.toLocaleString()} FCFA
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">
              Total payé
            </div>
            <div className="text-3xl font-bold text-green-600">
              {solde.totalPaye?.toLocaleString()} FCFA
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">Reste</div>
            <div className="text-3xl font-bold text-orange-600">
              {totalRestant.toLocaleString()} FCFA
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">
              Sélectionné
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {totalSelected.toLocaleString()} FCFA
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {cotisationsSelected.length} cotisation(s)
            </div>
          </div>
        </div>

        {/* barre progression sécurisée */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${
                solde.totalDu > 0
                  ? (solde.totalPaye / solde.totalDu) * 100
                  : 0
              }%`,
            }}
            className="h-full bg-gradient-to-r from-green-500 to-green-600"
          />
        </div>
      </div>

      {impayees.length === 0 ? (
        <div className="p-8 bg-green-50 border border-green-200 rounded-2xl text-center">
          <CheckIcon className="w-10 h-10 text-green-600 mx-auto" />
          <p className="text-green-600 text-xl mt-2">
            Cette lignée est à jour !
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
          >
            Retour
          </button>
        </div>
      ) : (
        <>
          {/* actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Retour
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    selectAll &&
                    impayees.length === cotisationsSelected.length
                  }
                  className="w-5 h-5"
                />
                Tout sélectionner
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => distributeAutomatically(totalRestant)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Répartir
              </button>

              <button
                onClick={onProceed}
                disabled={cotisationsSelected.length === 0}
                className="px-6 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
              >
                Payer
              </button>
            </div>
          </div>

          {/* liste */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {impayees.map((cot) => {
              const selectedItem = cotisationsSelected.find(
                (x) => x.cotisation.id === cot.id
              );

              const isSelected = !!selectedItem;
              const amountToPay = selectedItem?.amountToPay || 0;
              const isExpanded = expandedId === cot.id;

              return (
                <motion.div
                  key={cot.id}
                  layout
                  className={`border rounded-xl p-4 ${
                    isSelected
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(cot)}
                      className="w-5 h-5 mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-bold">{cot.motif}</div>

                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <CalendarDaysIcon className="w-4 h-4" />
                            {new Date(cot.date).toLocaleDateString("fr-FR")}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : cot.id)
                          }
                          className="text-gray-500"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="w-5 h-5" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t"
                          >
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <div className="text-xs">Montant</div>
                                <div className="font-semibold">
                                  {cot.montant.toLocaleString()} FCFA
                                </div>
                              </div>
                              <div>
                                <div className="text-xs">Déjà payé</div>
                                <div className="font-semibold text-green-600">
                                  {(cot.montant - cot.reste).toLocaleString()}{" "}
                                  FCFA
                                </div>
                              </div>
                              <div>
                                <div className="text-xs">Reste</div>
                                <div className="font-semibold text-red-600">
                                  {cot.reste.toLocaleString()} FCFA
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500">À payer</div>

                      <input
                        type="number"
                        min="0"
                        max={cot.reste}
                        step="500"
                        value={amountToPay}
                        onChange={(e) =>
                          handleAmountChange(cot.id, e.target.value)
                        }
                        disabled={!isSelected}
                        className={`w-24 p-2 border rounded-lg text-right font-bold ${
                          isSelected
                            ? "border-blue-300 bg-white"
                            : "border-gray-200 bg-gray-100"
                        }`}
                      />

                      <div className="text-xs text-gray-500 mt-1">
                        Max: {cot.reste.toLocaleString()} FCFA
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});

export default StepCotisationLignee;
