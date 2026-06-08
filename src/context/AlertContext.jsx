import React, { createContext, useContext, useState, useMemo } from 'react';
import useAlertSound from '../hooks/useAlertSound';

const AlertContext = createContext();

/**
 * Hook personalizado para acceder al contexto de alertas
 */
export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts debe usarse dentro de un AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [events, setEvents] = useState([]);

  // 0. Integración del Hook de Sonido: Monitorea eventos y gestiona el estado del audio
  const { isSoundEnabled, setIsSoundEnabled } = useAlertSound(events);

  // 1. criticalEvents: Filtrado de eventos de severidad Crítica (con y sin tilde)
  const criticalEvents = useMemo(() => {
    return events.filter(e => e.severity === 'Crítica' || e.severity === 'Critica');
  }, [events]);

  // 2. recentCriticalCount: Conteo de críticos en la ventana de los últimos 5 minutos
  const recentCriticalCount = useMemo(() => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    return criticalEvents.filter(e => {
      const eventTime = new Date(e.timestamp).getTime();
      return !isNaN(eventTime) && eventTime > fiveMinutesAgo;
    }).length;
  }, [criticalEvents]);

  const value = {
    events,
    setEvents,
    criticalEvents,
    recentCriticalCount,
    isSoundEnabled,
    setIsSoundEnabled
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};