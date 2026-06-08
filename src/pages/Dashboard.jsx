import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
} from 'recharts';
import EventDetailModal from '../components/EventDetailModal';
import { MetricCard, InsightCard, FilterBadge } from '../components/DashboardWidgets';
import SoundToggle from '../components/SoundToggle';
import { useAlerts } from '../context/AlertContext';

// Constantes de configuración fuera del componente para limpieza y evitar re-declaraciones
const API_URL = 'http://localhost:3001/api/events';
const getToken = () => localStorage.getItem('auth_token_v1');

// Colores profesionales para severidad (Estilo SIEM)
const COLORS = {
  'Baja': '#3B82F6',    // Blue 500
  'Media': '#EAB308',   // Yellow 500
  'Alta': '#F97316',    // Orange 500
  'Crítica': '#EF4444', // Red 500
  'Critica': '#EF4444'  // Variante
};

const getColor = (name) => COLORS[name] || '#9CA3AF';

export default function Dashboard({ darkMode }) {
  // 1. Uso del contexto global en lugar de useState local para eventos
  const { events, setEvents } = useAlerts();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h'); // '24h', '7d', '30d'
  const [isSimulatingAttack, setIsSimulatingAttack] = useState(false);
  const [simulationEvents, setSimulationEvents] = useState([]);
  
  // New State for Professional Features
  const [activeFilters, setActiveFilters] = useState({}); // { severity: 'Alta', eventType: '...' }
  const [selectedEvent, setSelectedEvent] = useState(null); // For Drill-down
  const [toast, setToast] = useState(null);

  // 1. Consumo de API
  const fetchEvents = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) throw new Error('No autenticado');

      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al cargar datos');

      const data = await response.json();
      // Actualizamos el estado global del AlertContext
      setEvents(data); 
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setEvents]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // 2. Modo Demo: Simulación de Ataque
  const toggleSimulation = () => {
    if (isSimulatingAttack) {
      setIsSimulatingAttack(false);
      setSimulationEvents([]);
      showToast('Simulación detenida', 'info');
    } else {
      setIsSimulatingAttack(true);
      // Generar 50 eventos críticos falsos distribuidos en las últimas horas
      const fakeEvents = Array.from({ length: 50 }).map((_, i) => ({
        id: `sim-${i}`,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 2)).toISOString(), // Últimas 2 horas
        eventType: i % 2 === 0 ? 'Intento de Intrusión SQL' : 'DDoS Attack Detected',
        severity: 'Crítica',
        details: 'Simulación de ataque activo: Tráfico anómalo detectado desde múltiples IPs.',
        sourceIp: `192.168.1.${100 + i}`,
        actionTaken: 'Bloqueo automático'
      }));
      setSimulationEvents(fakeEvents);
      showToast('⚠️ Simulación de ataque iniciada', 'danger');
    }
  };

  // Toast helper
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 3. Procesamiento de Datos Avanzado (useMemo)
  const dashboardData = useMemo(() => {
    // Combinar eventos reales con simulados si está activo
    const allEvents = [...simulationEvents, ...events];
    if (!allEvents.length) return null;

    const now = new Date();
    let filterDate = new Date();
    
    // Configurar ventana de tiempo principal
    if (timeRange === '24h') filterDate.setHours(now.getHours() - 24);
    if (timeRange === '7d') filterDate.setDate(now.getDate() - 7);
    if (timeRange === '30d') filterDate.setDate(now.getDate() - 30);

    // Filtrar eventos actuales (Periodo Actual) con filtros interactivos
    let currentPeriodEvents = allEvents.filter(e => new Date(e.timestamp) >= filterDate);

    // Aplicar filtros interactivos (Interactivity)
    if (activeFilters.severity) {
      currentPeriodEvents = currentPeriodEvents.filter(e => (e.severity || '') === activeFilters.severity);
    }
    if (activeFilters.eventType) {
      currentPeriodEvents = currentPeriodEvents.filter(e => (e.eventType || '') === activeFilters.eventType);
    }

    // Configurar ventana de tiempo anterior (para comparar tendencias)
    let previousFilterDate = new Date(filterDate);
    if (timeRange === '24h') previousFilterDate.setHours(previousFilterDate.getHours() - 24);
    if (timeRange === '7d') previousFilterDate.setDate(previousFilterDate.getDate() - 7);
    if (timeRange === '30d') previousFilterDate.setDate(previousFilterDate.getDate() - 30);

    // Filtrar eventos anteriores (Periodo Anterior)
    const previousPeriodEvents = allEvents.filter(e => {
      const d = new Date(e.timestamp);
      return d >= previousFilterDate && d < filterDate;
    });

    // --- Métricas & KPIs con Tendencias ---
    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const metrics = {
      total: {
        value: currentPeriodEvents.length,
        trend: calculateTrend(currentPeriodEvents.length, previousPeriodEvents.length)
      },
      critical: {
        value: currentPeriodEvents.filter(e => (e.severity || '').toLowerCase().includes('crit')).length,
        trend: calculateTrend(
          currentPeriodEvents.filter(e => (e.severity || '').toLowerCase().includes('crit')).length,
          previousPeriodEvents.filter(e => (e.severity || '').toLowerCase().includes('crit')).length
        )
      },
      high: {
        value: currentPeriodEvents.filter(e => (e.severity || '').toLowerCase().includes('alta')).length,
        trend: calculateTrend(
          currentPeriodEvents.filter(e => (e.severity || '').toLowerCase().includes('alta')).length,
          previousPeriodEvents.filter(e => (e.severity || '').toLowerCase().includes('alta')).length
        )
      },
      today: {
        value: currentPeriodEvents.filter(e => {
          const d = new Date(e.timestamp);
          return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length,
        trend: 0 // No aplica comparación directa igual para "hoy" dinámico, simplificado a 0 o lógica personalizada
      }
    };

    // --- Gráfica Temporal (AreaChart) ---
    // Agrupación dinámica según rango (hora para 24h, día para 7d/30d)
    const timeMap = {};
    const timeFormat = timeRange === '24h' ? 'HH:00' : 'MM/DD';
    
    // Inicializar mapa de tiempo para continuidad visual (rellenar ceros)
    let step = timeRange === '24h' ? 3600000 : 86400000; // 1 hora o 1 día en ms
    let cursor = new Date(filterDate).getTime();
    const end = now.getTime();

    // Rellenar eje X con ceros iniciales
    while (cursor <= end) {
      const d = new Date(cursor);
      const key = timeRange === '24h' 
        ? `${String(d.getHours()).padStart(2, '0')}:00`
        : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      timeMap[key] = { time: key, eventos: 0, criticos: 0 };
      cursor += step;
    }

    // Poblar con datos reales
    currentPeriodEvents.forEach(e => {
      const d = new Date(e.timestamp);
      const key = timeRange === '24h' 
        ? `${String(d.getHours()).padStart(2, '0')}:00`
        : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      if (timeMap[key]) {
        timeMap[key].eventos += 1;
        if ((e.severity || '').toLowerCase().includes('crit')) {
          timeMap[key].criticos += 1;
        }
      }
    });

    const timeData = Object.values(timeMap);
    
    // Detección de Anomalías (Threshold simple)
    const averageEvents = timeData.reduce((acc, curr) => acc + curr.eventos, 0) / (timeData.length || 1);
    const anomalyThreshold = averageEvents * 2.5; // Umbral de anomalía

    // --- Datos para Gráfica de Severidad (Pie) ---
    const sevCounts = currentPeriodEvents.reduce((acc, curr) => {
      const s = curr.severity || 'Desconocida';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    
    const severityData = Object.keys(sevCounts).map(key => ({
      name: key,
      value: sevCounts[key]
    }));

    // --- Datos para Gráfica de Tipos (Bar) ---
    const typeCounts = currentPeriodEvents.reduce((acc, curr) => {
      const t = curr.eventType || 'Otros';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    const typeData = Object.keys(typeCounts)
      .map(key => ({ name: key, value: typeCounts[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // --- Últimos Eventos (Lista) ---
    const recentEvents = [...currentPeriodEvents]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    // --- Generación de Insights ---
    const generatedInsights = [];
    if (metrics.critical.trend > 20) {
      generatedInsights.push({ type: 'danger', text: `Aumento crítico del ${metrics.critical.trend}% en eventos de seguridad respecto al periodo anterior.` });
    }
    if (typeData.length > 0) {
      generatedInsights.push({ type: 'warning', text: `Vector de ataque principal: ${typeData[0].name} (${typeData[0].value} eventos).` });
    }
    const spike = timeData.find(d => d.eventos > anomalyThreshold && d.eventos > 5);
    if (spike) {
      generatedInsights.push({ type: 'danger', text: `Anomalía detectada: Pico de tráfico inusual a las ${spike.time}.` });
    }

    return { metrics, timeData, severityData, typeData, recentEvents, generatedInsights, anomalyThreshold };
  }, [events, timeRange, simulationEvents, activeFilters]);

  // Renderizado de carga y error
  if (loading) return (
    <div className="p-8 flex justify-center items-center h-screen bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Cargando Dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center bg-red-50 m-8 rounded-xl border border-red-100">
      <p className="text-red-600 font-bold mb-2">Error de conexión</p>
      <p className="text-sm text-red-500">{error}</p>
      <button onClick={fetchEvents} className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
        Reintentar conexión
      </button>
    </div>
  );

  if (!dashboardData) return null;
  const { metrics, timeData, severityData, typeData, recentEvents, generatedInsights, anomalyThreshold } = dashboardData;
  const hasCriticalEvents = metrics.critical.value > 0;

  // Theme classes
  const bgMain = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const textMain = darkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <div className={`min-h-screen p-6 lg:p-8 pt-12 space-y-10 transition-colors duration-300 ${bgMain} ${isSimulatingAttack ? 'border-4 border-red-500 rounded-lg m-2' : ''}`}>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-8 z-50 px-6 py-4 rounded-lg shadow-2xl animate-bounce-in border-l-4 flex items-center gap-3 ${
          toast.type === 'danger' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-indigo-500 text-indigo-700'
        }`}>
          {toast.type === 'danger' ? (
            <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Detail Drill-down Modal */}
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      
      {/* 3. ALERTA VISUAL GLOBAL */}
      {hasCriticalEvents && !activeFilters.severity && (
        <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="font-bold">ALERTA DE SEGURIDAD: Se han detectado {metrics.critical.value} eventos críticos en el periodo seleccionado.</span>
          </div>
          <button onClick={() => setActiveFilters({...activeFilters, severity: 'Crítica'})} className="text-sm bg-white text-red-600 px-3 py-1 rounded font-bold hover:bg-red-50 transition-colors">Ver Detalles</button>
        </div>
      )}

      {/* Header & Controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${textMain}`}>
            Monitor de Seguridad
            {isSimulatingAttack && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full border border-red-200 uppercase tracking-wide">Modo Simulación</span>}
          </h1>
          <p className={`mt-1 ${textMuted}`}>Visualización de amenazas y estado del sistema en tiempo real.</p>
          
          {/* Active Filters Display */}
          {(activeFilters.severity || activeFilters.eventType) && (
            <div className="flex gap-2 mt-3 animate-fade-in">
              {activeFilters.severity && <FilterBadge label="Severidad" value={activeFilters.severity} onClear={() => setActiveFilters({...activeFilters, severity: null})} darkMode={darkMode} />}
              {activeFilters.eventType && <FilterBadge label="Tipo" value={activeFilters.eventType} onClear={() => setActiveFilters({...activeFilters, eventType: null})} darkMode={darkMode} />}
              <button onClick={() => setActiveFilters({})} className="text-xs text-indigo-500 hover:underline">Limpiar todo</button>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Botón de control de sonido de alertas */}
          <SoundToggle darkMode={darkMode} />

          {/* 8. Botón Modo Demo */}
          <button 
            onClick={toggleSimulation}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 ${
              isSimulatingAttack 
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200' 
                : darkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {isSimulatingAttack ? 'Detener Ataque' : 'Simular Ataque'}
          </button>

          {/* 2. Filtro de Rango de Tiempo */}
          <div className={`p-1 rounded-lg border shadow-sm flex ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  timeRange === range 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {range === '24h' ? '24 Horas' : range === '7d' ? '7 Días' : '30 Días'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Panel de Insights Inteligentes */}
      <InsightCard insights={generatedInsights} darkMode={darkMode} />

      {/* 1. Métricas KPIs (Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Eventos" 
          value={metrics.total.value} 
          trend={metrics.total.trend} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          color="blue"
          darkMode={darkMode}
        />
        <MetricCard 
          title="Eventos Críticos" 
          value={metrics.critical.value} 
          trend={metrics.critical.trend} 
          inverseTrend // Rojo si sube (malo)
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          color="red"
          darkMode={darkMode}
        />
        <MetricCard 
          title="Alta Severidad" 
          value={metrics.high.value} 
          trend={metrics.high.trend} 
          inverseTrend
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          color="orange"
          darkMode={darkMode}
        />
        <MetricCard 
          title="Eventos Hoy" 
          value={metrics.today.value} 
          subtitle="Actividad del día actual"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          color="green"
          darkMode={darkMode}
        />
      </div>

      {/* Gráficas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 4. Gráfica Temporal Mejorada */}
        <div className={`lg:col-span-2 rounded-xl shadow-sm border p-6 transition-colors ${cardBg}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-bold ${textMain}`}>Tendencia de Eventos</h3>
            <span className={`text-xs font-medium uppercase tracking-wider ${textMuted}`}>Último periodo: {timeRange}</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEventos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCriticos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#F3F4F6'} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', color: darkMode ? '#fff' : '#111827', borderRadius: '8px', border: darkMode ? '1px solid #374151' : 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ stroke: darkMode ? '#6B7280' : '#9CA3AF', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <ReferenceLine y={anomalyThreshold} label="Umbral Anomalía" stroke="red" strokeDasharray="3 3" opacity={0.5} />
                <Area type="monotone" name="Total Eventos" dataKey="eventos" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorEventos)" activeDot={{ r: 6 }} />
                <Area type="monotone" name="Críticos" dataKey="criticos" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCriticos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica Severidad */}
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${cardBg}`}>
          <h3 className={`text-lg font-bold mb-2 ${textMain}`}>Distribución por Severidad</h3>
          <p className={`text-sm mb-6 ${textMuted}`}>Proporción de eventos según nivel de riesgo</p>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  onClick={(data) => setActiveFilters({...activeFilters, severity: data.name})}
                  className="cursor-pointer"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.name)} style={{ outline: 'none' }} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: darkMode ? '#fff' : '#000' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            {/* KPI Central en Dona */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-3xl font-bold ${textMain}`}>{metrics.total.value}</span>
              <span className={`text-xs uppercase font-medium ${textMuted}`}>Eventos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfica Tipos */}
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${cardBg}`}>
          <h3 className={`text-lg font-bold mb-6 ${textMain}`}>Top Tipos de Amenazas</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#374151' : '#F3F4F6'} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11, fill: darkMode ? '#9CA3AF' : '#4B5563'}} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: darkMode ? '#374151' : '#F3F4F6', radius: 4}} 
                  contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: darkMode ? '#fff' : '#000' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#8B5CF6" 
                  radius={[0, 4, 4, 0]} 
                  barSize={24} 
                  name="Cantidad"
                  onClick={(data) => setActiveFilters({...activeFilters, eventType: data.name})}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Panel de Eventos Recientes Mejorado */}
        <div className={`lg:col-span-2 rounded-xl shadow-sm border p-6 flex flex-col transition-colors ${cardBg}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-bold ${textMain}`}>Bitácora en Tiempo Real</h3>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 transition-colors">
              Ver todo <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent space-y-3">
              {recentEvents.map(event => (
                <div 
                  key={event.id} 
                  onClick={() => setSelectedEvent(event)}
                  className={`group p-4 rounded-lg border hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer flex items-start gap-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0`} style={{ backgroundColor: getColor(event.severity) }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-semibold truncate ${textMain}`}>{event.eventType}</p>
                      <span className={`text-xs font-mono whitespace-nowrap ml-2 ${textMuted}`}>
                        {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 group-hover:${textMain} transition-colors ${textMuted}`}>{event.details}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        (event.severity || '').toLowerCase().includes('crit') ? 'bg-red-50 text-red-700 border-red-100' : 
                        (event.severity || '').toLowerCase().includes('alta') ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        (event.severity || '').toLowerCase().includes('media') ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {event.severity}
                      </span>
                      {event.sourceIp && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                          IP: {event.sourceIp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {recentEvents.length === 0 && (
                <div className={`text-center py-10 text-sm ${textMuted}`}>No hay eventos registrados en este periodo.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
