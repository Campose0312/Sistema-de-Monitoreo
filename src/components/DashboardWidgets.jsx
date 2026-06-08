import React from 'react';

// --- Metric Card (KPI) ---
export function MetricCard({ title, value, trend, subtitle, icon, color, inverseTrend, darkMode }) {
  let trendColor = 'text-gray-500';
  let TrendIcon = null;

  if (trend !== undefined && trend !== 0) {
    const isPositive = trend > 0;
    const isGood = inverseTrend ? !isPositive : isPositive;
    trendColor = isGood ? 'text-emerald-500' : 'text-red-500';
    TrendIcon = isPositive 
      ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
  }

  const themeClasses = darkMode 
    ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-750' 
    : 'bg-white border-gray-100 text-gray-900 hover:shadow-md';

  const iconBg = {
    blue: darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600',
    red: darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600',
    orange: darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-600',
    green: darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className={`rounded-xl p-5 shadow-sm border transition-all duration-200 ${themeClasses}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <h3 className="text-3xl font-extrabold mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg[color]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center text-xs font-medium">
        {trend !== undefined ? (
          <>
            <span className={`flex items-center gap-1 ${trendColor} bg-opacity-10 px-2 py-0.5 rounded-md`}>
              {TrendIcon}
              {Math.abs(trend)}%
            </span>
            <span className={`ml-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>vs periodo anterior</span>
          </>
        ) : (
          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}

// --- Insight Card ---
export function InsightCard({ insights, darkMode }) {
  if (!insights || !insights.length) return null;

  return (
    <div className={`mb-6 rounded-lg border-l-4 p-4 shadow-sm animate-fade-in ${
      darkMode ? 'bg-gray-800 border-indigo-500 text-gray-200' : 'bg-white border-indigo-600 text-gray-700'
    }`}>
      <div className="flex items-start gap-3">
        <div className="p-1 bg-indigo-100 rounded-full text-indigo-600 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold uppercase mb-1">Análisis Inteligente del Sistema</h4>
          <ul className="space-y-1">
            {insights.map((insight, idx) => (
              <li key={idx} className="text-sm flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  insight.type === 'danger' ? 'bg-red-500' : insight.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                }`}></span>
                {insight.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- Filter Badge ---
export function FilterBadge({ label, value, onClear, darkMode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
      darkMode ? 'bg-indigo-900/50 text-indigo-200 border border-indigo-700' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
    }`}>
      {label}: {value}
      <button onClick={onClear} className="hover:text-indigo-900 p-0.5 rounded-full hover:bg-black/5">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </button>
    </span>
  );
}