const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth'); // Importar middleware

// Obtener todos los usuarios (con nombre de rol)
// PROTEGIDO: Solo usuarios logueados pueden ver la lista
router.get('/', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.username, 
        u.correo, 
        u.estado,
        r.nombre as rol,
        u.rol_id
      FROM usuarios u 
      LEFT JOIN roles r ON u.rol_id = r.id
      ORDER BY u.id ASC
    `;
    const [rows] = await db.query(query);
    console.log(`[GET /users] Enviando ${rows.length} usuarios.`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Crear un usuario
// PROTEGIDO
router.post('/', verifyToken, async (req, res) => {
  const { nombre, apellido, username, correo, password, rol_id } = req.body;
  
  // VALIDACIÓN BACKEND
  if (!nombre || !apellido || !username || !correo || !password || !rol_id) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  // NOTA: Aquí deberías encriptar la contraseña con bcrypt antes de guardarla.
  // Por ahora la guardamos directa para que funcione con tu base de datos actual.
  const password_hash = password; 

  try {
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, apellido, username, correo, password_hash, rol_id) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido, username, correo, password_hash, rol_id]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear usuario. Es posible que el correo o usuario ya existan.' });
  }
});

// Actualizar usuario
// PROTEGIDO
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, username, correo, rol_id, estado, password } = req.body;
  
  try {
    let query = 'UPDATE usuarios SET nombre = ?, apellido = ?, username = ?, correo = ?, rol_id = ?, estado = ?';
    let params = [nombre, apellido, username, correo, rol_id, estado];

    // Si se envía una contraseña nueva, la actualizamos
    if (password) {
      query += ', password_hash = ?';
      params.push(password);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
    res.json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar usuario
// PROTEGIDO
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;