import React from 'react';
import AlertToast from './AlertToast';
import GlobalAlertBanner from './GlobalAlertBanner';
import SoundToggle from './SoundToggle';
import { useAlerts } from '../context/AlertContext';

/**
 * AlertSystem
 * Componente orquestador central para la interfaz de seguridad del SIEM.
 * Centraliza banners, notificaciones emergentes y controles de audio.
 * Ubicación recomendada: Layout principal o App.jsx, fuera del flujo de scroll si es posible.
 */
export default function AlertSystem() {
  // Consumo del contexto para asegurar reactividad global
  const { recentCriticalCount } = useAlerts();

  return (
    <aside id="siem-alert-orchestrator" aria-label="Sistema de Notificaciones de Seguridad">
      {/* Banner de estado crítico (se renderiza en el flujo superior si hay alertas) */}
      <GlobalAlertBanner />

      {/* Notificaciones efímeras (Toasts - Posicionamiento fijo interno) */}
      <AlertToast />

      {/* Control de audio flotante: Solo visible cuando el sistema detecta actividad crítica */}
      {recentCriticalCount > 0 && (
        <div className="fixed bottom-24 right-9 z-[9998] animate-fade-in">
          <SoundToggle darkMode={false} />
        </div>
      )}
    </aside>
  );
}