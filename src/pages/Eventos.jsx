import React, { useState, useEffect, useMemo, useCallback } from 'react';
import EventDetailModal from '../components/EventDetailModal';

const EVENTS_PER_PAGE = 10;

export default function Eventos({ darkMode }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [newEventsIds, setNewEventsIds] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [toast, setToast] = useState(null);

  // Estado para filtros, búsqueda y paginación
  const [filters, setFilters] = useState({
    severity: 'Todas',
    status: 'Todos', // Nuevo filtro de estado
    searchTerm: '',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const API_URL = 'http://localhost:3001/api/events';
  const getToken = () => localStorage.getItem('auth_token_v1');

  // Helper para mostrar notificaciones
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEvents = useCallback(async (isBackground = false) => {
    if (isBackground) setIsRefreshing(true);

    try {
      const token = getToken();
      if (!token) throw new Error('Sesión no válida o expirada');

      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al cargar eventos del servidor');

      const data = await response.json();

      // Enriquecer datos si el backend no trae estos campos aún
      const enrichedData = data.map(ev => ({
        ...ev,
        status: ev.status || 'pending', // pending, investigating, resolved, ignored
        tags: ev.tags || [],
        history: ev.history || []
      }));

      // Identificar nuevos eventos para resaltarlos
      setEvents(prevEvents => {
        if (prevEvents.length > 0 && data.length > 0) {
          const latestOldId = prevEvents[0].id;
          const newIncomingEvents = enrichedData.filter(e => e.id > latestOldId);
          if (newIncomingEvents.length > 0) {
            const newIds = new Set(newIncomingEvents.map(e => e.id));
            setNewEventsIds(newIds);
            if (!isBackground) showToast(`Se detectaron ${newIncomingEvents.length} nuevos eventos`, 'info');
            // Limpiar el resaltado después de unos segundos
            setTimeout(() => setNewEventsIds(new Set()), 3000);
          }
        }
        return enrichedData;
      });

      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000); // Actualización cada 5s
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Actualizar un evento localmente (y simular PUT al backend)
  const handleUpdateEvent = async (updatedEvent) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/${updatedEvent.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fecha_evento: updatedEvent.timestamp,
          dispositivo_id: updatedEvent.dispositivo_id,
          tipo_evento_id: updatedEvent.tipo_evento_id,
          severidad_id: updatedEvent.severidad_id,
          accion_tomada: updatedEvent.actionTaken,
          descripcion: updatedEvent.details,
          status: updatedEvent.status
        })
      });

      if (!response.ok) throw new Error('Error al sincronizar el estado con el servidor');

      setEvents(prev => prev.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev));
      
      if (selectedEvent && selectedEvent.id === updatedEvent.id) {
        setSelectedEvent(updatedEvent);
      }
    } catch (err) {
      console.error("Error al actualizar evento:", err);
      showToast(err.message, 'error');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Resetear a la primera página al cambiar filtros
  };

  const handleClearFilters = () => {
    setFilters({ severity: 'Todas', status: 'Todos', searchTerm: '' });
    setCurrentPage(1);
  };

  // Filtrado y búsqueda optimizados con useMemo
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const severityMatch = filters.severity === 'Todas' || event.severity === filters.severity;
      const statusMatch = filters.status === 'Todos' || event.status === filters.status;
      const searchMatch = filters.searchTerm === '' ||
        event.eventType.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        event.details.toLowerCase().includes(filters.searchTerm.toLowerCase());
      return severityMatch && searchMatch && statusMatch;
    });
  }, [events, filters]);

  // Paginación optimizada con useMemo
  const { paginatedEvents, totalPages } = useMemo(() => {
    // Si no hay eventos, evitar división por cero o páginas negativas
    if (filteredEvents.length === 0) return { paginatedEvents: [], totalPages: 0 };
    
    const total = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + EVENTS_PER_PAGE;
    return {
      paginatedEvents: filteredEvents.slice(startIndex, endIndex),
      totalPages: total
    };
  }, [filteredEvents, currentPage]);

  const getSeverityStyles = (severity) => {
    if (!severity) return 'bg-gray-100 text-gray-800';
    const sev = severity.toLowerCase();
    if (sev.includes('crítica') || sev.includes('critica')) return 'bg-red-700 text-white border-red-800';
    if (sev.includes('alta')) return 'bg-red-100 text-red-800 border-red-200';
    if (sev.includes('media')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200'; // Baja
  };

  const getStatusStyles = (status) => {
    switch(status) {
      case 'investigating': return 'bg-purple-100 text-purple-700 ring-purple-600/20';
      case 'resolved': return 'bg-green-100 text-green-700 ring-green-600/20';
      case 'ignored': return 'bg-gray-100 text-gray-600 ring-gray-500/10';
      default: return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'; // pending
    }
  };

  const translateStatus = (status) => {
    const map = { 'pending': 'Pendiente', 'investigating': 'Investigando', 'resolved': 'Resuelto', 'ignored': 'Ignorado' };
    return map[status] || status;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pt-12 space-y-10">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 animate-bounce-in bg-white ${
          toast.type === 'error' ? 'border-red-500 text-red-700' : 'border-emerald-500 text-emerald-700'
        }`}>
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Modal Avanzado de Gestión */}
      <EventDetailModal 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        onUpdate={handleUpdateEvent}
        showToast={showToast}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-extrabold tracking-tight transition-colors ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>Log de Eventos en Tiempo Real</h1>
        <button onClick={fetchEvents} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
          Refrescar ahora
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className={`rounded-lg shadow-sm border p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="md:col-span-1">
          <label className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>Buscar por tipo o descripción</label>
          <input type="text" name="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Ej: Malware, Login..." className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-gray-300'}`} />
        </div>
        <div className="md:col-span-1">
          <label className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>Filtrar por Severidad</label>
          <select name="severity" value={filters.severity} onChange={handleFilterChange} className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-gray-300'}`}>
            <option>Todas</option><option>Baja</option><option>Media</option><option>Alta</option><option>Crítica</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <label className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>Estado de Gestión</label>
          <select name="status" value={filters.status} onChange={handleFilterChange} className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-gray-300'}`}>
            <option value="Todos">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="investigating">En Investigación</option>
            <option value="resolved">Resueltos</option>
          </select>
        </div>
        <div className="md:col-span-1 flex justify-end">
          <button onClick={handleClearFilters} className={`py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Limpiar Filtros</button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border-l-4 border-red-500 shadow-sm">Error: {error}</div>}

      <div className={`rounded-lg shadow-md overflow-hidden border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${darkMode ? 'divide-slate-800' : 'divide-gray-200'}`}>
            <thead className={darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-500'}`}>ID</th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-500'}`}>Fecha</th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-500'}`}>Tipo</th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-500'}`}>Severidad</th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-500'}`}>Estado</th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-500'}`}>Descripción</th>
                <th className={`px-6 py-3 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-500'}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors ${darkMode ? 'bg-slate-900 divide-slate-800' : 'bg-white divide-gray-200'}`}>
              {loading && events.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan="7" className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td></tr>
                ))
              ) : paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`px-6 py-8 text-center italic ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>No se encontraron eventos con los filtros actuales.</td>
                </tr>
              ) : (
                paginatedEvents.map((event) => (
                  <tr key={event.id} className={`group transition-all duration-500 ${newEventsIds.has(event.id) ? (darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50/60') : (darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50')}`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>#{event.id}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {new Date(event.timestamp).toLocaleString('es-ES')}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{event.eventType}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full border ${getSeverityStyles(event.severity)}`}>
                        {event.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusStyles(event.status)}`}>
                        {translateStatus(event.status)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm max-w-xs truncate ${darkMode ? 'text-slate-400' : 'text-gray-600'}`} title={event.details}>{event.details}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => setSelectedEvent(event)} className="text-indigo-600 hover:text-indigo-900 font-semibold hover:bg-indigo-50 px-3 py-1 rounded transition-colors">
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación y Contador */}
        <div className={`px-6 py-4 flex items-center justify-between border-t transition-all ${darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Mostrando <span className="font-bold">{paginatedEvents.length > 0 ? ((currentPage - 1) * EVENTS_PER_PAGE) + 1 : 0}</span> a <span className="font-bold">{Math.min(currentPage * EVENTS_PER_PAGE, filteredEvents.length)}</span> de <span className="font-bold">{filteredEvents.length}</span> eventos
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`px-3 py-1 border text-sm font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Anterior
            </button>
            <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Página <span className="font-bold">{currentPage}</span> de <span className="font-bold">{totalPages || 1}</span>
            </span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className={`px-3 py-1 border text-sm font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
