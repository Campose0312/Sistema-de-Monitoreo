const express = require('express');
const router = express.Router();
const simulator = require('../services/eventSimulator');
const { verifyToken } = require('../middleware/auth');

// GET /api/simulator/status - Obtener estado actual
router.get('/status', verifyToken, (req, res) => {
  try {
    const isRunning = simulator.status();
    res.json({ running: isRunning });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estado del simulador' });
  }
});

// POST /api/simulator/start - Iniciar simulación
router.post('/start', verifyToken, (req, res) => {
  try {
    simulator.start();
    res.json({ message: 'Simulador iniciado', running: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar el simulador' });
  }
});

// POST /api/simulator/stop - Detener simulación
router.post('/stop', verifyToken, (req, res) => {
  try {
    simulator.stop();
    res.json({ message: 'Simulador detenido', running: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al detener el simulador' });
  }
});

module.exports = router;