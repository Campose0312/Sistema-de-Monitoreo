const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/alerts
router.get('/', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT id, tipo, mensaje, severidad, estado, fecha_creacion
      FROM alertas
      ORDER BY fecha_creacion DESC
      LIMIT 50
    `;
    const [rows] = await db.query(query);
    res.json({ alerts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
});

// PUT /api/alerts/:id/resolver
router.put('/:id/resolver', verifyToken, async (req, res) => {
  const alertId = parseInt(req.params.id, 10);

  if (isNaN(alertId)) {
    return res.status(400).json({ error: "ID de alerta inválido" });
  }

  try {
    const query = `
      UPDATE alertas
      SET estado = 'resuelta'
      WHERE id = ?
    `;
    const [result] = await db.query(query, [alertId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }

    res.json({ message: 'Alerta resuelta correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al resolver la alerta' });
  }
});

module.exports = router;