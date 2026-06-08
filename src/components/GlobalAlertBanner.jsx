import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

/**
 * GlobalAlertBanner
 * Componente de alerta crítica para la parte superior del Dashboard.
 */
export default function GlobalAlertBanner() {
  // 1. Consumo de datos derivados del contexto (evita cálculos duplicados)
  const { recentCriticalCount } = useAlerts();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // 2. Lógica de visualización condicional (Zero-overhead si no hay alertas)
  if (dismissed || !recentCriticalCount || recentCriticalCount === 0) return null;

  return (
    <div className="w-full mt-14 mb-6 bg-red-600 text-white pl-6 pr-16 py-4 rounded-xl shadow-[0_8px_30px_rgb(220,38,38,0.4)] flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce-in border border-red-500/50 relative overflow-hidden">
      {/* Efecto de pulso de fondo para estilo de monitoreo */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 animate-pulse opacity-30 pointer-events-none"></div>

      {/* Botón para cerrar la alerta manualmente */}
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-white/20 transition-colors text-white/70 hover:text-white"
        title="Descartar alerta"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-4 relative z-10">
        <div className="flex-shrink-0 bg-white/20 p-2.5 rounded-lg backdrop-blur-sm border border-white/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-0.5">
          <h4 className="font-black text-[10px] uppercase tracking-[0.25em] text-red-100 opacity-80">
            Estado de Amenaza Crítico
          </h4>
          <p className="text-lg font-bold leading-tight">
            Se detectaron <span className="underline decoration-2 underline-offset-4">{recentCriticalCount}</span> eventos críticos en el sistema
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
        <button
          onClick={() => navigate('/eventos')}
          className="w-full md:w-auto px-6 py-2.5 bg-white text-red-700 font-bold text-sm rounded-lg hover:bg-red-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ring-2 ring-red-400/20 group"
        >
          <span>Ver detalles</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}