// src/pages/PaiementsLignees.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { apiGet, apiPost } from "../utils/api";
import StepperLayout from "../components/paiement/steps/StepperLayout";

// Steps LIGNÉES
import StepFamille from "../components/paiement-lignee/steps/StepFamille";
import StepLignee from "../components/paiement-lignee/steps/StepLignee";
import StepCotisationsLignee from "../components/paiement-lignee/steps/StepCotisationsLignee";
import StepPaymentLignee from "../components/paiement-lignee/steps/StepPaymentLignee";
import StepRecapLignee from "../components/paiement-lignee/steps/StepRecapLignee";

export default function PaiementsLigneesPage({ onDone, ligneeFixe = null }) {
  const [step, setStep] = useState(1);
  const [familles, setFamilles] = useState([]);
  const [lignees, setLignees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const familleRef = useRef(null);
  const ligneeRef = useRef(null);

  const [wizard, setWizard] = useState({
    famille: null,
    lignee: ligneeFixe || null,
    solde: null,
    cotisationsSelectionnees: [],
    paiementResult: [],
    paiementData: null,
  });

  const updateWizard = useCallback(
    (patch) => setWizard((w) => ({ ...w, ...patch })),
    []
  );

  // Chargement familles + lignées
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        const [fams, lgs] = await Promise.all([
          apiGet("/familles"),
          apiGet("/lignees"),
        ]);

        if (!mounted) return;

        const sortedFamilles = (fams || []).sort((a, b) =>
          a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
        );

        const sortedLignees = (lgs || []).sort((a, b) =>
          a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
        );

        setFamilles(sortedFamilles);
        setLignees(sortedLignees);

        // Pré-sélection éventuelle d'une lignée fournie
        if (ligneeFixe && sortedLignees.find((l) => l.id === ligneeFixe.id)) {
          handleSelectLignee(ligneeFixe);
        }
      } catch (err) {
        console.error("Erreur chargement données lignées:", err);
        toast.error("Erreur lors du chargement des données lignées.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [ligneeFixe]);

  // Historique des étapes (pour retour)
  useEffect(() => {
    if (step > 1) {
      setHistory((prev) => [...prev, step]);
    }
  }, [step]);

  /* Étape 1 : sélection famille */
  const handleSelectFamille = useCallback(
    (famille) => {
      updateWizard({
        famille,
        lignee: null,
        solde: null,
        cotisationsSelectionnees: [],
        paiementResult: [],
      });

      if (famille) {
        setStep(2);
        setTimeout(() => ligneeRef.current?.focus?.(), 100);
      }
    },
    [updateWizard]
  );

 /* Étape 2 : sélection lignée */
const handleSelectLignee = useCallback(
  async (lignee) => {
    if (!lignee || !lignee.id) {
      toast.error("Lignée invalide");
      return;
    }

    updateWizard({
      lignee,
      solde: null,
      cotisationsSelectionnees: [],
      paiementResult: [],
    });

    try {
      setActionLoading(true);

      const response = await apiGet(`/soldes-lignee/${lignee.id}`);
      
      // Support des deux formats de réponse
      const ligneeData = response.lignee || response;
      
      if (!ligneeData) {
        throw new Error("Données de solde non disponibles");
      }

      const solde = {
        totalDu: ligneeData.totalDuLignee || ligneeData.totalDu || 0,
        totalPaye: ligneeData.totalPayeLignee || ligneeData.totalPaye || 0,
        solde: ligneeData.soldeLignee || ligneeData.solde || 0,
        cotisationsImpayees: (ligneeData.cotisationsLigneeImpayees || ligneeData.cotisationsImpayees || []).map(c => ({
          ...c,
          id: c.id || `temp-${Date.now()}-${Math.random()}`,
          date: c.date ? new Date(c.date).toISOString() : new Date().toISOString(),
          montant: c.montant || 0,
          reste: c.reste || (c.montant || 0) - (c.montantPaye || 0),
          motif: c.motif || "Cotisation lignée",
          deces: c.deces ? {
            ...c.deces,
            defuntNom: c.deces.defuntNom || c.deces.membre?.nom || "Inconnu",
            defuntPrenoms: c.deces.defuntPrenoms || c.deces.membre?.prenoms || "",
          } : null
        }))
      };

      updateWizard({ solde });
      setStep(3);

    } catch (err) {
      console.error("Erreur chargement solde lignée:", err);
      
      let errorMessage = "Impossible de charger le solde de la lignée";
      if (err.response?.status === 404) {
        errorMessage = "Lignée non trouvée";
      } else if (err.response?.status === 500) {
        errorMessage = "Erreur serveur, veuillez réessayer";
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = "Problème de connexion au serveur";
      }
      
      toast.error(`${errorMessage}: ${err.message}`);
      updateWizard({ lignee: null });
    } finally {
      setActionLoading(false);
    }
  },
  [updateWizard]
);

  /* Step 3 : sélection cotisations lignée */
  const toggleCotisationSelection = useCallback((cot, selectAll = false) => {
    setWizard((w) => {
      if (selectAll && w.solde?.cotisationsImpayees) {
        const allSelected = w.solde.cotisationsImpayees.map((c) => ({
          cotisation: c,
          amountToPay: c.reste ?? c.montant ?? 0,
        }));
        return {
          ...w,
          cotisationsSelectionnees: allSelected,
        };
      }

      const exists = w.cotisationsSelectionnees.find(
        (x) => x.cotisation.id === cot.id
      );
      if (exists) {
        return {
          ...w,
          cotisationsSelectionnees: w.cotisationsSelectionnees.filter(
            (x) => x.cotisation.id !== cot.id
          ),
        };
      }
      return {
        ...w,
        cotisationsSelectionnees: [
          ...w.cotisationsSelectionnees,
          { cotisation: cot, amountToPay: cot.reste ?? cot.montant ?? 0 },
        ],
      };
    });
  }, []);

  const updateAmountForCot = useCallback((cotId, amount) => {
    setWizard((w) => {
      const line = w.cotisationsSelectionnees.find(
        (x) => x.cotisation.id === cotId
      );
      if (!line) return w;
      const max = line.cotisation.reste;
      const finalAmount = Math.max(0, Math.min(amount, max));
      return {
        ...w,
        cotisationsSelectionnees: w.cotisationsSelectionnees.map((x) =>
          x.cotisation.id === cotId ? { ...x, amountToPay: finalAmount } : x
        ),
      };
    });
  }, []);

  const distributeAutomatically = useCallback((total) => {
    setWizard((w) => {
      if (!w.solde?.cotisationsImpayees?.length) return w;

      let remaining = total;
      const ordered = [...w.solde.cotisationsImpayees].sort((a, b) => {
        const dateDiff = new Date(a.date) - new Date(b.date);
        if (dateDiff !== 0) return dateDiff;
        return b.reste - a.reste;
      });

      const selection = [];
      for (const cot of ordered) {
        if (remaining <= 0) break;
        const pay = Math.min(cot.reste, remaining);
        if (pay > 0) {
          selection.push({ cotisation: cot, amountToPay: pay });
          remaining -= pay;
        }
      }
      return { ...w, cotisationsSelectionnees: selection };
    });
  }, []);

  const totalSelectedAmount = useMemo(
    () =>
      wizard.cotisationsSelectionnees.reduce(
        (s, x) => s + Number(x.amountToPay || 0),
        0
      ),
    [wizard.cotisationsSelectionnees]
  );

  /* Step 4 : soumission paiement lignée */
  const submitPayments = useCallback(
    async (paymentData) => {
      const {
        date,
        mode,
        reference = "",
        commentaire = "",
        totalAmountIfProvided,
      } = paymentData;

      if (wizard.cotisationsSelectionnees.length === 0) {
        toast.error("Veuillez sélectionner au moins une contribution de lignée.");
        return;
      }

      if (!totalAmountIfProvided || totalAmountIfProvided <= 0) {
        toast.error("Le montant doit être supérieur à 0.");
        return;
      }

      const totalRestant =
        (wizard.solde?.totalDu || 0) - (wizard.solde?.totalPaye || 0);
      if (totalAmountIfProvided > totalRestant + 100) {
        toast.error(
          `Le montant dépasse le solde restant (${totalRestant.toLocaleString()} FCFA).`
        );
        return;
      }

      if (!date) {
        toast.error("Veuillez sélectionner une date.");
        return;
      }

      // Validation de la date (pas dans le futur)
      const today = new Date();
      const paymentDate = new Date(date);
      if (paymentDate > today) {
        toast.error("La date de paiement ne peut pas être dans le futur");
        return;
      }

      try {
        setActionLoading(true);
        const results = [];
        const errors = [];

        for (const ligne of wizard.cotisationsSelectionnees) {
          try {
            const payload = {
              cotisationId: ligne.cotisation.id,
              ligneeId: wizard.lignee.id,
              montant: Number(ligne.amountToPay),
              mode,
              reference,
              commentaire,
              date: new Date(date).toISOString(),
              statut: "validé",
            };

            const res = await apiPost("/paiements-lignees", payload);

            const deces = ligne.cotisation?.deces || null;

            results.push({
              id: res.id,
              cotisationId: ligne.cotisation.id,
              montant: Number(ligne.amountToPay),
              mode,
              reference,
              commentaire,
              date: new Date(date).toISOString(),
              statut: res.statut || "validé",
              ligneeNom: wizard.lignee?.nom || "",
              familleNom: wizard.famille?.nom || "",
              motif: ligne.cotisation.motif || "",
              defuntNom: deces?.defuntNom || deces?.membre?.nom || "",
              defuntPrenoms: deces?.defuntPrenoms || deces?.membre?.prenoms || "",
              dateDeces: deces?.dateDeces || "",
            });
          } catch (err) {
            errors.push({
              cotisation: ligne.cotisation.motif,
              error: err.message,
            });
            console.error(
              `Erreur paiement cotisation lignée ${ligne.cotisation.id}:`,
              err
            );
          }
        }

        if (errors.length > 0) {
          toast.warning(
            `${results.length} paiements réussis, ${errors.length} échecs.`
          );
          
          // Log des erreurs pour debug
          console.error("Paiements échoués:", errors);
        }

        if (results.length > 0) {
          updateWizard({
            paiementResult: results,
            paiementData,
          });
          setStep(5);
          toast.success(
            `${results.length} cotisation(s) de lignée payée(s) avec succès !`
          );
        } else {
          toast.error("Aucun paiement n'a pu être effectué.");
        }
      } catch (err) {
        console.error("Erreur globale paiement lignée:", err);
        toast.error("Erreur lors du paiement de lignée. Veuillez réessayer.");
      } finally {
        setActionLoading(false);
      }
    },
    [wizard, updateWizard]
  );

  const resetWizard = useCallback(() => {
    setWizard({
      famille: null,
      lignee: null,
      solde: null,
      cotisationsSelectionnees: [],
      paiementResult: [],
      paiementData: null,
    });
    setStep(1);
    setHistory([]);
    familleRef.current?.reset?.();
    ligneeRef.current?.reset?.();
  }, []);

  const handleBack = useCallback(() => {
    if (history.length > 0) {
      const prevStep = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setStep(prevStep);
    } else {
      setStep((s) => Math.max(1, s - 1));
    }
  }, [history]);

  const stepsDef = [
    { id: 1, label: "Famille", icon: "🏠" },
    { id: 2, label: "Lignée", icon: "🌿" },
    { id: 3, label: "Cotisations", icon: "💰" },
    { id: 4, label: "Paiement", icon: "💳" },
    { id: 5, label: "Confirmation", icon: "✅" },
  ];

  const summaries = {
    1: wizard.famille?.nom,
    2: wizard.lignee && wizard.lignee.nom,
    3:
      wizard.cotisationsSelectionnees.length > 0
        ? `${wizard.cotisationsSelectionnees.length} ligne(s) - ${totalSelectedAmount.toLocaleString()} FCFA`
        : null,
    4:
      totalSelectedAmount > 0
        ? `${totalSelectedAmount.toLocaleString()} FCFA`
        : null,
  };

  const canProceed = (targetStep) => {
    switch (targetStep) {
      case 2:
        return !!wizard.famille;
      case 3:
        return !!wizard.lignee;
      case 4:
        return wizard.cotisationsSelectionnees.length > 0;
      default:
        return true;
    }
  };

  const handleStepClick = useCallback(
    (id) => {
      if (id > step) {
        if (!canProceed(id)) {
          toast.error(
            "Veuillez compléter l'étape actuelle avant de continuer"
          );
          return;
        }
      }
      setStep(id);
    },
    [step, wizard]
  );

  const soldeRestant =
    (wizard.solde?.totalDu || 0) - (wizard.solde?.totalPaye || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Paiement des contributions des lignées
          </h1>
          <p className="text-gray-600">
            Suivez les étapes pour enregistrer un paiement de lignée
          </p>
        </div>

        <StepperLayout
          steps={stepsDef}
          current={step}
          summaries={summaries}
          onStepClick={handleStepClick}
          loading={loading}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="mt-8 bg-white rounded-2xl shadow-xl p-6 md:p-8"
          >
            {step === 1 && (
              <StepFamille
                ref={familleRef}
                familles={familles}
                onSelect={handleSelectFamille}
                loading={loading}
                initialValue={wizard.famille}
              />
            )}

            {step === 2 && (
              <StepLignee
                ref={ligneeRef}
                lignees={lignees}
                famille={wizard.famille}
                onSelect={handleSelectLignee}
                loading={loading || actionLoading}
                initialValue={wizard.lignee}
              />
            )}

            {step === 3 && (
              <StepCotisationsLignee
                solde={wizard.solde}
                cotisationsSelected={wizard.cotisationsSelectionnees}
                toggleSelection={toggleCotisationSelection}
                updateAmount={updateAmountForCot}
                onProceed={() => setStep(4)}
                onBack={handleBack}
                distributeAutomatically={distributeAutomatically}
                loading={actionLoading}
                lignee={wizard.lignee}
              />
            )}

            {step === 4 && (
              <StepPaymentLignee
                lignee={wizard.lignee}
                famille={wizard.famille}
                cotisationsSelected={wizard.cotisationsSelectionnees}
                totalSelectedAmount={totalSelectedAmount}
                submitPayments={submitPayments}
                onBack={handleBack}
                loading={actionLoading}
                soldeRestant={soldeRestant}
              />
            )}

            {step === 5 && (
              <StepRecapLignee
                wizardData={wizard}
                onFinish={() => {
                  const result = wizard.paiementResult;
                  resetWizard();
                  onDone?.(result);
                }}
                onRestart={resetWizard}
                onBack={handleBack}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {(loading || actionLoading) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">
                {actionLoading ? "Traitement en cours..." : "Chargement..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}