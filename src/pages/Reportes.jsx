import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileDown, 
  FileSpreadsheet, 
  Filter, 
  Search, 
  Calendar, 
  ShieldAlert, 
  Activity, 
  Download,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reportes({ darkMode }) {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, bySeverity: {} });
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    severity: 'Todas',
    eventType: ''
  });

  // Paginación local
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Validación lógica: ¿Es el rango de fechas inválido? (Memoizado para evitar re-renders)
  const isDateRangeInvalid = useMemo(() => {
    if (!filters.startDate || !filters.endDate) return false;
    return new Date(filters.startDate) > new Date(filters.endDate);
  }, [filters.startDate, filters.endDate]);

  const fetchReportData = useCallback(async () => {
    if (isDateRangeInvalid) return; // Bloqueo de seguridad
    setLoading(true);

    try {
      // 1. Sanitización de filtros (Preparación para producción)
      const cleanParams = new URLSearchParams();
      
      if (filters.startDate) cleanParams.append('startDate', `${filters.startDate} 00:00:00`);
      if (filters.endDate) cleanParams.append('endDate', `${filters.endDate} 23:59:59`);
      
      // Solo enviar severidad si no es "Todas" y tiene valor
      if (filters.severity && filters.severity !== 'Todas') {
        cleanParams.append('severity', filters.severity);
      }
      
      if (filters.eventType.trim()) cleanParams.append('eventType', filters.eventType.trim());
      
      cleanParams.append('page', currentPage);
      cleanParams.append('limit', itemsPerPage);

      console.log("Pidiendo datos a:", `http://localhost:3001/api/reports?${cleanParams.toString()}`);

      const response = await fetch(`http://localhost:3001/api/reports?${cleanParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token_v1')}` }
      });
      
      const result = await response.json();
      console.log("Datos recibidos del backend:", result);

      if (result.success) {
        setData(result.data || []);
        setStats(result.stats || { total: 0, critical: 0, bySeverity: {} });
        setTotalPages(result.totalPages || 1);
      } else {
        setData([]);
        console.error("Respuesta fallida del servidor:", result);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, isDateRangeInvalid]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]); 

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1); // Resetear página al filtrar
  };

  // Lógica de exportación a EXCEL
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      Fecha: new Date(item.timestamp).toLocaleString(),
      Tipo: item.eventType,
      Severidad: item.severity,
      IP_Origen: item.sourceIp,
      Detalles: item.details,
      Accion: item.actionTaken
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Eventos");
    XLSX.writeFile(workbook, `Reporte_Seguridad_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Lógica de exportación a PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Agregar Logo de la empresa (ubicado en public/logo.png)
    // Parámetros: imagen, formato, x, y, ancho, alto
    doc.addImage('/logo.png', 'PNG', 14, 10, 22, 22);

    // Encabezado del reporte (desplazado a la derecha para no solapar el logo)
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("Reporte de Seguridad SIEM Core", 42, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 42, 29);
    doc.text(`Filtros: Severidad (${filters.severity}) | Periodo: ${filters.startDate || 'Inicio'} a ${filters.endDate || 'Hoy'}`, 42, 34);

    // Resumen estadístico en el PDF
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 40, 196, 40);
    doc.text(`Total Eventos: ${stats.total} | Críticos: ${stats.critical}`, 14, 48);

    autoTable(doc, {
      startY: 55,
      head: [['Fecha', 'Tipo', 'Severidad', 'IP Origen', 'Descripción']],
      body: data.map(item => [
        new Date(item.timestamp).toLocaleString(),
        item.eventType,
        item.severity,
        item.sourceIp,
        item.details
      ]),
      headStyles: { fillStyle: 'f', fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: (dataArg) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184); // Color gris slate-400
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        doc.text(`Página ${pageCount}`, pageWidth - 30, pageHeight - 10);
      },
    });

    doc.save(`Reporte_SIEM_${Date.now()}.pdf`);
  };

  const getSeverityBadge = (sev, isDark) => {
    const s = sev.toLowerCase();
    if (s.includes('crit')) return isDark ? 'bg-red-900/30 text-red-400 border-red-800/50' : 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('alt')) return isDark ? 'bg-orange-900/30 text-orange-400 border-orange-800/50' : 'bg-orange-100 text-orange-700 border-orange-200';
    if (s.includes('med')) return isDark ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50' : 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="space-y-10 pt-12">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>Centro de Reportes</h1>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Análisis detallado y exportación de auditoría</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToExcel}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all ${darkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportToPDF}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all ${darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
          >
            <FileDown className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* KPIs de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border shadow-sm transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Eventos</p>
          <h3 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stats.total}</h3>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm border-l-4 border-l-red-500 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Críticos</p>
          <h3 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stats.critical}</h3>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm border-l-4 border-l-indigo-500 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Alta Severidad</p>
          <h3 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stats.bySeverity['Alta'] || 0}</h3>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Estado General</p>
          <h3 className={`text-sm font-bold mt-2 flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <Activity className="w-4 h-4 text-emerald-500" /> Sistema Saludable
          </h3>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className={`p-6 rounded-2xl border shadow-sm transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center gap-2 mb-6 border-b pb-4 ${darkMode ? 'border-slate-800' : 'border-slate-50'}`}>
          <Filter className="w-4 h-4 text-indigo-600" />
          <h2 className={`text-sm font-black uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Filtros de Búsqueda</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold uppercase ml-1 ${darkMode ? 'text-white' : 'text-slate-500'}`}>Desde</label>
            <input 
              type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange}
              className={`w-full text-sm py-1.5 px-4 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-colors border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200'}`} 
            />
          </div>
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold uppercase ml-1 ${darkMode ? 'text-white' : 'text-slate-500'}`}>Hasta</label>
            <input 
              type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange}
              className={`w-full text-sm py-1.5 px-4 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-colors border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200'}`} 
            />
            {isDateRangeInvalid && (
              <p className="text-[9px] font-bold text-red-500 mt-1 animate-pulse italic">⚠️ Rango de fechas incoherente</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold uppercase ml-1 ${darkMode ? 'text-white' : 'text-slate-500'}`}>Severidad</label>
            <select 
              name="severity" value={filters.severity} onChange={handleFilterChange}
              className={`w-full text-sm py-1.5 px-4 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-colors border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200'}`}
            >
              <option>Todas</option>
              <option>Crítica</option>
              <option>Alta</option>
              <option>Media</option>
              <option>Baja</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={fetchReportData}
              disabled={isDateRangeInvalid || loading}
              className={`w-full py-1.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 ${
                isDateRangeInvalid || loading 
                  ? (darkMode ? 'bg-slate-800 text-slate-600 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200 shadow-none') 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              Generar Reporte
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-sm border-collapse divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            <thead>
              <tr className={`${darkMode ? 'bg-slate-800/50' : 'bg-slate-50/50'}`}>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-400'}`}>Fecha y Hora</th>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-400'}`}>Evento</th>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-400'}`}>Severidad</th>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-400'}`}>IP Origen</th>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-400'}`}>Detalles</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Procesando datos...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap font-mono text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{row.eventType}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${getSeverityBadge(row.severity, darkMode)}`}>
                        {row.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-600">{row.sourceIp}</td>
                    <td className={`px-6 py-4 text-xs max-w-xs truncate ${darkMode ? 'text-white' : 'text-slate-500'}`} title={row.details}>
                      {row.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium italic text-sm">
                    No se encontraron resultados para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de Tabla con Paginación */}
        {(data.length > 0 || currentPage > 1) && (
          <div className={`px-6 py-4 border-t flex justify-between items-center transition-colors ${darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
            <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Mostrando <span className="font-bold">{data.length}</span> registros (Página {currentPage})
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 border rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                Anterior
              </button>
              <div className={`flex items-center px-3 text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Página {currentPage}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= totalPages}
                className={`px-3 py-1 border rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
