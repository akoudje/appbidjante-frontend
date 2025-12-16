// frontend/src/pages/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { apiGet } from "../utils/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  UsersIcon,
  HeartIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

// Petite utilitaire pour formatage nombre
const num = (value) => {
  const n = Number(value || 0);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("fr-FR");
};

// Formatage monétaire
const formatCurrency = (value) => {
  return `${num(value)} FCFA`;
};

// Couleurs pour les graphiques
const CHART_COLORS = {
  cotisations: "#3B82F6", // blue-500
  paiements: "#10B981", // emerald-500
  impayes: "#F59E0B", // amber-500
  deces: "#EF4444", // red-500
};

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("année"); // année, mois, trimestre
  const [expandedCards, setExpandedCards] = useState({
    graphique: true,
    familles: true,
    deces: false,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiGet(`/dashboard?year=${year}`);
      setStats(data);
    } catch (err) {
      console.error("Erreur dashboard :", err);
      setError("Impossible de charger les statistiques.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [year]);

  // Calculer les tendances
  const trends = useMemo(() => {
    if (!stats) return {};
    
    const monthlyCotisations = stats.monthlyCotisations || Array(12).fill(0);
    const monthlyPaiements = stats.monthlyPaiements || Array(12).fill(0);
    
    // Calculer la tendance des cotisations (3 derniers mois vs 3 précédents)
    const last3Months = monthlyCotisations.slice(-3).reduce((a, b) => a + b, 0);
    const prev3Months = monthlyCotisations.slice(-6, -3).reduce((a, b) => a + b, 0);
    const cotisationTrend = prev3Months > 0 
      ? ((last3Months - prev3Months) / prev3Months) * 100 
      : 0;

    // Calculer la tendance des paiements
    const last3MonthsPay = monthlyPaiements.slice(-3).reduce((a, b) => a + b, 0);
    const prev3MonthsPay = monthlyPaiements.slice(-6, -3).reduce((a, b) => a + b, 0);
    const paiementTrend = prev3MonthsPay > 0 
      ? ((last3MonthsPay - prev3MonthsPay) / prev3MonthsPay) * 100 
      : 0;

    // Taux de paiement
    const totalCotisations = monthlyCotisations.reduce((a, b) => a + b, 0);
    const totalPaiements = monthlyPaiements.reduce((a, b) => a + b, 0);
    const tauxPaiement = totalCotisations > 0 
      ? (totalPaiements / totalCotisations) * 100 
      : 0;

    return {
      cotisations: cotisationTrend,
      paiements: paiementTrend,
      tauxPaiement,
    };
  }, [stats]);

  // Données pour le graphique combiné bar/line
  const chartData = useMemo(() => {
    const months = [
      "Janv", "Févr", "Mars", "Avr", "Mai", "Juin", 
      "Juil", "Août", "Sept", "Oct", "Nov", "Déc"
    ];
    
    const monthlyCotisations = stats?.monthlyCotisations || Array(12).fill(0);
    const monthlyPaiements = stats?.monthlyPaiements || Array(12).fill(0);
    
    return months.map((m, i) => ({
      mois: m,
      cotisations: monthlyCotisations[i] || 0,
      paiements: monthlyPaiements[i] || 0,
      impayes: Math.max(0, (monthlyCotisations[i] || 0) - (monthlyPaiements[i] || 0)),
    }));
  }, [stats]);

  // Données pour le graphique en anneau des paiements
  const pieData = useMemo(() => {
    if (!stats) return [];
    
    const totalCotisations = stats.monthlyCotisations?.reduce((a, b) => a + b, 0) || 0;
    const totalPaiements = stats.monthlyPaiements?.reduce((a, b) => a + b, 0) || 0;
    const impayes = Math.max(0, totalCotisations - totalPaiements);
    
    return [
      { name: "Payés", value: totalPaiements, color: CHART_COLORS.paiements },
      { name: "Impayés", value: impayes, color: CHART_COLORS.impayes },
    ].filter(item => item.value > 0);
  }, [stats]);

  // Toggle pour les sections expansibles
  const toggleCard = (card) => {
    setExpandedCards(prev => ({
      ...prev,
      [card]: !prev[card]
    }));
  };

  // ------------------ RENDER ------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Vue d'ensemble des membres, décès, cotisations et paiements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Période :</span>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="année">Année</option>
            <option value="trimestre">Trimestre</option>
            <option value="mois">Mois</option>
          </select>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Année :</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 10 }).map((_, i) => {
                const y = currentYear - i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* BANDEAU ERREUR */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={load}
            className="text-sm font-medium text-red-700 underline decoration-dotted hover:decoration-solid hover:text-red-800"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* LOADER SKELETON */}
      {loading && !stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse ${
                i >= 4 ? 'h-48' : 'h-32'
              }`}
            />
          ))}
        </div>
      )}

      {/* CONTENU PRINCIPAL */}
      {stats && (
        <>
          {/* KPIs PRINCIPAUX */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<UsersIcon className="w-6 h-6" />}
              label="Membres inscrits"
              value={num(stats.totalMembres)}
              subtitle={`${num(stats.totalMembresActifs || 0)} actifs`}
              trend={stats.evolutionMembres || 0}
              color="from-blue-500 to-blue-600"
            />
            <KpiCard
              icon={<HeartIcon className="w-6 h-6" />}
              label={`Décès en ${year}`}
              value={num(stats.nbDeces)}
              subtitle={`${num(stats.nbDecesMois || 0)} ce mois`}
              color="from-red-500 to-red-600"
            />
            <KpiCard
              icon={<CurrencyDollarIcon className="w-6 h-6" />}
              label="Cotisations encaissées"
              value={formatCurrency(stats.totalPaiementsAnnuel || 0)}
              subtitle={`Dû: ${formatCurrency(stats.totalDuAnnuel || 0)}`}
              trend={trends.paiements}
              color="from-emerald-500 to-emerald-600"
            />
            <KpiCard
              icon={<ExclamationTriangleIcon className="w-6 h-6" />}
              label="Taux de paiement"
              value={`${trends.tauxPaiement.toFixed(1)}%`}
              subtitle={`Impayés: ${formatCurrency(stats.totalImpayes || 0)}`}
              color="from-amber-500 to-amber-600"
            />
          </div>

          {/* GRAPHIQUE + MÉTRIQUES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GRAPH COTISATIONS VS PAIEMENTS */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Header avec toggle */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ChartBarIcon className="w-5 h-5 text-gray-500" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Cotisations vs Paiements ({year})
                        </h2>
                        <p className="text-sm text-gray-500">
                          Vue mensuelle sur l'année sélectionnée
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCard('graphique')}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedCards.graphique ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                  
                  {/* Statistiques rapides */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-600">Cotisations dues :</span>
                      <span className="text-sm font-semibold">{formatCurrency(stats.totalDuAnnuel || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-sm text-gray-600">Payés :</span>
                      <span className="text-sm font-semibold">{formatCurrency(stats.totalPaiementsAnnuel || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-sm text-gray-600">Impayés :</span>
                      <span className="text-sm font-semibold">{formatCurrency(stats.totalImpayes || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Taux :</span>
                      <span className={`text-sm font-semibold ${trends.tauxPaiement > 80 ? 'text-emerald-600' : trends.tauxPaiement > 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {trends.tauxPaiement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Graphique (conditionnel) */}
                {expandedCards.graphique && (
                  <div className="p-4">
                    <div style={{ width: "100%", height: 320 }}>
                      <ResponsiveContainer>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="mois" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [formatCurrency(value), ""]}
                            labelFormatter={(label) => `Mois: ${label}`}
                          />
                          <Legend />
                          <Bar 
                            dataKey="cotisations" 
                            name="Cotisations dues" 
                            fill={CHART_COLORS.cotisations}
                            radius={[2, 2, 0, 0]}
                          />
                          <Bar 
                            dataKey="paiements" 
                            name="Paiements encaissés" 
                            fill={CHART_COLORS.paiements}
                            radius={[2, 2, 0, 0]}
                          />
                          <Line
                            type="monotone"
                            dataKey="impayes"
                            name="Impayés cumulés"
                            stroke={CHART_COLORS.impayes}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* MÉTRIQUES ET DISTRIBUTION */}
            <div className="space-y-6">
              {/* GRAPHIQUE ANNEAU */}
{/*               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Répartition des paiements
                </h3>
                <div className="h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), ""]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div> */}

              {/* TOP FAMILLES */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-5 h-5 text-gray-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Top familles</h3>
                    </div>
                    <button
                      onClick={() => toggleCard('familles')}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedCards.familles ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                
                {expandedCards.familles && (
                  <div className="p-4">
                    {stats.topFamilles?.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Aucune donnée disponible
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {stats.topFamilles?.slice(0, 5).map((f, index) => (
                          <div key={f.nom + index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                                index === 0 ? 'bg-amber-500' :
                                index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-amber-700' :
                                'bg-gray-300'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{f.nom}</div>
                                {f.tauxPaiement && (
                                  <div className="text-xs text-gray-500">
                                    Taux: {f.tauxPaiement.toFixed(1)}%
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{num(f.count)} membres</div>
                              <div className="text-xs text-gray-500">
                                {f.totalCotisations ? formatCurrency(f.totalCotisations) : ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DERNIERS DÉCÈS ET TOP LIGNÉES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DERNIERS DÉCÈS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartIcon className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Derniers décès</h3>
                  </div>
                  <span className="text-sm text-gray-500">
                    {stats.nbDeces || 0} en {year}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                {stats.lastDeces?.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucun décès récent
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.lastDeces?.slice(0, 5).map((d) => (
                      <div key={d.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {d.membre?.nom} {d.membre?.prenoms}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {d.dateDeces
                                ? new Date(d.dateDeces).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                : "Date inconnue"}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                {d.membre?.lignee?.famille?.nom || "Famille inconnue"}
                              </span>
                              <span>→</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                {d.membre?.lignee?.nom || "Lignée inconnue"}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            Il y a {Math.floor((new Date() - new Date(d.dateDeces)) / (1000 * 60 * 60 * 24))} jours
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* TOP LIGNÉES */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Top lignées</h3>
                </div>
              </div>
              
              <div className="p-4">
                {stats.topLignees?.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune donnée disponible
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.topLignees?.slice(0, 6).map((l, index) => (
                      <div key={l.nom + index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-500 font-medium">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{l.nom}</div>
                            <div className="text-xs text-gray-500">
                              {l.famille || "Famille non spécifiée"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{num(l.count)} membres</div>
                            <div className="text-xs text-gray-500">
                              {l.tauxActifs ? `${l.tauxActifs.toFixed(0)}% actifs` : ''}
                            </div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            l.tendance > 0 ? 'bg-emerald-500' :
                            l.tendance < 0 ? 'bg-red-500' :
                            'bg-gray-300'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Carte KPI améliorée avec tendance
 */
function KpiCard({ icon, label, value, subtitle, trend, color }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  
  return (
    <div className="group relative overflow-hidden rounded-xl shadow-sm bg-white border border-gray-200 hover:shadow-md transition-all duration-300">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color}`}
      />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}
          >
            {icon}
          </div>
          
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositive ? 'bg-emerald-50 text-emerald-700' :
              isNegative ? 'bg-red-50 text-red-700' :
              'bg-gray-50 text-gray-700'
            }`}>
              {isPositive ? (
                <ArrowTrendingUpIcon className="w-3 h-3" />
              ) : isNegative ? (
                <ArrowTrendingDownIcon className="w-3 h-3" />
              ) : null}
              {trend !== 0 && `${Math.abs(trend).toFixed(1)}%`}
            </div>
          )}
        </div>
        
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}