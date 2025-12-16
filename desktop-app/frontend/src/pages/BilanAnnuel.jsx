// frontend/src/pages/BilanAnnuel.jsx

import { useEffect, useState, useMemo } from "react";
import { apiGet } from "../utils/api";


import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// -----------------------------------------------------------------------------
// PAGE PRINCIPALE
// -----------------------------------------------------------------------------
export default function BilanAnnuel() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiGet(`/bilan/${year}`);
      setData(res);
    } catch (err) {
      console.error("Erreur bilan :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [year]);

  const months = [
    "Janv", "Févr", "Mars", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sept", "Oct", "Nov", "Déc"
  ];

  // Données formatées pour Recharts
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.monthly.map((value, index) => ({
      mois: months[index],
      cotisations: value,
    }));
  }, [data]);

  return (
    <div className="space-y-6">

      {/* TITRE + SELECTEUR ANNEE */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bilan annuel</h1>
          <p className="text-gray-500 text-sm">
            Synthèse globale des décès, cotisations et paiements.
          </p>
        </div>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border p-2 rounded-lg bg-white shadow-sm mt-3 md:mt-0"
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

      {/* LOADING */}
      {loading || !data ? (
        <SkeletonBilan />
      ) : (
        <>
          {/* ----------------------------------------------------------------- */}
          {/* STAT CARDS (4 cartes stats) */}
          {/* ----------------------------------------------------------------- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <StatCard
              label="Décès"
              value={data.deces}
              color="red"
              icon="☠️"
            />

            <StatCard
              label="Cotisations"
              value={data.totalCotisations.toLocaleString("fr-FR") + " FCFA"}
              color="blue"
              icon="💰"
            />

            <StatCard
              label="Paiements"
              value={data.totalPaiements.toLocaleString("fr-FR") + " FCFA"}
              color="green"
              icon="📥"
            />

            <StatCard
              label="Impayés"
              value={data.totalImpayes.toLocaleString("fr-FR") + " FCFA"}
              color="orange"
              icon="⚠️"
            />

          </div>

          {/* ----------------------------------------------------------------- */}
          {/* GRAPHIQUE */}
          {/* ----------------------------------------------------------------- */}
          <div className="bg-white shadow rounded-xl p-5 border">

            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              📊 Évolution des cotisations mensuelles — {year}
            </h2>

            <div className="w-full h-72">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="cotisations"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// CARTES STATISTIQUES MODERNES
// -----------------------------------------------------------------------------
function StatCard({ label, value, color, icon }) {
  const colors = {
    red: "bg-red-100 text-red-700 border-red-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-green-100 text-green-700 border-green-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
  };

  return (
    <div
      className={`p-4 rounded-xl shadow-sm border ${colors[color]} flex flex-col gap-1`}
    >
      <div className="text-2xl">{icon}</div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SKELETON LOADING (beau chargement)
// -----------------------------------------------------------------------------
function SkeletonBilan() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg" />
        ))}
      </div>

      <div className="h-72 bg-gray-200 rounded-lg" />
    </div>
  );
}
