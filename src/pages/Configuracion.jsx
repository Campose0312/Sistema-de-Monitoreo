import React, { useState, useEffect } from 'react';

export default function Configuracion({ darkMode, setDarkMode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  // Estado para formulario de configuración
  const [config, setConfig] = useState({
    simulador_intervalo: '5000',
    alerta_umbral: '5',
    alerta_tiempo: '10'
  });

  // Configuración de API
  const API_BASE = 'http://localhost:3001/api';

  // Helper para obtener el token (debe coincidir con fakeAuth.js)
  const getToken = () => localStorage.getItem('auth_token_v1');

  // 1. Cargar estado inicial al montar el componente
  useEffect(() => {
    fetchStatus();
    fetchConfig();
    
    // Opcional: Polling cada 5 segundos para mantener sincronizado si hay múltiples usuarios
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/simulator/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsRunning(data.running);
      }
    } catch (err) {
      console.error('Error obteniendo estado del simulador:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig({
          simulador_intervalo: data.simulador_intervalo || '5000',
          alerta_umbral: data.alerta_umbral || '5',
          alerta_tiempo: data.alerta_tiempo || '10'
        });
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
    }
  };

  const handleToggleSimulator = async () => {
    setLoading(true);
    setFeedback('');
    
    const action = isRunning ? 'stop' : 'start';
    
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/simulator/${action}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsRunning(data.running); // Actualizamos estado basado en respuesta del servidor
        setFeedback(data.running ? 'Simulador activo' : 'Simulador detenido');
      } else {
        setFeedback('Error: ' + (data.error || 'No se pudo cambiar el estado'));
      }
    } catch (err) {
      setFeedback('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (res.ok) {
        setFeedback('Configuración guardada y aplicada correctamente.');
        setTimeout(() => setFeedback(''), 3000);
      } else {
        setFeedback('Error al guardar la configuración.');
      }
    } catch (error) {
      setFeedback('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  return (
    <div className={`p-6 max-w-4xl mx-auto pt-12 space-y-10 transition-colors duration-300 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Configuración del Sistema</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Panel de Control del Simulador */}
        <div className={`rounded-lg shadow-md p-6 border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            Estado del Simulador
          </h2>
          
          <div className={`flex items-center justify-between mb-6 p-4 rounded-md ${darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <span className={`${darkMode ? 'text-slate-400' : 'text-gray-600'} font-medium`}>Estado actual:</span>
            <span className={`px-4 py-1 rounded-full text-sm font-bold tracking-wide ${
              isRunning ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {isRunning ? '● ACTIVO' : '● DETENIDO'}
            </span>
          </div>

          <button
            onClick={handleToggleSimulator}
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-medium shadow-sm transition-all duration-200 focus:outline-none ring-2 ring-offset-2 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed'
                : isRunning 
                  ? 'bg-red-600 hover:bg-red-700 ring-red-500' 
                  : 'bg-green-600 hover:bg-green-700 ring-green-500'
            }`}
          >
            {loading 
              ? 'Procesando...' 
              : isRunning 
                ? 'Detener Simulación' 
                : 'Iniciar Simulación'
            }
          </button>
          <p className="mt-4 text-xs text-gray-500">
            * El simulador genera tráfico sintético en segundo plano.
          </p>
        </div>

        {/* Panel de Parámetros */}
        <div className={`rounded-lg shadow-md p-6 border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
            Parámetros del Sistema
          </h2>
          
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Velocidad del Simulador</label>
              <select 
                name="simulador_intervalo" 
                value={config.simulador_intervalo} 
                onChange={handleChange}
                className={`w-full rounded-md shadow-sm focus:ring-indigo-500 py-2 border px-3 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-gray-300'}`}
              >
                <option value="5000">Rápido (Cada 5 seg)</option>
                <option value="10000">Normal (Cada 10 seg)</option>
                <option value="30000">Lento (Cada 30 seg)</option>
                <option value="60000">Muy Lento (Cada 1 min)</option>
              </select>
            </div>

            <div className={`pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-gray-100'}`}>
              <p className={`text-xs font-bold uppercase mb-3 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Reglas de Alertas Automáticas</p>
              
              <div className="mb-3">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Umbral de Eventos Críticos ({config.alerta_umbral})
                </label>
                <input 
                  type="range" 
                  name="alerta_umbral" 
                  min="1" 
                  max="20" 
                  value={config.alerta_umbral} 
                  onChange={handleChange}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}
                />
                <span className="text-xs text-gray-500">Generar alerta si hay más de {config.alerta_umbral} eventos críticos.</span>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Ventana de Tiempo (minutos)
                </label>
                <input 
                  type="number" 
                  name="alerta_tiempo" 
                  value={config.alerta_tiempo} 
                  onChange={handleChange}
                  min="1"
                  max="60"
                  className={`w-full rounded-md shadow-sm focus:ring-indigo-500 py-2 border px-3 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-gray-300'}`}
                />
                <span className="text-xs text-gray-500">Evaluar eventos ocurridos en los últimos {config.alerta_tiempo} minutos.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              Guardar Cambios
            </button>
          </form>
        </div>

      </div>

      {/* Preferencias de Interfaz (Modo Oscuro Global) */}
      <div className={`rounded-lg shadow-md p-6 border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
          Preferencias de Interfaz
        </h2>
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
          darkMode 
            ? 'bg-indigo-500/10 border-indigo-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
            : 'bg-gray-100/50 border-gray-200'
        }`}>
          <div className="space-y-0.5">
            <p className="text-sm font-bold">Esquema de Color Global</p>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Cambia el tema de toda la aplicación entre modo claro y oscuro.</p>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 ${
              darkMode 
                ? 'bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20' 
                : 'bg-white text-slate-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {darkMode ? (
              <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> Cambiar a Claro</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> Cambiar a Oscuro</>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6">
          {feedback && (
            <div className={`p-3 rounded-md text-sm animate-fade-in ${
              feedback.includes('Error') 
                ? 'bg-red-50 text-red-700 border-l-4 border-red-500' 
                : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
            }`}>
              {feedback}
            </div>
          )}
      </div>
    </div>
  );
}