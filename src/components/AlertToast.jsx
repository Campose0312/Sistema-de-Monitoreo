import React, { useState, useEffect, useRef } from 'react';
import { useAlerts } from '../context/AlertContext';

/**
 * AlertToast: Sistema de notificaciones efímeras (Toasts).
 * Monitorea el flujo global de eventos y reacciona ante nuevas amenazas críticas.
 */
export default function AlertToast() {
  // 1. Conexión al contexto global
  const { events } = useAlerts();
  const [toasts, setToasts] = useState([]);
  
  // Refs para control de lógica interna (no provocan re-renders)
  const processedIds = useRef(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!events || events.length === 0) return;

    // 2. Lógica para evitar notificaciones en la carga inicial (Silent Load)
    if (isFirstLoad.current) {
      events.forEach(e => processedIds.current.add(e.id));
      isFirstLoad.current = false;
      return;
    }

    // 3. Filtrar solo nuevos eventos de severidad crítica
    const newCriticalEvents = events.filter(e => 
      (e.severity === 'Crítica' || e.severity === 'Critica') && 
      !processedIds.current.has(e.id)
    );

    if (newCriticalEvents.length > 0) {
      newCriticalEvents.forEach(event => {
        // Registrar como procesado para evitar duplicados
        processedIds.current.add(event.id);

        // Crear identificador único para el Toast
        const toastId = `${event.id}-${Date.now()}`;
        
        // Agregar a la lista manteniendo un máximo de 5
        setToasts(prev => [{ ...event, toastId }, ...prev].slice(0, 5));

        // 4. Auto-eliminación (TTL de 5 segundos)
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.toastId !== toastId));
        }, 5000);
      });
    }
  }, [events]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.toastId}
          className="pointer-events-auto bg-white dark:bg-gray-800 border-l-4 border-red-600 rounded-lg shadow-2xl p-4 flex items-start gap-3 animate-bounce-in ring-1 ring-black/5"
        >
          <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {toast.eventType || 'Alerta Crítica'}
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
              {toast.details}
            </p>
            <span className="text-[10px] font-mono text-gray-400 mt-2 block">
              Origen: {toast.sourceIp || 'Desconocido'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}