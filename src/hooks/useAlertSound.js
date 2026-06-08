import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook useAlertSound
 * Gestiona la reproducción de alertas sonoras para eventos críticos.
 * @param {Array} events - Lista de eventos a monitorear.
 * @returns {Object} { isSoundEnabled, setIsSoundEnabled, playManual }
 */
export default function useAlertSound(events) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const audioRef = useRef(null);
  const seenIds = useRef(new Set());
  const isInitialLoad = useRef(true);
  const lastPlayTime = useRef(0);

  // Inicialización profesional del audio mediante useEffect
  useEffect(() => {
    if (typeof Audio !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audioRef.current.preload = 'auto';
    }
  }, []);

  const play = useCallback(() => {
    if (!isSoundEnabled || !audioRef.current) return;

    const now = Date.now();

    // Anti-spam: Evitar ráfagas de sonido (mínimo 3 segundos entre alertas)
    if (now - lastPlayTime.current < 3000) return;
    lastPlayTime.current = now;

    // Reiniciar y reproducir (manejo de promesas para navegadores modernos)
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      console.log("Audio bloqueado hasta interacción del usuario.");
    });
  }, [isSoundEnabled]);

  useEffect(() => {
    if (!events?.length) return;

    // Filtrar eventos críticos que no han sido "escuchados" aún
    const newCriticalEvents = events.filter(e => {
      const isCritical = e.severity === 'Crítica' || e.severity === 'Critica';
      const isNew = !seenIds.current.has(e.id);
      return isCritical && isNew;
    });

    // Registrar IDs inmediatamente para evitar loops
    newCriticalEvents.forEach(e => seenIds.current.add(e.id));

    // Lógica de supresión: No sonar si es la carga inicial del componente
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (newCriticalEvents.length > 0) {
      play();
    }
  }, [events, play]);

  return { isSoundEnabled, setIsSoundEnabled, playManual: play };
}