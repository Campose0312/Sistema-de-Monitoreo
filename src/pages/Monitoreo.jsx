import React, { useState, useEffect, useRef } from 'react';

export default function Monitoreo() {
  const [logs, setLogs] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState({});
  const logsEndRef = useRef(null);

  const departments = [
    { id: 'admin', name: 'Administración', x: '20%', y: '20%' },
    { id: 'ventas', name: 'Ventas', x: '80%', y: '20%' },
    { id: 'almacen', name: 'Almacén', x: '20%', y: '80%' },
    { id: 'produccion', name: 'Producción', x: '80%', y: '80%' },
  ];

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    // Initial logs
    setLogs([
      { time: new Date().toLocaleTimeString(), message: '[SYSTEM] Iniciando monitor de red...', type: 'system' },
      { time: new Date().toLocaleTimeString(), message: '[SYSTEM] Cargando topología de Catatumbo Foods...', type: 'system' },
      { time: new Date().toLocaleTimeString(), message: '[SYSTEM] Servicios de detección activos.', type: 'system' },
    ]);

    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      const isAlert = Math.random() > 0.8; // 20% chance of alert
      
      let newLog = {};
      
      if (isAlert) {
        const dept = departments[Math.floor(Math.random() * departments.length)];
        const alertTypes = ['Intento de intrusión', 'Malware detectado', 'Tráfico anómalo', 'Conexión no autorizada', 'Puerto escaneado'];
        const alertMsg = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        
        newLog = { 
          time: now, 
          message: `[ALERTA] ${alertMsg} detectado en nodo ${dept.name.toUpperCase()}`, 
          type: 'error' 
        };

        // Trigger visual alert
        setActiveAlerts(prev => ({ ...prev, [dept.id]: true }));
        
        // Clear alert after 2.5 seconds
        setTimeout(() => {
          setActiveAlerts(prev => ({ ...prev, [dept.id]: false }));
        }, 2500);

      } else {
        const infoMsgs = [
          'Paquete TCP aceptado puerto 443',
          'Verificación de integridad de sistema: OK',
          'Actualización de tabla de enrutamiento',
          'Ping respuesta de Gateway: 2ms',
          'Usuario autenticado correctamente',
          'Sincronización NTP completada',
          'Análisis de heurística: Negativo',
          'Heartbeat servicio DB: Activo'
        ];
        newLog = { 
          time: now, 
          message: `[INFO] ${infoMsgs[Math.floor(Math.random() * infoMsgs.length)]}`, 
          type: 'info' 
        };
      }

      setLogs(prevLogs => {
        const updatedLogs = [...prevLogs, newLog];
        if (updatedLogs.length > 20) updatedLogs.shift(); // Keep last 20 logs for cleaner view
        return updatedLogs;
      });

    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 lg:p-8 pt-12 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Monitoreo en Vivo</h1>
          <p className="mt-1 text-gray-500">Visualización en tiempo real de la infraestructura de red de Catatumbo Foods.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium animate-pulse">
          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
          Sistema en Línea
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Consola en Cascada */}
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-700 flex flex-col h-[500px]">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            <span className="text-gray-400 text-xs font-mono">TERMINAL DE SEGURIDAD v2.4.1</span>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
            </div>
          </div>
          <div className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {logs.map((log, index) => (
              <div key={index} className={`${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'system' ? 'text-blue-400' : 'text-green-400'
              }`}>
                <span className="opacity-50 mr-3">[{log.time}]</span>
                <span>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Mapa de Red Local */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[500px] relative flex items-center justify-center overflow-hidden">
          <h3 className="absolute top-6 left-6 text-lg font-bold text-gray-900 z-10">Topología de Red</h3>
          
          {/* SVG Lines connecting center to nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#CBD5E1" />
              </marker>
            </defs>
            {departments.map((dept) => (
              <line 
                key={dept.id}
                x1="50%" 
                y1="50%" 
                x2={dept.x} 
                y2={dept.y} 
                stroke={activeAlerts[dept.id] ? '#EF4444' : '#E2E8F0'} 
                strokeWidth="2"
                strokeDasharray={activeAlerts[dept.id] ? "5,5" : "0"}
                className="transition-colors duration-300"
              />
            ))}
          </svg>

          {/* Central Node (Server) */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 ring-4 ring-indigo-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
            </div>
            <span className="mt-2 text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">CORE SERVER</span>
          </div>

          {/* Department Nodes */}
          {departments.map((dept) => (
            <div 
              key={dept.id}
              className={`absolute w-32 p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 z-10 shadow-sm
                ${activeAlerts[dept.id] 
                  ? 'bg-red-50 border-red-500 shadow-red-100 scale-110' 
                  : 'bg-white border-gray-200 hover:border-indigo-300'
                }`}
              style={{ 
                left: dept.x, 
                top: dept.y, 
                transform: 'translate(-50%, -50%)' 
              }}
            >
              <div className={`p-2 rounded-lg ${activeAlerts[dept.id] ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {dept.id === 'admin' && <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4" />}
                  {dept.id === 'ventas' && <><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></>}
                  {dept.id === 'almacen' && <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>}
                  {dept.id === 'produccion' && <path d="M2 22h20M2 11h20M12 2v20M2 17h20M2 6h20"/>}
                </svg>
              </div>
              <span className={`text-xs font-bold ${activeAlerts[dept.id] ? 'text-red-700' : 'text-gray-700'}`}>{dept.name}</span>
              {activeAlerts[dept.id] && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
