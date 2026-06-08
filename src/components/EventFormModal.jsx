import React, { useState, useEffect } from 'react';

export default function EventFormModal({ isOpen, onClose, onSave, eventToEdit, catalogs }) {
  const [formData, setFormData] = useState({
    fecha_evento: '',
    dispositivo_id: '',
    tipo_evento_id: '',
    severidad_id: '',
    accion_tomada: '',
    descripcion: ''
  });

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        fecha_evento: new Date(eventToEdit.timestamp).toISOString().slice(0, 19).replace('T', ' '),
        dispositivo_id: eventToEdit.dispositivo_id,
        tipo_evento_id: eventToEdit.tipo_evento_id,
        severidad_id: eventToEdit.severidad_id,
        accion_tomada: eventToEdit.actionTaken || '',
        descripcion: eventToEdit.details || ''
      });
    } else {
      const now = new Date();
      const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
      setFormData({
        fecha_evento: formatted,
        dispositivo_id: catalogs.devices[0]?.id || '',
        tipo_evento_id: catalogs.types[0]?.id || '',
        severidad_id: catalogs.severities[0]?.id || '',
        accion_tomada: '',
        descripcion: ''
      });
    }
  }, [eventToEdit, isOpen, catalogs]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative p-6 bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
          <h3 className="text-xl font-bold text-gray-900">{eventToEdit ? 'Editar Evento' : 'Nuevo Evento'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha/Hora</label>
            <input type="text" name="fecha_evento" value={formData.fecha_evento} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Dispositivo</label>
            <select name="dispositivo_id" value={formData.dispositivo_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required>
              <option value="">Seleccione un dispositivo</option>
              {catalogs.devices.map(d => (
                <option key={d.id} value={d.id}>{d.nombre} ({d.ip})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Evento</label>
            <select name="tipo_evento_id" value={formData.tipo_evento_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required>
              <option value="">Seleccione tipo</option>
              {catalogs.types.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Severidad</label>
            <select name="severidad_id" value={formData.severidad_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required>
              {catalogs.severities.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Acción Tomada</label>
            <input type="text" name="accion_tomada" value={formData.accion_tomada} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Detalles</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"></textarea>
          </div>
          <div className="flex justify-end pt-2">
            <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}