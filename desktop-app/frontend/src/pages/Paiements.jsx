// src/pages/Paiements.jsx
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

// Steps
import StepCategory from "../components/paiement/steps/StepCategory";
import StepMember from "../components/paiement/steps/StepMember";
import StepCotisations from "../components/paiement/steps/StepCotisations";
import StepPayment from "../components/paiement/steps/StepPayment";
import StepRecap from "../components/paiement/steps/StepRecap";

export default function PaiementsPage({ onDone, membreFixe = null }) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [history, setHistory] = useState([]); // Pour permettre le retour arrière

  const categoryRef = useRef(null);
  const memberRef = useRef(null);

  const [wizard, setWizard] = useState({
    categorie: null,
    membre: membreFixe || null,
    solde: null,
    cotisationsSelectionnees: [],
    paiementResult: [],
    paiementData: null, // Stocke les infos du paiement pour le récap
  });

  const updateWizard = useCallback(
    (patch) => setWizard((w) => ({ ...w, ...patch })),
    []
  );

  // Chargement catégories + membres avec retry
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const [cats, mems] = await Promise.all([
          apiGet("/categories"),
          apiGet("/membres"),
        ]);
        if (!mounted) return;

        // Trier les catégories par ordre alphabétique
        const sortedCategories = cats.sort((a, b) =>
          a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
        );

        setCategories(sortedCategories);

        // Filtrer uniquement les membres actifs et les trier par nom
        const activeMembers = mems
          .filter((m) => m.statutMembre === "Actif") // ← Déjà présent
          .sort((a, b) =>
            a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
          );

        setMembers(activeMembers);

        // Si membreFixe est fourni, pré-sélectionner
        if (membreFixe && activeMembers.find((m) => m.id === membreFixe.id)) {
          handleSelectMembre(membreFixe);
        }
      } catch (err) {
        console.error("Erreur chargement données:", err);
        toast.error("Erreur lors du chargement des données.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [membreFixe]);

  // Sauvegarder l'historique des étapes
  useEffect(() => {
    if (step > 1) {
      setHistory((prev) => [...prev, step]);
    }
  }, [step]);

  /* Sélection catégorie */
  const handleSelectCategorie = useCallback(
    (categorie) => {
      updateWizard({
        categorie,
        membre: null,
        solde: null,
        cotisationsSelectionnees: [],
        paiementResult: [],
      });
      if (categorie) {
        setStep(2);
        setTimeout(() => memberRef.current?.focus(), 100);
      }
    },
    [updateWizard]
  );

  /* Sélection membre avec gestion d'erreur améliorée */
const handleSelectMembre = useCallback(
  async (membre) => {
    updateWizard({
      membre,
      solde: null,
      cotisationsSelectionnees: [],
      paiementResult: [],
    });

    if (!membre) return;

    try {
      setActionLoading(true);
      const data = await apiGet(`/soldes/${membre.id}`);
      
      console.log("=== DEBUG: Réponse API solde ===");
      console.log("Structure complète:", data);
      
      // Vérifier si c'est un membre non-actif
      if (data.message && data.totalDu === 0) {
        console.log("Membre non-actif détecté:", data.message);
        toast.info(data.message);
        updateWizard({ solde: data });
        // Vous pouvez décider de rester à l'étape 2 ou passer à l'étape 3 avec solde 0
        setStep(3); // Pour montrer "Aucune contribution"
        return;
      }
      
      // Pour les membres actifs avec contributions
      if (!data.cotisations || data.cotisations.length === 0) {
        console.log("Membre actif mais sans contributions");
        updateWizard({ solde: data });
        setStep(3);
        return;
      }
      
      // TRANSFORMATION DES DONNÉES POUR StepCotisations
      // Votre API retourne data.cotisations (pas data.cotisationsImpayees)
      const cotisationsImpayees = data.cotisations
        .filter(cot => cot.reste > 0) // Filtrer seulement les impayées
        .map(cot => ({
          ...cot,
          // S'assurer que tous les champs nécessaires existent
          id: cot.id,
          date: cot.date ? new Date(cot.date) : new Date(),
          montant: cot.montant || 0,
          motif: cot.motif || "Contribution",
          reste: cot.reste || 0,
          montantPaye: cot.montantPaye || 0,
          statut: cot.statut || "Impayé",
          deces: cot.deces || null,
        }));
      
      console.log("Contributions impayées transformées:", cotisationsImpayees);
      
      // Construire l'objet solde pour StepCotisations
      const updatedSolde = {
        ...data,
        cotisationsImpayees, // ← Ce que StepCotisations attend
        // Garder les totaux
        totalDu: data.totalDu || data.resume?.totalDu || 0,
        totalPaye: data.totalPaye || data.resume?.totalPaye || 0,
        solde: data.solde || data.resume?.solde || 0,
      };
      
      console.log("Solde final pour StepCotisations:", updatedSolde);
      updateWizard({ solde: updatedSolde });
      setStep(3);
      
    } catch (err) {
      console.error("Erreur chargement solde:", err);
      toast.error(`Impossible de charger le solde: ${err.message}`);
      updateWizard({ membre: null });
    } finally {
      setActionLoading(false);
    }
  },
  [updateWizard]
);

  /* Gestion contributions - version améliorée */
  const toggleCotisationSelection = useCallback((cot, selectAll = false) => {
    setWizard((w) => {
      if (selectAll && w.solde?.cotisationsImpayees) {
        // Sélectionner toutes les contributions
        const allSelected = w.solde.cotisationsImpayees.map((c) => ({
          contribution: c,
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
      // Trier par date (plus ancien d'abord) et par montant restant
      const ordered = [...w.solde.cotisationsImpayees].sort((a, b) => {
        const dateDiff = new Date(a.date) - new Date(b.date);
        if (dateDiff !== 0) return dateDiff;
        return b.reste - a.reste; // Plus grand montant d'abord si même date
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

  /* Soumission paiement améliorée */
  const submitPayments = useCallback(
    async (paymentData) => {
      const {
        date,
        mode,
        reference = "",
        commentaire = "",
        totalAmountIfProvided,
      } = paymentData;

      // Validations
      if (wizard.cotisationsSelectionnees.length === 0) {
        toast.error("Veuillez sélectionner au moins une contribution.");
        return;
      }

      if (!totalAmountIfProvided || totalAmountIfProvided <= 0) {
        toast.error("Le montant doit être supérieur à 0.");
        return;
      }

      const totalRestant =
        (wizard.solde?.totalDu || 0) - (wizard.solde?.totalPaye || 0);
      if (totalAmountIfProvided > totalRestant + 100) {
        // Marge d'erreur de 100 FCFA
        toast.error(
          `Le montant dépasse le solde restant (${totalRestant.toLocaleString()} FCFA).`
        );
        return;
      }

      if (!date) {
        toast.error("Veuillez sélectionner une date.");
        return;
      }

      try {
        setActionLoading(true);
        const results = [];
        const errors = [];

        // Traiter chaque paiement avec gestion d'erreur individuelle
        for (const ligne of wizard.cotisationsSelectionnees) {
          try {
            const payload = {
              cotisationId: ligne.cotisation.id,
              membreId: wizard.membre.id,
              montant: Number(ligne.amountToPay),
              mode,
              reference,
              commentaire,
              date: new Date(date).toISOString(),
              statut: "validé",
            };

            const res = await apiPost("/paiements", payload);

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
              membreNom: wizard.membre?.nom || "",
              membrePrenoms: wizard.membre?.prenoms || "",
              motif: ligne.cotisation.motif || "",
              categorieLabel: wizard.categorie?.label || "",
              defuntNom: deces?.defuntNom || deces?.membre?.nom || "",
              defuntPrenoms:
                deces?.defuntPrenoms || deces?.membre?.prenoms || "",
              dateDeces: deces?.dateDeces || deces?.date || "",
            });
          } catch (err) {
            errors.push({
              cotisation: ligne.cotisation.motif,
              error: err.message,
            });
            console.error(
              `Erreur paiement cotisation ${ligne.cotisation.id}:`,
              err
            );
          }
        }

        // Gestion des erreurs partielles
        if (errors.length > 0) {
          toast.warning(
            `${results.length} paiements réussis, ${errors.length} échecs.`
          );
        }

        if (results.length > 0) {
          updateWizard({
            paiementResult: results,
            paiementData: paymentData, // Sauvegarde pour récap
          });
          setStep(5);
          toast.success(
            `${results.length} contribution(s) payée(s) avec succès !`
          );
        } else {
          toast.error("Aucun paiement n'a pu être effectué.");
        }
      } catch (err) {
        console.error("Erreur globale paiement:", err);
        toast.error("Erreur lors du paiement. Veuillez réessayer.");
      } finally {
        setActionLoading(false);
      }
    },
    [wizard, updateWizard]
  );

  const resetWizard = useCallback(() => {
    setWizard({
      categorie: null,
      membre: null,
      solde: null,
      cotisationsSelectionnees: [],
      paiementResult: [],
      paiementData: null,
    });
    setStep(1);
    setHistory([]);
    categoryRef.current?.reset?.();
    memberRef.current?.reset?.();
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
    { id: 1, label: "Catégorie", icon: "📋" },
    { id: 2, label: "Membre", icon: "👤" },
    { id: 3, label: "Contributions", icon: "💰" },
    { id: 4, label: "Paiement", icon: "💳" },
    { id: 5, label: "Confirmation", icon: "✅" },
  ];

  const summaries = {
    1: wizard.categorie?.label,
    2: wizard.membre && `${wizard.membre.nom} ${wizard.membre.prenoms}`,
    3:
      wizard.cotisationsSelectionnees.length > 0
        ? `${
            wizard.cotisationsSelectionnees.length
          } ligne(s) - ${totalSelectedAmount.toLocaleString()} FCFA`
        : null,
    4:
      totalSelectedAmount > 0
        ? `${totalSelectedAmount.toLocaleString()} FCFA`
        : null,
  };

  const canProceed = (targetStep) => {
    switch (targetStep) {
      case 2:
        return !!wizard.categorie;
      case 3:
        return !!wizard.membre;
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
          toast.error("Veuillez compléter l'étape actuelle avant de continuer");
          return;
        }
      }
      setStep(id);
    },
    [step, wizard]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Paiement des contributions
          </h1>
          <p className="text-gray-600">
            Suivez les étapes pour enregistrer un paiement
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
              <StepCategory
                ref={categoryRef}
                categories={categories}
                onSelect={handleSelectCategorie}
                loading={loading}
                initialValue={wizard.categorie}
              />
            )}

            {step === 2 && (
              <StepMember
                ref={memberRef}
                members={members}
                categorie={wizard.categorie}
                onSelect={handleSelectMembre}
                loading={loading || actionLoading}
                initialValue={wizard.membre}
              />
            )}

            {step === 3 && (
              <StepCotisations
                solde={wizard.solde}
                cotisationsSelected={wizard.cotisationsSelectionnees}
                toggleSelection={toggleCotisationSelection}
                updateAmount={updateAmountForCot}
                onProceed={() => setStep(4)}
                onBack={handleBack}
                distributeAutomatically={distributeAutomatically}
                loading={actionLoading}
                membre={wizard.membre}
              />
            )}

            {step === 4 && (
              <StepPayment
                membre={wizard.membre}
                cotisationsSelected={wizard.cotisationsSelectionnees}
                totalSelectedAmount={totalSelectedAmount}
                submitPayments={submitPayments}
                onBack={handleBack}
                loading={actionLoading}
                soldeRestant={
                  (wizard.solde?.totalDu || 0) - (wizard.solde?.totalPaye || 0)
                }
              />
            )}

            {step === 5 && (
              <StepRecap
                wizardData={wizard}
                onFinish={() => {
                  resetWizard();
                  onDone?.(wizard.paiementResult);
                }}
                onRestart={resetWizard}
                onBack={handleBack}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Loading overlay */}
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
