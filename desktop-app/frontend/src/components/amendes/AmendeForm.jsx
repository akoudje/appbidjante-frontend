// src/components/amendes/AmendeForm.jsx

import { useEffect, useState, useCallback, useMemo } from "react";
import { apiGet, apiPost, apiPut } from "@/utils/api";
import { toast } from "sonner";
import {
  UserIcon,
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  TagIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

/* =========================
   CONSTANTES
========================= */
const TYPES = [
  { value: "PECUNIAIRE", label: "Pécuniaire", icon: CurrencyDollarIcon },
  { value: "MATERIELLE", label: "Matérielle", icon: ClipboardDocumentListIcon },
  { value: "MIXTE", label: "Mixte", icon: CurrencyDollarIcon },
  { value: "DISCIPLINAIRE", label: "Disciplinaire", icon: DocumentTextIcon },
];

const CIBLES = [
  { value: "INDIVIDU", label: "Individu", icon: UserIcon },
  { value: "LIGNEE", label: "Lignée", icon: UsersIcon },
  { value: "CATEGORIE", label: "Catégorie", icon: TagIcon },
  { value: "GENERATION", label: "Génération", icon: UsersIcon },
];

/* =========================
   UI HELPERS
========================= */
const FormField = ({ label, children, required = false, error, help }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
    {error && (
      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
        <ExclamationCircleIcon className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

const TypeButton = ({ type, selected, onClick, icon: Icon }) => (
  <button
    type="button"
    onClick={() => onClick(type.value)}
    className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all duration-200
      ${
        selected === type.value
          ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
          : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm font-medium">{type.label}</span>
  </button>
);

/* =========================
   FORMAT DATE FOR INPUT
========================= */
const formatDateForInput = (date) => {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

/* =========================
   COMPONENT
========================= */
export default function AmendeForm({ initialData, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [errors, setErrors] = useState({});

  const [membres, setMembres] = useState([]);
  const [lignees, setLignees] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    type: "",
    motif: "",
    description: "", // AJOUTÉ
    montant: "",
    dateLimite: "",
    cibleType: "",
    cibleId: "",
    cibleIds: [],
  });

  /* =========================
     MEMOIZED VALUES
  ========================== */
  const isPecuniaire = useMemo(
    () => ["PECUNIAIRE", "MIXTE"].includes(form.type),
    [form.type]
  );

  const isEditable = useMemo(
    () => !initialData || initialData.statut === "EN_ATTENTE",
    [initialData]
  );

  /* =========================
     DISPLAY TEXT FUNCTIONS
  ========================== */
  const getMembreDisplayText = useCallback(
    (membre) => {
      if (!membre) return "";

      let display = `${membre.nom || ""} ${membre.prenoms || ""}`.trim();

      // Ajouter catégorie
      if (membre.categorie?.label) {
        display += ` (${membre.categorie.label})`;
      } else if (membre.categorieId && categories.length > 0) {
        // Fallback si catégorie n'est pas chargée
        const cat = categories.find((c) => c.id === membre.categorieId);
        if (cat) display += ` (${cat.label})`;
      }

      // Ajouter lignée
      if (membre.lignee?.nom) {
        display += ` - ${membre.lignee.nom}`;
      } else if (membre.ligneeId && lignees.length > 0) {
        // Fallback si lignée n'est pas chargée
        const lignee = lignees.find((l) => l.id === membre.ligneeId);
        if (lignee) display += ` - ${lignee.nom}`;
      }

      // Ajouter famille
      if (membre.lignee?.famille?.nom) {
        display += ` [${membre.lignee.famille.nom}]`;
      }

      return display;
    },
    [categories, lignees]
  );

  const getLigneeDisplayText = useCallback((lignee) => {
    if (!lignee) return "";

    let display = lignee.nom || "";

    // Ajouter famille
    if (lignee.famille?.nom) {
      display += ` (${lignee.famille.nom})`;
    }

    // Ajouter nombre de membres
    if (lignee.membres?.length !== undefined) {
      display += ` - ${lignee.membres.length} membre${
        lignee.membres.length > 1 ? "s" : ""
      }`;
    }

    return display;
  }, []);

  const getCategorieDisplayText = useCallback((categorie) => {
    if (!categorie) return "";

    let display = categorie.label || "";

    // Ajouter génération
    if (categorie.generation) {
      display += ` (${categorie.generation})`;
    }

    // Ajouter nombre de membres
    const membreCount = categorie.membres?.length || categorie.membreCount || 0;
    if (membreCount > 0) {
      display += ` - ${membreCount} membre${membreCount > 1 ? "s" : ""}`;
    }

    return display;
  }, []);

  const getSelectedMembre = useMemo(
    () => membres.find((m) => m.id === form.cibleId),
    [membres, form.cibleId]
  );

  const getSelectedLignee = useMemo(
    () => lignees.find((l) => l.id === form.cibleId),
    [lignees, form.cibleId]
  );

  const getSelectedCategorie = useMemo(
    () => categories.find((c) => c.id === form.cibleId),
    [categories, form.cibleId]
  );

  /* =========================
     LOAD REFERENCES
  ========================== */
  useEffect(() => {
    let mounted = true;

    const loadReferences = async () => {
      try {
        setLoadingRefs(true);

        // Charger toutes les références en parallèle
        const [membresData, ligneesData, categoriesData] = await Promise.all([
          apiGet("/membres").catch(() => []),
          apiGet("/lignees").catch(() => []),
          apiGet("/categories").catch(() => []),
        ]);

        if (mounted) {
          // Trier les membres par nom + prénom
          const membresTries = [...(membresData || [])]
            .filter((m) => m.statutMembre !== "Décédé")
            .sort((a, b) => {
              const nomCompare = (a.nom || "").localeCompare(b.nom || "");
              if (nomCompare !== 0) return nomCompare;
              return (a.prenoms || "").localeCompare(b.prenoms || "");
            });

          setMembres(membresTries);
          setLignees(ligneesData || []);
          setCategories(categoriesData || []);
        }
      } catch (error) {
        console.error("❌ Erreur chargement références:", error);
        if (mounted) {
          toast.error("Erreur lors du chargement des données");
        }
      } finally {
        if (mounted) {
          setLoadingRefs(false);
        }
      }
    };

    loadReferences();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     LOAD INITIAL DATA (EDIT)
  ========================== */
  useEffect(() => {
    if (!initialData) {
      // Réinitialiser pour création
      setForm({
        type: "",
        motif: "",
        description: "", // AJOUTÉ
        montant: "",
        dateLimite: "",
        cibleType: "",
        cibleId: "",
        cibleIds: [],
      });
      return;
    }

    // Pour l'édition, on suppose une seule cible principale
    const ciblePrincipale =
      initialData.cibles?.find((c) => !c.estTransferee) ||
      initialData.cibles?.[0];

    // Utiliser requestAnimationFrame pour éviter le reflow forcé
    requestAnimationFrame(() => {
      setForm({
        type: initialData.type || "",
        motif: initialData.motif || "",
        description: initialData.description || "", // AJOUTÉ
        montant:
          initialData.montant !== null ? String(initialData.montant) : "",
        dateLimite: formatDateForInput(initialData.dateLimite),
        cibleType: ciblePrincipale?.type || "",
        cibleId: ciblePrincipale?.cibleId || "",
        cibleIds:
          initialData.cibles
            ?.filter((c) => c.type === "CATEGORIE")
            .map((c) => c.cibleId) || [],
      });
    });
  }, [initialData]);

  /* =========================
     HANDLERS
  ========================== */
  const handleChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  }, []);

  const handleMontantChange = useCallback(
    (value) => {
      // Nettoyer la valeur (enlever les espaces, garder seulement les chiffres)
      const cleaned = value.replace(/[^0-9]/g, "");
      handleChange("montant", cleaned);
    },
    [handleChange]
  );

  /* =========================
     VALIDATION
  ========================== */
  const validate = () => {
    const e = {};

    if (!form.type) e.type = "Type d'amende requis";

    if (!form.motif.trim()) {
      e.motif = "Motif de l'amende requis";
    } else if (form.motif.trim().length < 5) {
      e.motif = "Le motif doit contenir au moins 5 caractères";
    }

    // Description optionnelle, mais si présente, minimum 10 caractères
    if (form.description && form.description.trim().length < 10) {
      e.description = "La description doit contenir au moins 10 caractères";
    }

    if (isPecuniaire) {
      if (!form.montant || form.montant.trim() === "") {
        e.montant = "Montant requis";
      } else {
        const montantNum = Number(form.montant.replace(/\s/g, ""));
        if (isNaN(montantNum) || montantNum <= 0) {
          e.montant = "Le montant doit être un nombre supérieur à 0";
        }
      }
    }

    if (!form.cibleType) {
      e.cibleType = "Type de cible requis";
    } else if (form.cibleType === "GENERATION") {
      if (form.cibleIds.length === 0) {
        e.cibleIds = "Sélectionnez au moins une catégorie";
      }
    } else {
      // Vérification plus stricte
      if (!form.cibleId || form.cibleId.trim() === "" || form.cibleId === "undefined") {
        e.cibleId = "Veuillez sélectionner une cible valide";
      }
    }

    // Validation date limite
    if (form.dateLimite) {
      const dateLimite = new Date(form.dateLimite);
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);

      if (dateLimite < aujourdhui) {
        e.dateLimite = "La date limite ne peut pas être dans le passé";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* =========================
     FORMAT MONTANT POUR AFFICHAGE
  ========================== */
  const formatMontant = useCallback((value) => {
    if (!value) return "";
    const num = value.replace(/\s/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }, []);

/* =========================
   PRÉPARER LES CIBLES POUR LE BACKEND
========================= */
const prepareCibles = useCallback(() => {
  console.log("📝 Préparation des cibles - Données:", {
    cibleType: form.cibleType,
    cibleId: form.cibleId,
    cibleIds: form.cibleIds
  });
  
  let cibles = [];
  
  if (form.cibleType === "GENERATION") {
    // Pour "GENERATION", créer une cible CATEGORIE par catégorie sélectionnée
    cibles = form.cibleIds.map((categorieId) => {
      const cat = categories.find((c) => c.id === categorieId);
      return {
        type: "CATEGORIE",
        cibleId: categorieId,
        cibleNom: cat ? `Génération ${cat.label}` : "Génération",
        ciblePrenom: "", // Vide pour les catégories
      };
    });
  } else {
    // Pour INDIVIDU, LIGNEE, CATEGORIE
    if (form.cibleId) {
      let cibleNom = "";
      let ciblePrenom = "";
      
      switch (form.cibleType) {
        case "INDIVIDU":
          const membre = getSelectedMembre;
          if (membre) {
            cibleNom = membre.nom || "";
            ciblePrenom = membre.prenoms || "";
          }
          break;
        case "LIGNEE":
          const lignee = getSelectedLignee;
          cibleNom = lignee?.nom || "";
          break;
        case "CATEGORIE":
          const categorie = getSelectedCategorie;
          cibleNom = categorie?.label || "";
          break;
      }
      
      cibles = [{
        type: form.cibleType,
        cibleId: form.cibleId,
        cibleNom: cibleNom,
        ciblePrenom: ciblePrenom,
      }];
    }
  }
  
  console.log("✅ Cibles préparées pour le backend:", cibles);
  return cibles;
}, [form.cibleType, form.cibleId, form.cibleIds, categories, getSelectedMembre, getSelectedLignee, getSelectedCategorie]);

  /* =========================
     SUBMIT - CORRIGÉ
  ========================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!validate()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setLoading(true);
    try {
      // Préparer les cibles selon le format attendu par le backend
      const cibles = prepareCibles();
      
      // Vérifier qu'on a au moins une cible
      if (cibles.length === 0) {
        toast.error("Veuillez sélectionner une cible valide");
        setLoading(false);
        return;
      }

      // Préparer le payload
      const payload = {
        type: form.type,
        motif: form.motif.trim(),
        description: form.description.trim() || null,
        montant: isPecuniaire 
          ? Number(form.montant.replace(/\s/g, "")) 
          : null,
        dateLimite: form.dateLimite || null,
        cibles: cibles, // Format correct pour le backend
      };

      console.log("📤 Envoi payload:", JSON.stringify(payload, null, 2));

      // Appel API
      if (initialData) {
        await apiPut(`/amendes/${initialData.id}`, payload);
        toast.success("Amende modifiée avec succès", {
          icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
        });
      } else {
        await apiPost("/amendes", payload);
        toast.success("Amende créée avec succès", {
          icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
        });
      }

      onSuccess?.();
      
    } catch (err) {
      console.error("❌ Erreur détaillée:", err);
      
      // Afficher plus de détails sur l'erreur
      if (err.response) {
        console.error("📋 Réponse erreur:", err.response.data);
        console.error("🔧 Status:", err.response.status);
        
        const errorMessage = err.response.data?.error || 
          (initialData ? "Erreur lors de la modification" : "Erreur lors de la création");
        
        toast.error(`${errorMessage}`);
        
        // Afficher les erreurs de validation du backend
        if (err.response.data?.errors) {
          setErrors(err.response.data.errors);
        }
      } else if (err.request) {
        console.error("🌐 Pas de réponse:", err.request);
        toast.error("Pas de réponse du serveur");
      } else {
        console.error("⚙️ Erreur configuration:", err.message);
        toast.error("Erreur de configuration: " + err.message);
      }
      
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER LOADING
  ========================== */
  if (loadingRefs) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Chargement des données...</p>
      </div>
    );
  }

  if (!isEditable && initialData) {
    return (
      <div className="p-6 text-center">
        <ExclamationCircleIcon className="w-12 h-12 text-orange-500 mx-auto" />
        <h3 className="mt-4 text-lg font-semibold">Amende non modifiable</h3>
        <p className="mt-2 text-gray-600">
          Cette amende ne peut plus être modifiée car son statut est "
          {initialData.statut}".
        </p>
        <button
          onClick={onCancel}
          className="mt-6 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE */}
        <div className="lg:col-span-2 space-y-6">
          <FormField label="Type d'amende" required error={errors.type}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TYPES.map((t) => (
                <TypeButton
                  key={t.value}
                  type={t}
                  selected={form.type}
                  onClick={(v) => handleChange("type", v)}
                  icon={t.icon}
                />
              ))}
            </div>
          </FormField>

          <FormField
            label="Motif"
            required
            error={errors.motif}
            help="Décrivez précisément la raison de l'amende (minimum 5 caractères)"
          >
            <textarea
              rows={2}
              value={form.motif}
              onChange={(e) => handleChange("motif", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              placeholder="Ex: Retard à la réunion du conseil..."
              disabled={!isEditable}
            />
          </FormField>

          {/* NOUVEAU CHAMP DESCRIPTION */}
          <FormField
            label="Description"
            error={errors.description}
            help="Détails complémentaires (optionnel, minimum 10 caractères si renseigné)"
          >
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              placeholder="Ex: Retard de 30 minutes sans prévenir, deuxième infraction..."
              disabled={!isEditable}
            />
          </FormField>

          {isPecuniaire && (
            <FormField label="Montant (FCFA)" required error={errors.montant}>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatMontant(form.montant)}
                  onChange={(e) => handleMontantChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  placeholder="5 000"
                  disabled={!isEditable}
                />
                <CurrencyDollarIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <div className="absolute right-3 top-3.5 text-gray-500">
                  FCFA
                </div>
              </div>
            </FormField>
          )}
        </div>

        {/* COLONNE DROITE */}
        <div className="space-y-6">
          <FormField
            label="Cible de l'amende"
            required
            error={errors.cibleType}
          >
            <div className="space-y-2">
              {CIBLES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleChange("cibleType", c.value)}
                  className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition
                    ${
                      form.cibleType === c.value
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  disabled={!isEditable}
                >
                  <c.icon className="w-4 h-4" />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </FormField>

          {form.cibleType === "INDIVIDU" && (
            <FormField error={errors.cibleId}>
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={form.cibleId}
                    onChange={(e) => handleChange("cibleId", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition appearance-none"
                    disabled={!isEditable}
                  >
                    <option value="">--- Sélectionner un membre ---</option>
                    {membres.map((membre) => (
                      <option
                        key={membre.id}
                        value={membre.id}
                        title={getMembreDisplayText(membre)}
                      >
                        {getMembreDisplayText(membre)}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  </div>
                </div>

                {getSelectedMembre && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-semibold text-blue-800">
                      Membre sélectionné :
                    </div>
                    <div className="mt-1 text-blue-900">
                      <div className="font-medium">
                        {getSelectedMembre.nom} {getSelectedMembre.prenoms}
                      </div>
                      {getSelectedMembre.categorie?.label && (
                        <div className="text-sm mt-1">
                          <span className="text-blue-700">Catégorie :</span>{" "}
                          {getSelectedMembre.categorie.label}
                        </div>
                      )}
                      {getSelectedMembre.lignee?.nom && (
                        <div className="text-sm mt-1">
                          <span className="text-blue-700">Lignée :</span>{" "}
                          {getSelectedMembre.lignee.nom}
                          {getSelectedMembre.lignee.famille?.nom && (
                            <span>
                              {" "}
                              ({getSelectedMembre.lignee.famille.nom})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </FormField>
          )}

          {form.cibleType === "LIGNEE" && (
            <FormField error={errors.cibleId}>
              <div className="space-y-2">
                <select
                  value={form.cibleId}
                  onChange={(e) => handleChange("cibleId", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  disabled={!isEditable}
                >
                  <option value="">--- Sélectionner une lignée ---</option>
                  {lignees.map((lignee) => (
                    <option
                      key={lignee.id}
                      value={lignee.id}
                      title={getLigneeDisplayText(lignee)}
                    >
                      {getLigneeDisplayText(lignee)}
                    </option>
                  ))}
                </select>

                {getSelectedLignee && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm font-semibold text-green-800">
                      Lignée sélectionnée :
                    </div>
                    <div className="mt-1 text-green-900">
                      <div className="font-medium">{getSelectedLignee.nom}</div>
                      {getSelectedLignee.famille?.nom && (
                        <div className="text-sm mt-1">
                          <span className="text-green-700">Famille :</span>{" "}
                          {getSelectedLignee.famille.nom}
                        </div>
                      )}
                      {getSelectedLignee.membres?.length > 0 && (
                        <div className="text-sm mt-1">
                          <span className="text-green-700">Membres :</span>{" "}
                          {getSelectedLignee.membres.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </FormField>
          )}

          {form.cibleType === "CATEGORIE" && (
            <FormField error={errors.cibleId}>
              <div className="space-y-2">
                <select
                  value={form.cibleId}
                  onChange={(e) => handleChange("cibleId", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  disabled={!isEditable}
                >
                  <option value="">--- Sélectionner une catégorie ---</option>
                  {categories.map((categorie) => (
                    <option
                      key={categorie.id}
                      value={categorie.id}
                      title={getCategorieDisplayText(categorie)}
                    >
                      {getCategorieDisplayText(categorie)}
                    </option>
                  ))}
                </select>

                {getSelectedCategorie && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-sm font-semibold text-purple-800">
                      Catégorie sélectionnée :
                    </div>
                    <div className="mt-1 text-purple-900">
                      <div className="font-medium">
                        {getSelectedCategorie.label}
                      </div>
                      {getSelectedCategorie.generation && (
                        <div className="text-sm mt-1">
                          <span className="text-purple-700">Génération :</span>{" "}
                          {getSelectedCategorie.generation}
                        </div>
                      )}
                      {getSelectedCategorie.classe && (
                        <div className="text-sm mt-1">
                          <span className="text-purple-700">Classe :</span>{" "}
                          {getSelectedCategorie.classe}
                        </div>
                      )}
                      <div className="text-sm mt-1">
                        <span className="text-purple-700">Membres :</span>{" "}
                        {getSelectedCategorie.membres?.length ||
                          getSelectedCategorie.membreCount ||
                          0}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormField>
          )}

          {form.cibleType === "GENERATION" && (
            <FormField
              error={errors.cibleIds}
              help="Sélectionnez une ou plusieurs catégories concernées"
            >
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                {categories.map((categorie) => (
                  <label
                    key={categorie.id}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={form.cibleIds.includes(categorie.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...form.cibleIds, categorie.id]
                          : form.cibleIds.filter((id) => id !== categorie.id);
                        handleChange("cibleIds", newIds);
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                      disabled={!isEditable}
                    />
                    <span className="flex-1 font-medium">
                      {categorie.label}
                    </span>
                    <div className="flex gap-2 text-xs">
                      {categorie.generation && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {categorie.generation}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded">
                        {categorie.membres?.length ||
                          categorie.membreCount ||
                          0}{" "}
                        membres
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {form.cibleIds.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-sm font-semibold text-amber-800">
                    Génération sélectionnée : {form.cibleIds.length} catégorie
                    {form.cibleIds.length > 1 ? "s" : ""}
                  </div>
                  <div className="mt-2 text-amber-900 text-sm">
                    <div className="font-medium">Catégories :</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {form.cibleIds.map((id) => {
                        const cat = categories.find((c) => c.id === id);
                        return cat ? (
                          <span
                            key={id}
                            className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs"
                          >
                            {cat.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </FormField>
          )}

          <FormField
            label="Date limite de paiement"
            error={errors.dateLimite}
            help="Optionnel - Si vide, pas de date limite"
          >
            <div className="relative">
              <input
                type="date"
                value={form.dateLimite}
                onChange={(e) => handleChange("dateLimite", e.target.value)}
                min={formatDateForInput(new Date())}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                disabled={!isEditable}
              />
              <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </FormField>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-gray-500">
          {initialData
            ? `Modification de l'amende ${initialData.reference}`
            : "Création d'une nouvelle amende"}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !isEditable}
            className={`px-4 py-2 rounded-lg text-white transition
              ${
                loading || !isEditable
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {initialData ? "Modification..." : "Enregistrement..."}
              </span>
            ) : initialData ? (
              "Modifier l'amende"
            ) : (
              "Créer l'amende"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}