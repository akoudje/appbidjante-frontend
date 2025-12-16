// src/pages/Settings.jsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import useSettings from "../hooks/useSettings";
import { apiPost, apiGet } from "../utils/api";
import { toast } from "sonner";
import {
  CogIcon,
  DocumentArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import {
  ChevronRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

/**
 * getCurrentUser : adapt to your auth system
 */
function getCurrentUser() {
  // Try multiple sources for user data
  if (typeof window !== 'undefined') {
    if (window.currentUser) return window.currentUser;
    if (window.__USER__) return window.__USER__;
    if (localStorage.getItem('user')) {
      try {
        return JSON.parse(localStorage.getItem('user'));
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }
  }
  
  // Default fallback
  return { id: null, role: "user", username: "Utilisateur", email: "" };
}

function canEditSetting(setting, userRole) {
  const order = ["user", "treasurer", "manager", "admin", "superadmin"];
  const min = setting.minRole || "user";
  const userIndex = order.indexOf(userRole);
  const requiredIndex = order.indexOf(min);
  return userIndex >= requiredIndex;
}

function getRoleBadgeColor(role) {
  const colors = {
    superadmin: "bg-red-100 text-red-800 border-red-200",
    admin: "bg-purple-100 text-purple-800 border-purple-200",
    manager: "bg-blue-100 text-blue-800 border-blue-200",
    treasurer: "bg-green-100 text-green-800 border-green-200",
    user: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[role] || colors.user;
}

function SettingControl({ s, onChange, onSave, canEdit, userRole }) {
  const meta = s.meta ? JSON.parse(s.meta) : null;
  const type = s.type;
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(s.key);
      toast.success(`"${s.label}" enregistré`);
    } catch (error) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getInputType = () => {
    if (type === "password") return showPassword ? "text" : "password";
    if (type === "email") return "email";
    if (type === "number") return "number";
    if (type === "url") return "url";
    return "text";
  };

  if (type === "boolean") {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">{s.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.description || "Aucune description"}</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChange(s.key, !(String(s.value) === "true"))}
            disabled={!canEdit || isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              String(s.value) === "true" 
                ? 'bg-green-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                String(s.value) === "true" ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          
          <button
            onClick={handleSave}
            disabled={!canEdit || isSaving}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              canEdit 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              "Appliquer"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (type === "select" && Array.isArray(meta)) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{s.label}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.description || "Sélectionnez une option"}</div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              {s.value || "Non défini"}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={s.value ?? ""}
            onChange={(e) => onChange(s.key, e.target.value)}
            disabled={!canEdit || isSaving}
            className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              !canEdit 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white'
            }`}
          >
            <option value="">-- Sélectionner --</option>
            {meta.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          
          <button
            onClick={handleSave}
            disabled={!canEdit || isSaving}
            className={`px-4 py-3 rounded-xl font-medium transition-colors ${
              canEdit 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              "Enregistrer"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (type === "password") {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{s.label}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.description || "Mot de passe sécurisé"}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type={showPassword ? "text" : "password"}
              value={s.value ?? ""}
              onChange={(e) => onChange(s.key, e.target.value)}
              disabled={!canEdit || isSaving}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                !canEdit 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <button
            onClick={handleSave}
            disabled={!canEdit || isSaving}
            className={`px-4 py-3 rounded-xl font-medium transition-colors ${
              canEdit 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              "Mettre à jour"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Default text/number/email/url input
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{s.label}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.description || "Valeur personnalisée"}</div>
        </div>
        
        {meta && (meta.min || meta.max) && (
          <div className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {meta.min && `Min: ${meta.min}`} {meta.max && `Max: ${meta.max}`}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type={getInputType()}
          value={s.value ?? ""}
          onChange={(e) => onChange(s.key, e.target.value)}
          disabled={!canEdit || isSaving}
          min={meta?.min}
          max={meta?.max}
          step={meta?.step}
          className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
            !canEdit 
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white'
          }`}
          placeholder={s.placeholder || "Entrez une valeur..."}
        />
        
        <button
          onClick={handleSave}
          disabled={!canEdit || isSaving}
          className={`px-4 py-3 rounded-xl font-medium transition-colors ${
            canEdit 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            "Enregistrer"
          )}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { loading, categories, setLocalValue, saveOne, saveAll, reload } = useSettings({ autoSave: true, autosaveDelay: 1000 });
  const user = getCurrentUser();
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedSettings, setSelectedSettings] = useState([]);

  // Stats
  const stats = useMemo(() => {
    const allSettings = categories.flatMap(cat => cat.settings || []);
    const editableSettings = allSettings.filter(s => canEditSetting(s, user.role));
    
    return {
      total: allSettings.length,
      editable: editableSettings.length,
      booleans: allSettings.filter(s => s.type === "boolean").length,
      strings: allSettings.filter(s => s.type === "string" || !s.type).length,
      numbers: allSettings.filter(s => s.type === "number").length,
      selects: allSettings.filter(s => s.type === "select").length,
    };
  }, [categories, user.role]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm && selectedCategory === "all") return categories;

    return categories
      .map(cat => {
        const filteredSettings = (cat.settings || []).filter(s => {
          const matchesSearch = searchTerm 
            ? s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
              s.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
            : true;
          
          const matchesCategory = selectedCategory === "all" || cat.id === selectedCategory;
          
          return matchesSearch && matchesCategory;
        });

        return { ...cat, settings: filteredSettings };
      })
      .filter(cat => cat.settings.length > 0);
  }, [categories, searchTerm, selectedCategory]);

  const handleChange = (key, value) => setLocalValue(key, value);

  const handleSaveOne = async (key) => {
    try {
      await saveOne(key);
    } catch (error) {
      throw error;
    }
  };

  const handleSaveAll = async () => {
    try {
      await saveAll();
      toast.success("Tous les paramètres ont été sauvegardés");
    } catch (error) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const res = await apiGet("/settings/export");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settings_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export réalisé avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'export");
    }
  };

  const handleImportFile = async (file) => {
    if (!file) return;
    
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      // Validation
      if (!Array.isArray(json)) {
        throw new Error("Format JSON invalide");
      }

      await apiPost("/settings/import", { data: json });
      await reload();
      toast.success("Import réalisé avec succès");
    } catch (error) {
      console.error(error);
      toast.error(`Erreur import: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?")) {
      return;
    }

    try {
      await apiPost("/settings/reset");
      await reload();
      toast.success("Paramètres réinitialisés aux valeurs par défaut");
    } catch (error) {
      toast.error("Erreur lors de la réinitialisation");
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedSettings.length === 0) {
      toast.warning("Aucun paramètre sélectionné");
      return;
    }

    try {
      const promises = selectedSettings.map(key => saveOne(key));
      await Promise.all(promises);
      setSelectedSettings([]);
      setBulkEditMode(false);
      toast.success(`${selectedSettings.length} paramètre(s) mis à jour`);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour en masse");
    }
  };

  const toggleSettingSelection = (key) => {
    setSelectedSettings(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CogIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Paramètres système
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Gérez les configurations de l'application et des utilisateurs
            </p>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
              <div className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Paramètres totaux</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              </div>
              <DocumentTextIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Éditables</div>
              <div className="text-2xl font-bold text-green-600">{stats.editable}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Booléens</div>
              <div className="text-2xl font-bold text-purple-600">{stats.booleans}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Numériques</div>
              <div className="text-2xl font-bold text-orange-600">{stats.numbers}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Sélections</div>
              <div className="text-2xl font-bold text-indigo-600">{stats.selects}</div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Search and Filters */}
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un paramètre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {bulkEditMode && (
                <>
                  <button
                    onClick={handleBulkUpdate}
                    disabled={selectedSettings.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Appliquer ({selectedSettings.length})
                  </button>
                  <button
                    onClick={() => {
                      setBulkEditMode(false);
                      setSelectedSettings([]);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <XCircleIcon className="w-5 h-5" />
                    Annuler
                  </button>
                </>
              )}

              <button
                onClick={() => setBulkEditMode(!bulkEditMode)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  bulkEditMode
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <PlusIcon className="w-5 h-5" />
                Édition en masse
              </button>

              <button
                onClick={reload}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Recharger
              </button>

              <div className="relative group">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Export
                </button>
                <div className="absolute hidden group-hover:block right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleExport}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Export JSON
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                    Export CSV
                  </button>
                </div>
              </div>

              <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 cursor-pointer">
                <ArrowUpTrayIcon className="w-5 h-5" />
                Import
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => e.target.files && handleImportFile(e.target.files[0])}
                  disabled={importing}
                />
              </label>

              <button
                onClick={handleSaveAll}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Sauvegarder tout
              </button>
            </div>
          </div>

          {/* Advanced Controls */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 flex items-center gap-2"
            >
              <ChevronRightIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              Options avancées
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={handleResetSettings}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                      <ArchiveBoxIcon className="w-5 h-5" />
                      Réinitialiser aux valeurs par défaut
                    </button>
                    
                    <button
                      onClick={() => {
                        // Clear cache
                        localStorage.removeItem('settings_cache');
                        toast.success("Cache vidé");
                      }}
                      className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors flex items-center gap-2"
                    >
                      <TrashIcon className="w-5 h-5" />
                      Vider le cache
                    </button>
                    
                    <button
                      onClick={() => window.open('/api/settings/debug', '_blank')}
                      className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <ServerIcon className="w-5 h-5" />
                      Vue debug
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          <AnimatePresence>
            {filteredCategories.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {cat.icon === 'security' && <ShieldCheckIcon className="w-6 h-6 text-blue-500" />}
                      {cat.icon === 'notifications' && <BellIcon className="w-6 h-6 text-green-500" />}
                      {cat.icon === 'general' && <GlobeAltIcon className="w-6 h-6 text-purple-500" />}
                      {cat.icon === 'users' && <UserGroupIcon className="w-6 h-6 text-orange-500" />}
                      {cat.icon === 'appearance' && <CogIcon className="w-6 h-6 text-indigo-500" />}
                      {!cat.icon && <CogIcon className="w-6 h-6 text-gray-500" />}
                      
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cat.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {cat.description || `${cat.settings.length} paramètre(s)`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cat.settings.length} paramètre(s)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {cat.settings.map((s) => {
                    const editable = canEditSetting(s, user.role);
                    return (
                      <div key={s.key} className="relative">
                        {bulkEditMode && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8">
                            <input
                              type="checkbox"
                              checked={selectedSettings.includes(s.key)}
                              onChange={() => toggleSettingSelection(s.key)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                        )}
                        
                        <SettingControl
                          s={s}
                          onChange={handleChange}
                          onSave={handleSaveOne}
                          canEdit={editable}
                          userRole={user.role}
                        />
                        
                        {!editable && (
                          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <LockClosedIcon className="w-4 h-4" />
                            Nécessite le rôle {s.minRole || 'admin'} ou supérieur
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun paramètre trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div>
              Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Système opérationnel
              </span>
              <span>Version 2.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}