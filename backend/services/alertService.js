const db = require('../db'); // Asume que db.js exporta la conexión a la base de datos
const https = require('https');

let lastUpdateId = 0; // Para no procesar el mismo mensaje varias veces

// Cache de credenciales para alertas de desconexión
let cachedCredentials = { token: null, chatId: null };
let isDbDownNotificationSent = false;

/**
 * Envía un mensaje a Telegram de forma asíncrona
 */
function sendTelegramNotification(token, chatId, message) {
  if (!token || !chatId) return;

  const data = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error(`[Telegram] Error de API (${res.statusCode}):`, body);
      } else {
        console.log('[Telegram] Mensaje enviado exitosamente.');
      }
    });
  });

  req.on('error', (error) => console.error('[Telegram] Error:', error));
  req.write(data);
  req.end();
}

/**
 * Genera y envía un resumen de los eventos críticos del día actual.
 */
async function sendDailySummary(token, chatId) {
  try {
    // Consultar estadísticas del día actual
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severidad_id = 1 THEN 1 ELSE 0 END) as criticos,
        SUM(CASE WHEN severidad_id = 2 THEN 1 ELSE 0 END) as altos
      FROM eventos 
      WHERE DATE(fecha_evento) = CURDATE()
    `);

    const [topTypes] = await db.query(`
      SELECT t.nombre, COUNT(*) as qty
      FROM eventos e
      JOIN tipos_eventos t ON e.tipo_evento_id = t.id
      WHERE DATE(e.fecha_evento) = CURDATE()
      GROUP BY e.tipo_evento_id
      ORDER BY qty DESC LIMIT 3
    `);

    const dateStr = new Date().toLocaleDateString();
    let message = 
      `📊 <b>RESUMEN OPERATIVO - ${dateStr}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📈 <b>Actividad de Hoy:</b>\n` +
      `┣ Total Eventos: <code>${stats[0].total || 0}</code>\n` +
      `┣ Críticos (🚨): <code>${stats[0].criticos || 0}</code>\n` +
      `┗ Altos (⚠️): <code>${stats[0].altos || 0}</code>\n\n` +
      `🔥 <b>Principales Amenazas:</b>\n`;

    if (topTypes.length > 0) {
      topTypes.forEach(t => message += `• ${t.nombre}: <code>${t.qty}</code>\n`);
    } else {
      message += `<i>No se registraron amenazas hoy.</i>\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n💻 <i>Sistema Catatumbo SIEM</i>`;

    sendTelegramNotification(token, chatId, message);
  } catch (err) {
    console.error('[AlertService] Error en resumen solicitado:', err);
  }
}

/**
 * Escucha mensajes entrantes desde Telegram (Polling)
 */
async function startTelegramBot() {
  // Intervalo de escucha (cada 5 segundos)
  setInterval(async () => {
    try {
      // 1. Intentar obtener el token y chat_id (esto valida la salud de la BD)
      const [rows] = await db.query("SELECT clave, valor FROM configuracion WHERE clave IN ('telegram_token', 'telegram_chat_id')");
      
      rows.forEach(row => {
        if (row.clave === 'telegram_token') cachedCredentials.token = row.valor;
        if (row.clave === 'telegram_chat_id') cachedCredentials.chatId = row.valor;
      });

      // 2. Si la BD estaba caída y ahora funciona, avisamos de la recuperación
      if (isDbDownNotificationSent && cachedCredentials.token && cachedCredentials.chatId) {
        sendTelegramNotification(
          cachedCredentials.token, 
          cachedCredentials.chatId, 
          "✅ <b>SISTEMA RECUPERADO</b>\nLa conexión con la base de datos se ha restablecido correctamente."
        );
        isDbDownNotificationSent = false;
      }

      if (!cachedCredentials.token) return;

    } catch (error) {
      console.error('[TelegramBot] Error de conexión con la BD:', error.message);
      
      // 3. Si detectamos caída y tenemos credenciales en caché para avisar
      const isConnError = ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ECONNRESET'].includes(error.code);
      if (isConnError && !isDbDownNotificationSent && cachedCredentials.token && cachedCredentials.chatId) {
        const alertMsg = 
          `🚨 <b>ALERTA DE INFRAESTRUCTURA</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `La base de datos MySQL no responde.\n\n` +
          `❌ <b>Error:</b> <code>${error.code || 'Desconectado'}</code>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `⚠️ <i>El monitoreo automático está suspendido hasta restablecer la conexión.</i>`;
        
        sendTelegramNotification(cachedCredentials.token, cachedCredentials.chatId, alertMsg);
        isDbDownNotificationSent = true;
      }
      return; // Salir del ciclo actual para reintentar en 5s
    }

    const token = cachedCredentials.token;
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/getUpdates?offset=${lastUpdateId + 1}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.ok && response.result.length > 0) {
            response.result.forEach(update => {
              lastUpdateId = update.update_id;
              const message = update.message;
              
              if (message && message.text) {
                const text = message.text.toLowerCase().trim();
                const chatId = message.chat.id;

                console.log(`[TelegramBot] Mensaje recibido: "${text}" de ChatID: ${chatId}`);

                // Lógica de Comandos
                if (text === 'resumen' || text === '/resumen') {
                  sendDailySummary(token, chatId);
                } else if (text === 'logins' || text === '/logins' || text === 'accesos') {
                  sendLoginSummary(token, chatId);
                } else if (text === 'hola' || text === '/start') {
                  sendTelegramNotification(token, chatId, "👋 Hola! Soy el bot de <b>Catatumbo SIEM</b>.\n\nEscribe <b>'resumen'</b> para ver estadísticas o <b>'logins'</b> para ver quién ha entrado hoy.");
                }
              }
            });
          }
        } catch (e) {
          // Error silencioso de parseo
        }
      });
    });

    req.on('error', () => {}); // Ignorar errores de red temporales
    req.end();
  }, 5000);
}

/**
 * Genera y envía un resumen de los usuarios que iniciaron sesión hoy.
 */
async function sendLoginSummary(token, chatId) {
  try {
    const [rows] = await db.query(`
      SELECT u.nombre, u.username, DATE_FORMAT(l.fecha_acceso, '%H:%i:%s') as hora
      FROM logs_accesos l
      JOIN usuarios u ON l.usuario_id = u.id
      WHERE DATE(l.fecha_acceso) = CURDATE() AND l.tipo = 'login'
      ORDER BY l.fecha_acceso DESC
    `);

    const dateStr = new Date().toLocaleDateString();
    let message = 
      `🔑 <b>REPORTE DE ACCESOS - ${dateStr}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (rows.length > 0) {
      message += `👤 <b>Usuarios que ingresaron hoy:</b>\n`;
      rows.forEach(r => {
        message += `• <code>${r.hora}</code> - <b>${r.username}</b> (${r.nombre})\n`;
      });
    } else {
      message += `<i>No se registraron ingresos de usuarios hoy.</i>\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n💻 <i>Sistema Catatumbo SIEM</i>`;

    sendTelegramNotification(token, chatId, message);
  } catch (err) {
    console.error('[AlertService] Error en resumen de logins:', err.message);
    const errorMessage = err.code === 'ECONNREFUSED' 
      ? "⚠️ <b>Error:</b> El servidor de base de datos está fuera de línea."
      : "⚠️ <b>Error:</b> No se pudo obtener el reporte de accesos.";
    sendTelegramNotification(token, chatId, errorMessage);
  }
}

/**
 * Notifica un evento de inicio o cierre de sesión a Telegram.
 */
async function notifyAuthEvent(type, user) {
  try {
    // 1. Persistir el evento en la base de datos para el reporte de 'logins'
    try {
      await db.query("INSERT INTO logs_accesos (usuario_id, tipo) VALUES (?, ?)", [user.id, type]);
    } catch (dbErr) {
      console.error('[AlertService] Error guardando log de acceso:', dbErr.message);
    }

    // 2. Obtener config para Telegram
    const [rows] = await db.query("SELECT clave, valor FROM configuracion WHERE clave IN ('telegram_token', 'telegram_chat_id')");
    let token = null;
    let chatId = null;
    rows.forEach(row => {
      if (row.clave === 'telegram_token') token = row.valor;
      if (row.clave === 'telegram_chat_id') chatId = row.valor;
    });

    if (!token || !chatId) return;

    const emoji = type === 'login' ? '🔑' : '🚪';
    const action = type === 'login' ? 'Inicio de Sesión' : 'Cierre de Sesión';
    const timestamp = new Date().toLocaleString();

    const message = 
      `🔐 <b>CATATUMBO SIEM - ACCESO</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${emoji} <b>${action}</b>\n\n` +
      `👤 <b>Usuario:</b> <code>${user.username || user.nombre}</code>\n` +
      `📧 <b>Correo:</b> <code>${user.correo || 'N/A'}</code>\n` +
      `📅 <b>Fecha/Hora:</b> <code>${timestamp}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`;

    sendTelegramNotification(token, chatId, message);
  } catch (error) {
    console.error('[AlertService] Error notificando evento de auth:', error);
  }
}

// Iniciar el bot inmediatamente al cargar el servicio
startTelegramBot();

/**
 * Evalúa si la cantidad de eventos críticos recientes supera un umbral
 * y, de ser así, genera una alerta en el sistema.
 *
 * @param {number} eventId El ID del evento que disparó la evaluación.
 * @returns {Promise<{alertGenerated: boolean, alertId?: number, criticalCount: number}>} Objeto indicando si se generó una alerta y su ID.
 */
async function evaluateEvent(eventId) {
  // Valores por defecto en memoria (fail-safe)
  let CRITICAL_THRESHOLD = 5;
  let TIME_WINDOW_MINUTES = 60;
  let TELEGRAM_TOKEN = null;
  let TELEGRAM_CHAT_ID = null;

  try {
    // 0. Intentar obtener configuración dinámica
    try {
      const [configRows] = await db.query("SELECT clave, valor FROM configuracion WHERE clave IN ('alerta_umbral', 'alerta_tiempo', 'telegram_token', 'telegram_chat_id')");
      configRows.forEach(row => {
        if (row.clave === 'alerta_umbral') CRITICAL_THRESHOLD = parseInt(row.valor);
        if (row.clave === 'alerta_tiempo') TIME_WINDOW_MINUTES = parseInt(row.valor);
        if (row.clave === 'telegram_token') TELEGRAM_TOKEN = row.valor;
        if (row.clave === 'telegram_chat_id') TELEGRAM_CHAT_ID = row.valor;
      });
    } catch (configErr) {
      console.warn(`[AlertService] Advertencia: No se pudo leer configuración (Usando defaults: Umbral=${CRITICAL_THRESHOLD}, Tiempo=${TIME_WINDOW_MINUTES}min). Detalle: ${configErr.message}`);
    }

    // 1. Consultar cuántos eventos críticos existen en los últimos 10 minutos.
    // severidad_id IN (1, 2) se asume que son las IDs para severidades 'Crítica' y 'Alta'
    const [rows] = await db.query(`
      SELECT COUNT(*) as count
      FROM eventos
      WHERE severidad_id IN (1, 2)
      AND fecha_evento >= NOW() - INTERVAL ? MINUTE
    `, [TIME_WINDOW_MINUTES]);

    const criticalCount = rows[0].count;

    console.log(`[AlertService] Evento ID ${eventId}: ${criticalCount} críticos en ${TIME_WINDOW_MINUTES} min (Umbral: ${CRITICAL_THRESHOLD}).`);

    // 2. Si el número de eventos críticos es mayor a 5, entonces insertar una alerta.
    if (criticalCount > CRITICAL_THRESHOLD) {
      console.warn(`[AlertService] ¡UMBRAL DE RIESGO SUPERADO! Se detectaron ${criticalCount} eventos críticos. Generando alerta.`);

      // Insertar la alerta en la tabla 'alertas'
      // estado_alerta_id = 1 (Pendiente)
      // usuario_resolutor_id y comentarios_resolucion se dejan NULL inicialmente
      const [result] = await db.query(
        'INSERT INTO alertas (evento_id, estado_alerta_id, usuario_resolutor_id, comentarios_resolucion, fecha_alerta, fecha_resolucion) VALUES (?, ?, ?, ?, NOW(), ?)',
        [eventId, 1, null, null, null]
      );
      console.log(`[AlertService] Alerta generada con ID: ${result.insertId}. Enviando a Telegram...`);

      // Enviar notificación a Telegram
      if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
        const timestamp = new Date().toLocaleString();
        const message = 
          `🛡️ <b>CATATUMBO SIEM - NOTIFICACIÓN</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🚨 <b>ALERTA: RIESGO CRÍTICO</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `⚠️ <b>Situación:</b>\n` +
          `Se ha superado el umbral de seguridad configurado.\n\n` +
          `📊 <b>Análisis de Incidentes:</b>\n` +
          `┣ <b>Eventos:</b> <code>${criticalCount} detectados</code>\n` +
          `┣ <b>Ventana:</b> <code>${TIME_WINDOW_MINUTES} minutos</code>\n` +
          `┣ <b>ID Alerta:</b> <code>#${result.insertId}</code>\n` +
          `┗ <b>Evento Ref:</b> <code>#${eventId}</code>\n\n` +
          `📅 <b>Fecha/Hora:</b> <code>${timestamp}</code>\n\n` +
          `🛠 <b>Acción Requerida:</b>\n` +
          `<i>Por favor, acceda al panel de control para realizar el triaje y mitigación de incidentes.</i>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `💻 <i>Sistema de Monitoreo de Tesis</i>`;
        sendTelegramNotification(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, message);
      }

      return { alertGenerated: true, alertId: result.insertId, criticalCount };
    } else {
      console.log(`[AlertService] El número de eventos críticos (${criticalCount}) no supera el umbral de ${CRITICAL_THRESHOLD}.`);
      return { alertGenerated: false, criticalCount };
    }
  } catch (err) {
    console.error(`[AlertService] Error al evaluar evento ${eventId}:`, err);
    throw new Error('Error al evaluar el evento para alertas automáticas.');
  }
}

// 5. Exportar la función al final
module.exports = { evaluateEvent, sendDailySummary, notifyAuthEvent, sendLoginSummary };