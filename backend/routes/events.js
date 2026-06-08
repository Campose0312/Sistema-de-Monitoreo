const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const { evaluateEvent } = require('../services/alertService');

// Obtener todos los eventos (con nombres reales en lugar de IDs)
// PROTEGIDO
router.get('/', verifyToken, async (req, res) => {
  try {
    // Hacemos JOIN para traer el nombre de la severidad, el tipo de evento y la IP del dispositivo
    // Usamos 'AS' para que el frontend reciba los nombres de variables que espera (timestamp, eventType, etc.)
    const query = `
      SELECT 
        e.id, 
        e.fecha_evento as timestamp, 
        e.accion_tomada as actionTaken, 
        e.descripcion as details,
        e.status,
        s.nombre as severity, 
        t.nombre as eventType, 
        d.ip as sourceIp,
        d.nombre as deviceName,
        e.dispositivo_id,
        e.tipo_evento_id,
        e.severidad_id
      FROM eventos e 
      JOIN severidades s ON e.severidad_id = s.id 
      JOIN tipos_eventos t ON e.tipo_evento_id = t.id 
      JOIN dispositivos d ON e.dispositivo_id = d.id 
      ORDER BY e.fecha_evento DESC
      LIMIT 100
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// Obtener estado de riesgo del sistema (Calculado automáticamente)
// PROTEGIDO
router.get('/system-status', verifyToken, async (req, res) => {
  try {
    // Lógica: Contar eventos críticos (ID 1 y 2) en los últimos 10 minutos
    const [rows] = await db.query(`
      SELECT COUNT(*) as count 
      FROM eventos 
      WHERE severidad_id IN (1, 2) 
      AND fecha_evento >= NOW() - INTERVAL 10 MINUTE
    `);
    
    const criticalCount = rows[0].count;
    
    // Determinar Riesgo y Estado basado en el umbral
    let riskLevel = 'Bajo';
    let systemStatus = 'Protegido';

    if (criticalCount > 5) {
      riskLevel = 'Alto';
      systemStatus = 'Crítico';
    } else if (criticalCount > 2) {
      riskLevel = 'Medio';
      systemStatus = 'Advertencia';
    }

    res.json({ riskLevel, systemStatus, criticalEventsLast10Min: criticalCount });
  } catch (err) {
    res.status(500).json({ error: 'Error al calcular estado del sistema' });
  }
});

// Obtener estadísticas generales para el dashboard
// PROTEGIDO
router.get('/stats', verifyToken, async (req, res) => {
  try {
    // 1. Total eventos hoy
    const [totalRows] = await db.query('SELECT COUNT(*) as count FROM eventos WHERE DATE(fecha_evento) = CURDATE()');
    
    // 2. Eventos críticos hoy (Severidad 1 y 2)
    const [criticalRows] = await db.query('SELECT COUNT(*) as count FROM eventos WHERE severidad_id IN (1,2) AND DATE(fecha_evento) = CURDATE()');
    
    // 3. Alertas activas (Pendientes, estado_alerta_id = 1)
    const [alertRows] = await db.query('SELECT COUNT(*) as count FROM alertas WHERE estado_alerta_id = 1');
    
    // 4. Dispositivos monitoreados
    const [deviceRows] = await db.query('SELECT COUNT(*) as count FROM dispositivos');

    res.json({
      totalEventosHoy: totalRows[0].count,
      eventosCriticosHoy: criticalRows[0].count,
      alertasActivas: alertRows[0].count,
      dispositivosMonitoreados: deviceRows[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas del sistema' });
  }
});

// Crear un evento
// PROTEGIDO
router.post('/', verifyToken, async (req, res) => {
  // El frontend envía los IDs seleccionados en los combos
  const { fecha_evento, dispositivo_id, tipo_evento_id, severidad_id, accion_tomada, descripcion } = req.body;
  
  // VALIDACIÓN BACKEND
  if (!fecha_evento || !dispositivo_id || !tipo_evento_id || !severidad_id) {
    return res.status(400).json({ error: 'Faltan datos críticos del evento' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO eventos (fecha_evento, dispositivo_id, tipo_evento_id, severidad_id, accion_tomada, descripcion, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fecha_evento, dispositivo_id, tipo_evento_id, severidad_id, accion_tomada, descripcion, 'pending']
    );

    // --- MOTOR DE ALERTAS AUTOMÁTICO ---
    let alertData = null;
    try {
      // Evaluamos si se debe generar una alerta para este evento
      alertData = await evaluateEvent(result.insertId);
    } catch (alertError) {
      console.error('Error al evaluar alertas automáticas:', alertError);
      // El evento ya se guardó correctamente, no interrumpimos la respuesta si falla la alerta
    }

    res.json({ id: result.insertId, ...req.body, alert: alertData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear evento' });
  }
});

// Actualizar un evento
// PROTEGIDO
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { fecha_evento, dispositivo_id, tipo_evento_id, severidad_id, accion_tomada, descripcion, status } = req.body;
  
  try {
    await db.query(
      'UPDATE eventos SET fecha_evento = ?, dispositivo_id = ?, tipo_evento_id = ?, severidad_id = ?, accion_tomada = ?, descripcion = ?, status = ? WHERE id = ?',
      [fecha_evento, dispositivo_id, tipo_evento_id, severidad_id, accion_tomada, descripcion, status, id]
    );
    res.json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un evento
// PROTEGIDO
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM eventos WHERE id = ?', [id]);
    res.json({ message: 'Evento eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;