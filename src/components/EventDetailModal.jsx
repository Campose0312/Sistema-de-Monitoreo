import React, { useState, useEffect } from 'react';

export default function EventDetailModal({ event, onClose, onUpdate, showToast }) {
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('details'); // details, analysis, history

  // Sincronizar estado local cuando cambia el evento seleccionado
  useEffect(() => {
    if (event) {
      setCurrentStatus(event.status || 'pending');
      setTags(event.tags || []);
      setHistory(event.history || []);
      setActiveTab('details');
    }
  }, [event]);

  if (!event) return null;

  // Helper para registrar acciones en el historial local
  const logAction = (action, details = '') => {
    const newEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      user: 'Admin' // En una app real vendría del AuthProvider
    };
    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    return updatedHistory;
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === currentStatus) return;
    
    // Confirmación para acciones destructivas o críticas
    if (newStatus === 'ignored' && !window.confirm('¿Estás seguro de ignorar este evento? Desaparecerá de las alertas principales.')) return;
    
    const updatedHistory = logAction(`Cambio de estado`, `De ${currentStatus} a ${newStatus}`);
    setCurrentStatus(newStatus);
    
    // Propagar al padre
    onUpdate({ ...event, status: newStatus, history: updatedHistory });
    showToast(`Estado actualizado a ${newStatus === 'investigating' ? 'Investigando' : newStatus}`, 'success');
  };

  const handleMarkCritical = () => {
    if (event.severity === 'Crítica') return;
    if (!window.confirm('¿Escalar este evento a severidad CRÍTICA? Esto notificará a los administradores.')) return;

    const updatedHistory = logAction('Escalado de Severidad', 'Marcado manualmente como CRÍTICA');
    onUpdate({ ...event, severity: 'Crítica', history: updatedHistory });
    showToast('Evento marcado como Crítico', 'error');
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      if (!tags.includes(newTag.trim())) {
        const updatedTags = [...tags, newTag.trim()];
        setTags(updatedTags);
        setNewTag('');
        onUpdate({ ...event, tags: updatedTags }); // Actualizar al vuelo
      }
    }
  };

  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setTags(updatedTags);
    onUpdate({ ...event, tags: updatedTags });
  };

  const severityColors = {
    Baja: 'bg-blue-50 text-blue-700 ring-blue-700/10',
    Media: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    Alta: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    'Crítica': 'bg-red-50 text-red-700 ring-red-600/10',
    'Critica': 'bg-red-50 text-red-700 ring-red-600/10',
  };

  const statusOptions = [
    { id: 'pending', label: 'Pendiente', color: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
    { id: 'investigating', label: 'En Investigación', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    { id: 'resolved', label: 'Resuelto', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  ];

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
        
        {/* Header con ID y Acciones Rápidas */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-800">Evento #{event.id}</h3>
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${severityColors[event.severity] || 'bg-gray-50 text-gray-600'}`}>
              {event.severity}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Barra de Estado y Tabs */}
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center sticky top-0 z-10">
          <div className="flex p-1 bg-gray-100 rounded-lg">
            {statusOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleStatusChange(opt.id)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  currentStatus === opt.id 
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
             <button onClick={handleMarkCritical} disabled={event.severity === 'Crítica'} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md disabled:opacity-50 transition-colors">
               ! Marcar Crítico
             </button>
             <button onClick={() => handleStatusChange('ignored')} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors">
               Ignorar
             </button>
          </div>
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          
          {/* Navegación Interna */}
          <div className="flex gap-6 border-b border-gray-100 mb-6 text-sm">
            <button onClick={() => setActiveTab('details')} className={`pb-2 font-medium transition-colors ${activeTab === 'details' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>Detalles Generales</button>
            <button onClick={() => setActiveTab('analysis')} className={`pb-2 font-medium transition-colors ${activeTab === 'analysis' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>Análisis y Etiquetas</button>
            <button onClick={() => setActiveTab('history')} className={`pb-2 font-medium transition-colors ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>Historial de Acciones</button>
          </div>

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Fecha de Detección</p>
                  <p className="text-gray-900 font-mono">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Vector de Ataque</p>
                  <p className="text-gray-900 font-medium">{event.eventType}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Origen (IP)</p>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-900 font-mono">{event.sourceIp || 'N/A'}</p>
                    {event.sourceIp && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Externa</span>}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Acción Automática</p>
                  <p className="text-gray-900">{event.actionTaken || 'Solo monitoreo'}</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2">Descripción Técnica</p>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto shadow-inner">
                  {event.details}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas de Clasificación</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-indigo-900"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="+ Añadir tag (Enter)" 
                    className="text-xs border-none focus:ring-0 text-gray-600 placeholder-gray-400 min-w-[120px]"
                  />
                </div>
                <p className="text-xs text-gray-500">Presiona Enter para agregar etiquetas como "Falso Positivo", "Phishing", etc.</p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3">
                <svg className="w-5 h-5 text-yellow-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <h4 className="text-sm font-bold text-yellow-800">Notas del Analista</h4>
                  <textarea className="w-full mt-2 bg-white border-yellow-200 rounded-md text-sm p-2 focus:ring-yellow-500 focus:border-yellow-500" rows="3" placeholder="Añade notas internas sobre la investigación..."></textarea>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="relative border-l border-gray-200 ml-3 space-y-6">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 italic pl-6">No hay acciones registradas.</p>
              ) : (
                history.map((entry, i) => (
                  <div key={i} className="mb-8 ml-6 relative group">
                    <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 ring-4 ring-white">
                      <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                    </span>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                      <h3 className="text-sm font-semibold text-gray-900">{entry.action}</h3>
                      <time className="text-xs text-gray-500 font-mono">{new Date(entry.timestamp).toLocaleString()}</time>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{entry.details}</p>
                    <p className="mt-0.5 text-xs text-gray-400">Usuario: {entry.user}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all"
          >
            Cerrar Panel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all"
          >
            Guardar y Salir
          </button>
        </div>
      </div>
    </div>
  );
}