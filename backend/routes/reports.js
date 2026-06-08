const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/reports
 * Genera datos para reportes basados en filtros dinámicos.
 */
router.get('/', verifyToken, async (req, res) => {
  const { startDate, endDate, severity, eventType, page = 1, limit = 10 } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  let conditions = [];
  let params = [];
  let statsParams = []; // Copia para la consulta de estadísticas

  let baseQuery = `
    SELECT 
      e.id, 
      e.fecha_evento as timestamp, 
      t.nombre as eventType, 
      s.nombre as severity, 
      d.ip as sourceIp, 
      e.descripcion as details,
      e.accion_tomada as actionTaken
    FROM eventos e
    LEFT JOIN severidades s ON e.severidad_id = s.id
    LEFT JOIN tipos_eventos t ON e.tipo_evento_id = t.id
    LEFT JOIN dispositivos d ON e.dispositivo_id = d.id
  `;
  
  // 1. Lógica de filtrado dinámico
  if (startDate) { 
    const start = startDate.includes(' ') ? startDate : `${startDate} 00:00:00`;
    conditions.push("e.fecha_evento >= ?"); 
    params.push(start); 
  }
  if (endDate) { 
    const end = endDate.includes(' ') ? endDate : `${endDate} 23:59:59`;
    conditions.push("e.fecha_evento <= ?"); 
    params.push(end); 
  }
  
  // CORRECCIÓN: Si es "Todas", no filtramos por severidad
  if (severity && severity !== 'Todas' && severity !== '') { 
    // Usamos LIKE para ser más flexibles con tildes o variaciones
    const sevClean = severity.replace('í', 'i');
    conditions.push("(s.nombre LIKE ? OR s.nombre LIKE ?)"); 
    params.push(`${severity}%`, `${sevClean}%`);
  }
  if (eventType && eventType.trim() !== '') {
    conditions.push("t.nombre LIKE ?");
    params.push(`%${eventType}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  statsParams = [...params]; // Las estadísticas usan los mismos filtros pero sin LIMIT
  
  // 2. Consulta de Estadísticas Globales (Independiente de la paginación)
  const statsQuery = `
    SELECT s.nombre as severityName, COUNT(*) as count
    FROM eventos e
    LEFT JOIN severidades s ON e.severidad_id = s.id
    LEFT JOIN tipos_eventos t ON e.tipo_evento_id = t.id
    LEFT JOIN dispositivos d ON e.dispositivo_id = d.id
    ${whereClause}
    GROUP BY s.nombre
  `;

  const dataQuery = `${baseQuery} ${whereClause} ORDER BY e.fecha_evento DESC LIMIT ?, ?`;

  // Debugging log profesional
  console.log(`[ReportsAPI] Filtros aplicados: ${conditions.length > 0 ? conditions.join(' AND ') : 'NINGUNO'}`);
  console.log(`[ReportsAPI] Parámetros:`, params);

  try {
    // Ejecutar consultas en paralelo para mejor rendimiento
    const [statsResult] = await db.query(statsQuery, statsParams);
    
    // Procesar estadísticas globales
    const stats = {
      total: 0,
      critical: 0,
      bySeverity: {}
    };

    statsResult.forEach(row => {
      const count = parseInt(row.count);
      const sName = row.severityName || 'Desconocida';
      stats.total += count;
      stats.bySeverity[sName] = count;
      
      // Verificación segura de nulos para severidad crítica
      if (sName.toLowerCase().includes('crit') || sName.toLowerCase().includes('alt')) {
        stats.critical += count;
      }
    });

    // Añadir parámetros de paginación al final
    const [rows] = await db.query(dataQuery, [...params, offset, limitInt]);

    res.json({
      success: true,
      total: stats.total,
      totalPages: Math.ceil(stats.total / limitInt),
      currentPage: parseInt(page),
      stats,
      data: rows
    });
  } catch (err) {
    console.error('[ReportsAPI] Error:', err);
    res.status(500).json({ success: false, error: 'Error al generar el reporte' });
  }
});

module.exports = router;