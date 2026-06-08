const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const simulator = require('../services/eventSimulator');

// GET /api/config - Obtener toda la configuración
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT clave, valor FROM configuracion');
    const config = {};
    rows.forEach(row => {
      config[row.clave] = row.valor;
    });
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// PUT /api/config - Actualizar configuración
router.put('/', verifyToken, async (req, res) => {
  const { simulador_intervalo, alerta_umbral, alerta_tiempo } = req.body;

  try {
    // Actualizamos valores en BD
    const queries = [];
    if (simulador_intervalo) queries.push(db.query('UPDATE configuracion SET valor = ? WHERE clave = ?', [simulador_intervalo, 'simulador_intervalo']));
    if (alerta_umbral) queries.push(db.query('UPDATE configuracion SET valor = ? WHERE clave = ?', [alerta_umbral, 'alerta_umbral']));
    if (alerta_tiempo) queries.push(db.query('UPDATE configuracion SET valor = ? WHERE clave = ?', [alerta_tiempo, 'alerta_tiempo']));

    await Promise.all(queries);

    // Aplicar cambios en tiempo real al simulador
    if (simulador_intervalo) {
      simulator.updateInterval(parseInt(simulador_intervalo));
    }

    res.json({ message: 'Configuración actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

module.exports = router;