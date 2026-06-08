const db = require('../db');
const { evaluateEvent } = require('./alertService');

let timerId = null;
let isRunning = false;

/**
 * Obtiene un registro aleatorio de una tabla específica.
 */
async function getRandomRecord(tableName) {
  try {
    const [rows] = await db.query(`SELECT * FROM ${tableName} ORDER BY RAND() LIMIT 1`);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    // Lanzamos el error para que la función principal sepa que hubo un fallo de conexión
    throw error;
  }
}

/**
 * Genera una descripción y acción coherente basada en el tipo y severidad.
 */
function generateContext(eventType, severity) {
  const sevName = severity.nombre ? severity.nombre.toLowerCase() : '';
  const typeName = eventType.nombre || 'Evento desconocido';
  
  let descripcion = '';
  let accion = '';

  if (sevName.includes('crítica') || sevName.includes('alta')) {
    descripcion = `ALERTA DE SEGURIDAD: ${typeName} detectado con comportamiento anómalo.`;
    accion = 'Bloqueo automático de IP y notificación al SOC';
  } else if (sevName.includes('media')) {
    descripcion = `Advertencia: ${typeName} excede los parámetros habituales.`;
    accion = 'Registro en log y monitoreo activo';
  } else {
    descripcion = `Evento de rutina: ${typeName} procesado correctamente.`;
    accion = 'Ninguna - Operación estándar';
  }

  return { descripcion, accion };
}

/**
 * Función principal que ejecuta un ciclo de simulación.
 */
async function generateEvent() {
  try {
    // 1. Obtener datos aleatorios necesarios
    const dispositivo = await getRandomRecord('dispositivos');
    const tipoEvento = await getRandomRecord('tipos_eventos');
    const severidad = await getRandomRecord('severidades');

    if (!dispositivo || !tipoEvento || !severidad) {
      console.warn('[SIMULATOR] Faltan datos en los catálogos (dispositivos, tipos o severidades) para simular.');
      return;
    }

    // 2. Generar contexto
    const { descripcion, accion } = generateContext(tipoEvento, severidad);

    // 3. Insertar el evento en la base de datos
    const query = `
      INSERT INTO eventos (fecha_evento, dispositivo_id, tipo_evento_id, severidad_id, accion_tomada, descripcion, status) 
      VALUES (NOW(), ?, ?, ?, ?, ?, 'pending')
    `;
    
    const [result] = await db.query(query, [
      dispositivo.id,
      tipoEvento.id,
      severidad.id,
      accion,
      descripcion,
    ]);

    const eventId = result.insertId;
    console.log(`[SIMULATOR] Evento generado ID: ${eventId} | Tipo: ${tipoEvento.nombre} | Sev: ${severidad.nombre}`);

    // 4. Llamar a evaluateEvent (Importado de alertService.js)
    await evaluateEvent(eventId);

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('[SIMULATOR] Error Crítico: MySQL no responde. Reintentando en el próximo ciclo...');
    } else {
      console.error('[SIMULATOR] Error en el ciclo de simulación:', error.message);
    }
  }
}

/**
 * Bucle principal de control (Loop recursivo)
 * Verifica la configuración en BD y decide si generar evento o esperar.
 */
async function runLoop() {
  if (!isRunning) return;

  let nextInterval = 5000; // Valor base por defecto
  let shouldGenerate = true;

  try {
    // 1. Consultar configuración actualizada desde BD
    const [rows] = await db.query("SELECT clave, valor FROM configuracion WHERE clave IN ('simulador_activo', 'simulador_intervalo', 'intervalo_simulador')");
    
    const config = {};
    rows.forEach(row => config[row.clave] = row.valor);

    // 2. Leer Intervalo (Soporta 'simulador_intervalo' o 'intervalo_simulador')
    const dbInterval = config['simulador_intervalo'] || config['intervalo_simulador'];
    if (dbInterval) {
      nextInterval = parseInt(dbInterval, 10);
    }

    // 3. Leer Estado Activo (simulador_activo)
    // Si no existe la clave en BD, asumimos true para no detener el servicio inesperadamente
    if (config['simulador_activo'] !== undefined) {
      shouldGenerate = config['simulador_activo'] === 'true' || config['simulador_activo'] === '1';
    }

  } catch (error) {
    console.warn('[SIMULATOR] Error leyendo configuración (usando valores por defecto):', error.message);
  }

  // 4. Ejecutar lógica si corresponde
  if (shouldGenerate) {
    await generateEvent();
  } else {
    // Si está desactivado por BD, solo esperamos (polling) sin generar eventos
    // Usamos un intervalo de espera razonable (ej. 5s) para no saturar la BD verificando
    // o usamos el mismo intervalo configurado si se prefiere.
    // console.log('[SIMULATOR] En espera (simulador_activo = false en BD)...');
  }

  // 5. Programar siguiente ciclo (si el simulador sigue encendido a nivel de proceso)
  if (isRunning) {
    timerId = setTimeout(runLoop, nextInterval);
  }
}

/**
 * Inicia el simulador.
 * Ahora solo activa el flag de proceso y arranca el loop.
 */
function start() {
  if (isRunning) {
    console.log('[SIMULATOR] El simulador ya está en ejecución.');
    return;
  }

  console.log('[SIMULATOR] Simulador iniciado. Leyendo configuración de BD...');
  isRunning = true;
  runLoop();
}

/**
 * Detiene el simulador.
 */
function stop() {
  isRunning = false;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  console.log('[SIMULATOR] Simulador detenido manualmente.');
}

/**
 * Devuelve el estado actual del simulador (true = activo).
 */
function status() {
  return isRunning;
}

/**
 * Fuerza una actualización inmediata reiniciando el ciclo actual.
 * Útil cuando se guarda la configuración desde la API para efecto instantáneo.
 */
function updateInterval() {
  if (isRunning && timerId) {
    console.log('[SIMULATOR] Configuración cambiada. Reiniciando ciclo...');
    clearTimeout(timerId);
    runLoop();
  }
}

module.exports = { start, stop, status, updateInterval };