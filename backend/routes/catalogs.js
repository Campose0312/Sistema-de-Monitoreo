/* c:\Users\pc\Documents\tesis\Sistema de Monitoreo\backend\routes\catalogs.js */
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/roles', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/severidades', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM severidades');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tipos-eventos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tipos_eventos');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dispositivos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM dispositivos');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
