// frontend/src/components/StatsCard.jsx
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  percent, 
  trend, 
  color = "gray",
  subtitle,
  loading = false 
}) {
  const colorClasses = {
    gray: { bg: "bg-gray-50", text: "text-gray-900", accent: "text-gray-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-900", accent: "text-blue-600" },
    green: { bg: "bg-green-50", text: "text-green-900", accent: "text-green-600" },
    red: { bg: "bg-red-50", text: "text-red-900", accent: "text-red-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-900", accent: "text-amber-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-900", accent: "text-purple-600" },
    pink: { bg: "bg-pink-50", text: "text-pink-900", accent: "text-pink-600" },
  };

  const colors = colorClasses[color] || colorClasses.gray;

  if (loading) {
    return (
      <div className={`${colors.bg} rounded-xl p-5 border border-gray-200`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const isPositiveTrend = trend && (trend.startsWith("+") || parseFloat(trend) > 0);

  return (
    <div className={`${colors.bg} rounded-xl p-5 border border-gray-200 hover:shadow-sm transition-shadow duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${colors.accent} mb-1`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${colors.text}`}>
            {value?.toLocaleString() || "0"}
          </p>
          
          {(percent !== undefined || trend || subtitle) && (
            <div className="flex items-center gap-2 mt-2">
              {percent !== undefined && (
                <span className={`text-sm font-medium ${colors.accent}`}>
                  {percent}%
                </span>
              )}
              
              {trend && (
                <span className={`flex items-center gap-1 text-sm ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositiveTrend ? (
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4" />
                  )}
                  {trend}
                </span>
              )}
              
              {subtitle && (
                <span className="text-sm text-gray-500">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`p-2 rounded-lg ${colors.bg.replace('50', '100')}`}>
            <div className={`w-6 h-6 ${colors.accent}`}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}