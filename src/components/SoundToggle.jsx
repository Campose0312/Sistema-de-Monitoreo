import React from 'react';
import { useAlerts } from '../context/AlertContext';

/**
 * SoundToggle: Componente para activar/desactivar las alertas sonoras globales.
 * Consume el estado isSoundEnabled del AlertContext.
 * 
 * @param {boolean} darkMode - Estado actual del tema para ajustar colores.
 */
export default function SoundToggle({ darkMode }) {
  const { isSoundEnabled, setIsSoundEnabled } = useAlerts();

  // Estilos dinámicos basados en el estado del sonido y el tema (SIEM Design System)
  const activeClasses = darkMode 
    ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-400 hover:bg-indigo-900/60' 
    : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100';
    
  const inactiveClasses = darkMode 
    ? 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700' 
    : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50';

  return (
    <button
      onClick={() => setIsSoundEnabled(!isSoundEnabled)}
      className={`p-2 rounded-lg border transition-all duration-300 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 ${
        isSoundEnabled ? activeClasses : inactiveClasses
      }`}
      title={isSoundEnabled ? 'Silenciar alertas sonoras' : 'Activar sonido de alertas'}
    >
      {isSoundEnabled ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      )}
    </button>
  );
}