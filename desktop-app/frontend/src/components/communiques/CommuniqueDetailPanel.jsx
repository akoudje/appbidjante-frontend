// src/components/communiques/CommuniqueDetailPanel.jsx - VERSION AMÉLIORÉE

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiGet } from "@/utils/api";
import StatusBadge from "@/components/StatusBadge";

import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  BellAlertIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  TagIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// Configuration des canaux avec icônes et couleurs
const CANAL_CONFIG = {
  SMS: {
    label: "SMS",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: DevicePhoneMobileIcon,
    iconColor: "text-green-600",
  },
  EMAIL: {
    label: "Email",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: EnvelopeIcon,
    iconColor: "text-blue-600",
  },
  WHATSAPP: {
    label: "WhatsApp",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: ChatBubbleLeftRightIcon,
    iconColor: "text-emerald-600",
  },
  PUSH: {
    label: "Notification",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: BellAlertIcon,
    iconColor: "text-purple-600",
  },
};

// Configuration des statuts de diffusion
const DIFFUSION_STATUS_CONFIG = {
  ENVOYE: {
    label: "Envoyé",
    color: "bg-green-100 text-green-800",
    icon: CheckCircleIcon,
  },
  ECHEC: {
    label: "Échec",
    color: "bg-red-100 text-red-800",
    icon: XCircleIcon,
  },
  EN_ATTENTE: {
    label: "En attente",
    color: "bg-orange-100 text-orange-800",
    icon: ClockIcon,
  },
  EN_COURS: {
    label: "En cours",
    color: "bg-blue-100 text-blue-800",
    icon: ArrowPathIcon,
  },
};

// Configuration des types de cibles
const CIBLE_TYPE_CONFIG = {
  INDIVIDU: {
    label: "Individu",
    icon: UserIcon,
    color: "bg-blue-50 text-blue-700",
  },
  GROUPE: {
    label: "Groupe",
    icon: UsersIcon,
    color: "bg-green-50 text-green-700",
  },
  CATEGORIE: {
    label: "Catégorie",
    icon: TagIcon,
    color: "bg-purple-50 text-purple-700",
  },
  TOUS: {
    label: "Tous",
    icon: UsersIcon,
    color: "bg-gray-50 text-gray-700",
  },
};

export default function CommuniqueDetailPanel({ communique }) {
  const [diffusions, setDiffusions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedCanal, setSelectedCanal] = useState("TOUS");

  useEffect(() => {
    if (!communique?.id) return;

    setLoading(true);
    apiGet(`/communiques/${communique.id}/diffusions`)
      .then((res) => {
        const data = Array.isArray(res) ? res : [];
        setDiffusions(data);

        // Calcul des statistiques
        const stats = {
          total: data.length,
          envoyes: data.filter((d) => d.statut === "ENVOYE").length,
          echecs: data.filter((d) => d.statut === "ECHEC").length,
          enAttente: data.filter((d) => d.statut === "EN_ATTENTE").length,
          enCours: data.filter((d) => d.statut === "EN_COURS").length,
          parCanal: {},
        };

        // Statistiques par canal
        data.forEach((d) => {
          if (!stats.parCanal[d.canal]) {
            stats.parCanal[d.canal] = {
              total: 0,
              envoyes: 0,
              echecs: 0,
            };
          }
          stats.parCanal[d.canal].total++;
          if (d.statut === "ENVOYE") stats.parCanal[d.canal].envoyes++;
          if (d.statut === "ECHEC") stats.parCanal[d.canal].echecs++;
        });

        setStats(stats);
      })
      .catch(() =>
        toast.error("Erreur lors du chargement de l'historique de diffusion")
      )
      .finally(() => setLoading(false));
  }, [communique?.id]);

  // Formatage de la date
  const createdAtLabel = useMemo(() => {
    if (!communique?.createdAt) return "—";
    const d = new Date(communique.createdAt);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  }, [communique?.createdAt]);

  // Filtrage des diffusions par canal
  const filteredDiffusions = useMemo(() => {
    if (selectedCanal === "TOUS") return diffusions;
    return diffusions.filter((d) => d.canal === selectedCanal);
  }, [diffusions, selectedCanal]);

  // Formatage du contenu (détection de liens, etc.)
  const formatContent = (content) => {
    if (!content) return "—";

    // Détection des liens
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const formatted = content.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${url}</a>`;
    });

    // Détection des sauts de ligne
    return formatted.split("\n").map((line, index) => (
      <span key={index}>
        <span dangerouslySetInnerHTML={{ __html: line }} />
        <br />
      </span>
    ));
  };

  // Canaux disponibles
  const canauxDisponibles = useMemo(() => {
    const canaux = communique?.canaux || [];
    return ["TOUS", ...canaux];
  }, [communique?.canaux]);

  if (!communique) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p>Aucun communiqué sélectionné</p>
      </div>
    );
  }

  const cibleConfig = CIBLE_TYPE_CONFIG[communique.cibleType] || {
    label: communique.cibleType,
    icon: UsersIcon,
    color: "bg-gray-50 text-gray-700",
  };
  const CibleIcon = cibleConfig.icon;

  return (
    <div className="space-y-6">
      {/* =====================
          EN-TÊTE DU COMMUNIQUÉ
      ===================== */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Communiqué #{communique.id?.slice(-8)}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Créé le {createdAtLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${cibleConfig.color} border`}
              >
                <CibleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{cibleConfig.label}</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border">
                <TagIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {communique.type}
                </span>
              </div>

              <StatusBadge
                value={communique.statut}
                className="text-sm font-medium px-3 py-1.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =====================
          STATISTIQUES DE DIFFUSION
      ===================== */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <ChartBarIcon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-xs text-gray-500 mt-1">diffusions</div>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Envoyés</span>
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-700">
              {stats.envoyes}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total > 0
                ? `${Math.round(
                    (stats.envoyes / stats.total) * 100
                  )}% de réussite`
                : "—"}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Échecs</span>
              <XCircleIcon className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-700">
              {stats.echecs}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total > 0
                ? `${Math.round((stats.echecs / stats.total) * 100)}% d'échec`
                : "—"}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                En attente
              </span>
              <ClockIcon className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {stats.enAttente + stats.enCours}
            </div>
            <div className="text-xs text-gray-500 mt-1">en traitement</div>
          </div>
        </div>
      )}

      {/* =====================
          CANAUX UTILISÉS
      ===================== */}
      {communique.canaux?.length > 0 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BellAlertIcon className="w-5 h-5 text-indigo-600" />
            Canaux de diffusion
          </h3>

          <div className="flex flex-wrap gap-2">
            {communique.canaux.map((canal) => {
              const config = CANAL_CONFIG[canal] || {
                label: canal,
                color: "bg-gray-100 text-gray-800",
                icon: BellAlertIcon,
                iconColor: "text-gray-600",
              };
              const Icon = config.icon;

              return (
                <div
                  key={canal}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.color}`}
                >
                  <Icon className={`w-4 h-4 ${config.iconColor}`} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================
          CONTENU DU COMMUNIQUÉ
      ===================== */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white border-b p-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
            Contenu du communiqué
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {communique.canaux?.join(", ")} • {communique.cibleType}
          </p>
        </div>

        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-line min-h-[120px]">
            {communique.contenu ? (
              <div className="prose prose-sm max-w-none">
                {formatContent(communique.contenu)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun contenu</p>
              </div>
            )}
          </div>

          {communique.contenu && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <EyeIcon className="w-4 h-4" />
                <span>{communique.contenu.length} caractères</span>
              </div>
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4" />
                <span>{communique.contenu.split(/\s+/).length} mots</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================
          HISTORIQUE DE DIFFUSION
      ===================== */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white border-b p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ArrowPathIcon className="w-5 h-5 text-gray-600" />
                Historique de diffusion
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {filteredDiffusions.length} diffusion
                {filteredDiffusions.length !== 1 ? "s" : ""}
                {selectedCanal !== "TOUS" ? ` sur ${selectedCanal}` : ""}
              </p>
            </div>

            {/* Filtre par canal */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">
                Filtrer :
              </span>
              <div className="flex flex-wrap gap-1">
                {canauxDisponibles.map((canal) => {
                  const config =
                    canal === "TOUS"
                      ? { label: "Tous", color: "bg-gray-100 text-gray-700" }
                      : CANAL_CONFIG[canal] || {
                          label: canal,
                          color: "bg-gray-100 text-gray-700",
                        };

                  return (
                    <button
                      key={canal}
                      onClick={() => setSelectedCanal(canal)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                        selectedCanal === canal
                          ? `${config.color} ring-2 ring-offset-1 ring-gray-300`
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Canal
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Destinataire
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Statut
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date d'envoi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
                      <span className="text-sm text-gray-500">
                        Chargement de l'historique...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredDiffusions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <EnvelopeIcon className="w-12 h-12 text-gray-300" />
                      <div>
                        <p className="text-gray-500 font-medium">
                          Aucune diffusion
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {selectedCanal !== "TOUS"
                            ? `Aucune diffusion sur ${selectedCanal}`
                            : "Aucune diffusion enregistrée pour ce communiqué"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDiffusions.map((diffusion, index) => {
                  const canalConfig = CANAL_CONFIG[diffusion.canal] || {
                    label: diffusion.canal,
                    color: "bg-gray-100 text-gray-800",
                    icon: BellAlertIcon,
                    iconColor: "text-gray-600",
                  };
                  const CanalIcon = canalConfig.icon;

                  const statusConfig = DIFFUSION_STATUS_CONFIG[
                    diffusion.statut
                  ] || {
                    label: diffusion.statut,
                    color: "bg-gray-100 text-gray-800",
                    icon: ExclamationTriangleIcon,
                  };
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={diffusion.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${canalConfig.color}`}
                          >
                            <CanalIcon
                              className={`w-4 h-4 ${canalConfig.iconColor}`}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {canalConfig.label}
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="max-w-[200px]">
                          <div
                            className="text-sm text-gray-900 truncate"
                            title={diffusion.destinataire}
                          >
                            {diffusion.destinataire || "—"}
                          </div>
                          {diffusion.details && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                              {diffusion.details}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span className="font-medium">
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>
                          
                          {diffusion.messageRetour && (
                            <div className="text-xs px-2 py-1 rounded mt-1">
                              {(() => {
                                // Essayer de parser comme JSON
                                try {
                                  const info = JSON.parse(
                                    diffusion.messageRetour
                                  );

                                  if (
                                    info.type === "sms_success" &&
                                    info.trackingUrl
                                  ) {
                                    // Cas d'un SMS réussi avec URL de suivi
                                    return (
                                      <div className="space-y-1">
                                        <div className="font-medium text-green-700 mb-0.5">
                                          ✅ SMS envoyé -
                                          <a
                                            href={info.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-1 text-blue-600 hover:text-blue-800 underline"
                                            title="Voir les détails sur l'API Orange"
                                          >
                                            Suivre le SMS
                                          </a>
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                          ID:{" "}
                                          {info.messageId?.substring(0, 20) ||
                                            "N/A"}
                                        </div>
                                      </div>
                                    );
                                  } else if (info.type === "error") {
                                    // Cas d'une erreur
                                    return (
                                      <div className="text-red-600 bg-red-50 px-2 py-1 rounded">
                                        <div className="font-medium mb-0.5">
                                          Erreur :
                                        </div>
                                        <div
                                          className="truncate"
                                          title={info.error}
                                        >
                                          {info.error}
                                        </div>
                                      </div>
                                    );
                                  }
                                } catch (e) {
                                  // Si ce n'est pas du JSON, afficher tel quel
                                  return (
                                    <div
                                      className={`${
                                        diffusion.statut === "ECHEC"
                                          ? "text-red-600 bg-red-50"
                                          : "text-green-700 bg-green-50"
                                      } px-2 py-1 rounded`}
                                    >
                                      <div
                                        className="truncate"
                                        title={diffusion.messageRetour}
                                      >
                                        {diffusion.messageRetour.startsWith(
                                          "http"
                                        ) ? (
                                          <a
                                            href={diffusion.messageRetour}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                          >
                                            🔗 Suivre le SMS
                                          </a>
                                        ) : (
                                          diffusion.messageRetour
                                        )}
                                      </div>
                                    </div>
                                  );
                                }

                                // Fallback
                                return (
                                  <div
                                    className="truncate"
                                    title={diffusion.messageRetour}
                                  >
                                    {diffusion.messageRetour}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        {diffusion.sentAt ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span>
                              {new Date(diffusion.sentAt).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                }
                              )}
                              <span className="text-gray-400 mx-1">•</span>
                              {new Date(diffusion.sentAt).toLocaleTimeString(
                                "fr-FR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Non envoyé
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de tableau avec statistiques */}
        {!loading && filteredDiffusions.length > 0 && (
          <div className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Affichage de{" "}
                <span className="font-semibold">
                  {filteredDiffusions.length}
                </span>{" "}
                diffusion
                {filteredDiffusions.length !== 1 ? "s" : ""}
              </div>
              {stats && selectedCanal === "TOUS" && (
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span>{stats.envoyes} envoyés</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircleIcon className="w-4 h-4 text-red-500" />
                    <span>{stats.echecs} échecs</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4 text-orange-500" />
                    <span>{stats.enAttente + stats.enCours} en attente</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
