import React, { useState, useEffect } from 'react';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token_v1')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
      } else {
        console.error("Error al obtener alertas:", response.statusText);
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (alertId) => {
    if (!window.confirm("¿Deseas resolver esta alerta?")) return;

    try {
      const response = await fetch(`http://localhost:3001/api/alerts/${alertId}/resolver`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token_v1')}`
        }
      });

      if (response.ok) {
        alert("Alerta resuelta correctamente");
        await fetchAlerts();
      } else {
        console.error("Error al resolver la alerta:", response.statusText);
        alert('No se pudo resolver la alerta.');
      }
    } catch (error) {
      console.error("Error al resolver la alerta:", error);
    }
  };

  const getSeverityClass = (severity) => {
    const s = severity ? severity.toLowerCase() : '';
    if (s.includes('crític') || s.includes('critic')) return 'bg-red-100 text-red-800';
    if (s.includes('alt')) return 'bg-orange-100 text-orange-800';
    if (s.includes('medi')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="p-6 lg:p-8 pt-12 space-y-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-6">Gestión de Alertas</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">ID</th>
                <th scope="col" className="px-6 py-3 font-medium">Tipo</th>
                <th scope="col" className="px-6 py-3 font-medium">Severidad</th>
                <th scope="col" className="px-6 py-3 font-medium">Mensaje</th>
                <th scope="col" className="px-6 py-3 font-medium">Estado</th>
                <th scope="col" className="px-6 py-3 font-medium">Fecha</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">Cargando alertas...</td>
                </tr>
              ) : alerts.length > 0 ? (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{alert.id}</td>
                    <td className="px-6 py-4 text-gray-700">{alert.tipo}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityClass(alert.severidad)}`}>
                        {alert.severidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate" title={alert.mensaje}>{alert.mensaje}</td>
                    <td className="px-6 py-4 text-gray-700">{alert.estado}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{alert.fecha_creacion ? new Date(alert.fecha_creacion).toLocaleString('es-ES') : 'Sin fecha'}</td>
                    <td className="px-6 py-4 text-right">
                      {alert.estado === 'activa' && (
                        <button onClick={() => handleResolve(alert.id)} className="px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                          Resolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No hay alertas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}