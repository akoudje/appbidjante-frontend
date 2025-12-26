// src/components/communiques/CommuniqueForm.jsx

import { useEffect, useState, useMemo } from "react";
import { apiPost, apiPut } from "@/utils/api";
import { toast } from "sonner";

import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  BellIcon,
  PaperClipIcon,
  UserGroupIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UsersIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";

/* =========================
   CONSTANTES
========================= */

const TYPES = [
  { 
    value: "GENERAL", 
    label: "Général", 
    color: "bg-blue-100 text-blue-800",
    icon: MegaphoneIcon,
    description: "Annonce générale au village"
  },
  { 
    value: "REUNION", 
    label: "Réunion", 
    color: "bg-green-100 text-green-800",
    icon: UsersIcon,
    description: "Convocation à une réunion"
  },
  {
    value: "CONVOCATION",
    label: "Convocation",
    color: "bg-purple-100 text-purple-800",
    icon: ClockIcon,
    description: "Convocation officielle"
  },
  { 
    value: "DECES", 
    label: "Décès", 
    color: "bg-gray-100 text-gray-800",
    icon: ExclamationTriangleIcon,
    description: "Annonce d'un décès"
  },
  {
    value: "COTISATION",
    label: "Cotisation",
    color: "bg-yellow-100 text-yellow-800",
    icon: CheckCircleIcon,
    description: "Rappel de cotisation"
  },
  { 
    value: "GRIOT", 
    label: "Griot", 
    color: "bg-orange-100 text-orange-800",
    icon: InformationCircleIcon,
    description: "Message traditionnel"
  },
];

const CANAUX = [
  { 
    value: "EMAIL", 
    label: "Email", 
    icon: EnvelopeIcon,
    color: "bg-blue-50 border-blue-200",
    description: "Courriel électronique"
  },
  { 
    value: "WHATSAPP", 
    label: "WhatsApp", 
    icon: ChatBubbleLeftRightIcon,
    color: "bg-green-50 border-green-200",
    description: "Message WhatsApp"
  },
  { 
    value: "SMS", 
    label: "SMS", 
    icon: DevicePhoneMobileIcon,
    color: "bg-emerald-50 border-emerald-200",
    description: "Message texte"
  },
  { 
    value: "PUSH", 
    label: "Notification", 
    icon: BellIcon,
    color: "bg-purple-50 border-purple-200",
    description: "Notification push"
  },
];

const CIBLES = [
  {
    value: "ALL",
    label: "Tout le monde",
    icon: UserGroupIcon,
    description: "Tous les membres du village",
    badgeColor: "bg-blue-100 text-blue-800"
  },
  {
    value: "FAMILLE",
    label: "Grande famille",
    icon: UserGroupIcon,
    description: "Membres d'une famille spécifique",
    badgeColor: "bg-green-100 text-green-800"
  },
  {
    value: "LIGNEE",
    label: "Lignée",
    icon: UserGroupIcon,
    description: "Membres d'une lignée spécifique",
    badgeColor: "bg-purple-100 text-purple-800"
  },
  {
    value: "CATEGORIE",
    label: "Catégorie",
    icon: UserGroupIcon,
    description: "Membres par catégorie d'âge",
    badgeColor: "bg-yellow-100 text-yellow-800"
  },
  {
    value: "CUSTOM",
    label: "Sélection personnalisée",
    icon: UserGroupIcon,
    description: "Choisir les membres individuellement",
    badgeColor: "bg-gray-100 text-gray-800"
  },
];

/* =========================
   COMPONENT
========================= */

export default function CommuniqueForm({ initialData, onSuccess, onCancel }) {
  const isEdit = Boolean(initialData?.id);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titre: "",
    contenu: "",
    type: "GENERAL",
    canaux: [],
    cibleType: "ALL",
    cibleIds: [],
  });

  const [caracteresRestants, setCaracteresRestants] = useState(5000);
  const [validationErrors, setValidationErrors] = useState({});

  /* =========================
     MÉMO & CALCULS
  ========================== */


  const selectedType = useMemo(() => 
    TYPES.find(t => t.value === form.type) || TYPES[0],
    [form.type]
  );

  const selectedCible = useMemo(() => 
    CIBLES.find(c => c.value === form.cibleType) || CIBLES[0],
    [form.cibleType]
  );

  /* =========================
     INIT EDIT
  ========================== */
  useEffect(() => {
    if (initialData) {
      setForm({
        titre: initialData.titre ?? "",
        contenu: initialData.contenu ?? "",
        type: initialData.type ?? "GENERAL",
        canaux: initialData.canaux ?? [],
        cibleType: initialData.cibleType ?? "ALL",
        cibleIds: initialData.cibleIds ?? [],
      });
      setCaracteresRestants(5000 - (initialData.contenu?.length || 0));
    }
  }, [initialData]);

  /* =========================
     HANDLERS
  ========================== */
  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    
    if (key === "contenu") {
      setCaracteresRestants(5000 - value.length);
      if (validationErrors.contenu) {
        setValidationErrors(prev => ({ ...prev, contenu: null }));
      }
    }
    
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const toggleCanal = (canal) => {
    const newCanaux = form.canaux.includes(canal)
      ? form.canaux.filter((c) => c !== canal)
      : [...form.canaux, canal];
    
    setForm((f) => ({ ...f, canaux: newCanaux }));
    
    if (validationErrors.canaux && newCanaux.length > 0) {
      setValidationErrors(prev => ({ ...prev, canaux: null }));
    }
  };

  const handleInsertTemplate = () => {
    const templates = {
      REUNION: "Bonjour à tous,\n\nNous vous convions à une réunion qui se tiendra :\n\n📍 Lieu : \n📅 Date : \n⏰ Heure : \n\nOrdre du jour :\n1. \n2. \n3. \n\nVotre présence est importante.\n\nCordialement,",
      DECES: "Chers membres de la communauté,\n\nC'est avec une grande tristesse que nous vous annonçons le décès de :\n\n🕊️ Nom : \n📅 Date du décès : \n🏠 Lieu des obsèques : \n⏰ Heure des obsèques : \n\nQue son âme repose en paix.\n\nNos sincères condoléances à la famille.",
      COTISATION: "Chers membres,\n\nVeuillez noter que la cotisation annuelle est désormais due.\n\n💰 Montant : \n📅 Date limite : \n🏦 Compte : \n\nMerci de régulariser votre situation au plus vite.\n\nPour toute question, contactez le trésorier.",
    };

    const template = templates[form.type];
    if (template) {
      handleChange("contenu", template);
      toast.success("Template inséré");
    }
  };

  /* =========================
     VALIDATION
  ========================== */
  const validateForm = () => {
    const errors = {};
    
    if (!form.titre.trim()) {
      errors.titre = "Le titre est obligatoire";
    } else if (form.titre.length > 200) {
      errors.titre = "Le titre ne doit pas dépasser 200 caractères";
    }
    
    if (!form.contenu.trim()) {
      errors.contenu = "Le contenu est obligatoire";
    } else if (form.contenu.length > 5000) {
      errors.contenu = "Le contenu ne doit pas dépasser 5000 caractères";
    }
    
    if (form.canaux.length === 0) {
      errors.canaux = "Sélectionnez au moins un canal de diffusion";
    }
    
    if (form.cibleType === "CUSTOM" && form.cibleIds.length === 0) {
      errors.cibleIds = "Veuillez sélectionner au moins un destinataire";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* =========================
     SUBMIT
  ========================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }
    
    setLoading(true);
    try {
      const payload = { ...form };
      
      if (isEdit) {
        await apiPut(`/communiques/${initialData.id}`, payload);
        toast.success("✅ Communiqué mis à jour avec succès");
      } else {
        await apiPost("/communiques", payload);
        toast.success("✅ Communiqué créé avec succès");
      }
      
      onSuccess?.();
    } catch (err) {
      console.error("Erreur API:", err);
      toast.error(
        err?.response?.data?.error || "❌ Erreur lors de l'enregistrement"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="max-w-8xl mx-auto px-4">
      {/* EN-TÊTE */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Modifier le communiqué" : "Nouveau communiqué"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GRID PRINCIPAL - TOUTES LES SECTIONS VISIBLES */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* COLONNE GAUCHE - TITRE ET CONTENU (réduite en largeur) */}
          <div className="xl:col-span-6 space-y-6">
            {/* TITRE */}
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-900">
                  Titre du communiqué *
                </label>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  form.titre.length > 180 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {form.titre.length}/200
                </span>
              </div>
              
              <input
                value={form.titre}
                onChange={(e) => handleChange("titre", e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-lg font-medium ${
                  validationErrors.titre 
                    ? "border-red-300" 
                    : "border-gray-300"
                }`}
                placeholder="Ex: Réunion des anciens du village"
                maxLength={200}
              />
              
              {validationErrors.titre && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {validationErrors.titre}
                </div>
              )}
            </div>

            {/* CONTENU */}
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-900">
                    Contenu du message *
                  </label>
                  <button
                    type="button"
                    onClick={handleInsertTemplate}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                  >
                    Insérer un modèle
                  </button>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  caracteresRestants < 100 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {caracteresRestants} caractères restants
                </span>
              </div>
              
              {/* BARRE D'OUTILS */}
              <div className="flex flex-wrap gap-1 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.querySelector("textarea");
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = form.contenu;
                    const newText = text.substring(0, start) + "**gras**" + text.substring(end);
                    handleChange("contenu", newText);
                  }}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium"
                >
                  Gras
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.querySelector("textarea");
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = form.contenu;
                    const newText = text.substring(0, start) + "*italique*" + text.substring(end);
                    handleChange("contenu", newText);
                  }}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium"
                >
                  Italique
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("contenu", form.contenu + "\n- ")}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium"
                >
                  Liste
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("contenu", form.contenu + "\n\n---\n\n")}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium"
                >
                  Séparateur
                </button>
              </div>
              
              <textarea
                rows={14} // Augmenté pour compenser la réduction de largeur
                value={form.contenu}
                onChange={(e) => handleChange("contenu", e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-gray-700 ${
                  validationErrors.contenu 
                    ? "border-red-300" 
                    : "border-gray-300"
                }`}
                placeholder="Rédigez votre message ici..."
                maxLength={5000}
              />
              
              {validationErrors.contenu ? (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {validationErrors.contenu}
                </div>
              ) : (
                <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE - CONFIGURATION */}
          <div className="xl:col-span-6 space-y-6">
            {/* TYPE DE COMMUNIQUÉ */}
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-gray-900">
                  Type de communiqué
                </label>
                <span className={`text-xs px-2 py-1 rounded-full ${selectedType.color}`}>
                  {selectedType.label}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = form.type === t.value;
                  
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => handleChange("type", t.value)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        isSelected
                          ? `${t.color} border-2 border-indigo-500`
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'opacity-100' : 'opacity-60'}`} />
                      <div className="text-xs font-medium leading-tight">{t.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CANAUX ET DESTINATAIRES AU MÊME NIVEAU */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* CANAUX DE DIFFUSION */}
              <div className="bg-white rounded-2xl shadow-sm border p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-900">
                    Canaux de diffusion *
                  </label>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    form.canaux.length > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {form.canaux.length} sélectionné(s)
                  </span>
                </div>
                
                <div className="space-y-3">
                  {CANAUX.map((c) => {
                    const Icon = c.icon;
                    const isSelected = form.canaux.includes(c.value);
                    
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => toggleCanal(c.value)}
                        className={`w-full p-4 rounded-xl border transition-all flex items-center gap-3 ${
                          isSelected
                            ? `${c.color} border-2 border-indigo-500`
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'opacity-100' : 'opacity-60'}`} />
                        <div className="text-left flex-1">
                          <div className="font-medium text-sm">{c.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {validationErrors.canaux && (
                  <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {validationErrors.canaux}
                  </div>
                )}
              </div>

              {/* DESTINATAIRES */}
              <div className="bg-white rounded-2xl shadow-sm border p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-900">
                    Destinataires
                  </label>
                  <span className={`text-xs px-2 py-1 rounded-full ${selectedCible.badgeColor}`}>
                    {selectedCible.label}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {CIBLES.map((c) => {
                    const Icon = c.icon;
                    const isSelected = form.cibleType === c.value;
                    
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleChange("cibleType", c.value)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-indigo-50 border-2 border-indigo-500"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{c.label}</div>
                            <div className="text-xs text-gray-500">{c.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* CIBLE PERSONNALISÉE */}
                {form.cibleType === "CUSTOM" && (
                  <div className="mt-4">
                    <label className="text-xs font-medium text-gray-700 mb-2 block">
                      IDs des membres (séparés par des virgules)
                    </label>
                    <textarea
                      value={form.cibleIds.join(", ")}
                      onChange={(e) => {
                        const ids = e.target.value
                          .split(",")
                          .map(id => id.trim())
                          .filter(id => id.length > 0);
                        handleChange("cibleIds", ids);
                      }}
                      className="w-full rounded-lg border-gray-300 px-3 py-2 text-sm h-24 resize-none"
                      placeholder="Ex: 1, 2, 3, 4"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {form.cibleIds.length} membre(s) sélectionné(s)
                      </span>
                      {validationErrors.cibleIds && (
                        <span className="text-xs text-red-600">
                          {validationErrors.cibleIds}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS FIXES EN BAS */}
        <div className="sticky bottom-0 bg-white border-t shadow-lg -mx-4 px-4 py-4">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* RÉSUMÉ */}
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Portée :</div>
                  <div className="text-gray-600">
                    {form.cibleType === "ALL" ? "Tous les membres" : 
                     form.cibleType === "CUSTOM" ? `${form.cibleIds.length} membre(s)` : 
                     selectedCible.label}
                  </div>
                </div>
                
                {/* CANAUX SÉLECTIONNÉS */}
                {form.canaux.length > 0 && (
                  <div className="flex items-center gap-2">
                    {form.canaux.map(canal => {
                      const canalInfo = CANAUX.find(c => c.value === canal);
                      return canalInfo ? (
                        <span 
                          key={canal}
                          className={`text-xs px-2 py-1 rounded-full ${canalInfo.color}`}
                        >
                          {canalInfo.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-2.5 rounded-xl font-medium flex items-center gap-2 ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      {isEdit ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mettre à jour
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Créer le communiqué
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}