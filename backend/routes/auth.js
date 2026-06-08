const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/auth'); // Importar si creaste el archivo, o definir aquí
const { verifyToken } = require('../middleware/auth');
const { notifyAuthEvent } = require('../services/alertService');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('--- INTENTO DE LOGIN ---');
  console.log('Datos recibidos:', { username, password });

  try {
    // Buscar usuario por username o correo
    // Usamos LEFT JOIN para encontrar al usuario incluso si el rol_id no coincide o la tabla roles tiene IDs diferentes
    const [users] = await db.query(
      'SELECT u.*, r.nombre as rol_nombre FROM usuarios u LEFT JOIN roles r ON u.rol_id = r.id WHERE u.username = ? OR u.correo = ?',
      [username, username]
    );

    console.log('Usuarios encontrados en BD:', users.length);

    if (users.length === 0) {
      return res.status(401).json({ ok: false, message: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Verificar contraseña
    // NOTA: En producción usa bcrypt.compare(password, user.password_hash)
    // Aquí comparamos texto plano temporalmente según tu configuración actual
    if (password !== user.password_hash) {
      return res.status(401).json({ ok: false, message: 'Contraseña incorrecta' });
    }

    if (!user.estado) {
      return res.status(401).json({ ok: false, message: 'Usuario inactivo' });
    }

    // Generar Token JWT Real
    // Expira en 8 horas
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.rol_nombre },
      SECRET_KEY || 'secreto_super_seguro_tesis_catatumbo', 
      { expiresIn: '8h' }
    );

    // Notificar a Telegram
    await notifyAuthEvent('login', user);

    // Retornar éxito y datos del usuario (sin la contraseña)
    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.correo,
        role: user.rol_nombre
      },
      token: token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
});

/**
 * Ruta de cierre de sesión
 * Notifica a Telegram antes de que el frontend limpie el token
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // El middleware verifyToken nos da el ID en req.user
    const [users] = await db.query('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    
    if (users.length > 0) {
      await notifyAuthEvent('logout', users[0]);
    }

    res.json({ ok: true, message: 'Sesión cerrada' });
  } catch (err) {
    console.error('[AUTH] Error en logout:', err);
    res.status(500).json({ ok: false });
  }
});

router.post('/reset-password', async (req, res) => {
  const { username, email, firstName, lastName, newPassword } = req.body;

  try {
    // Verificar que el usuario existe con todos los datos proporcionados
    const [users] = await db.query(
      'SELECT id FROM usuarios WHERE username = ? AND correo = ? AND nombre = ? AND apellido = ?',
      [username, email, firstName, lastName]
    );

    if (users.length === 0) {
      return res.status(404).json({ ok: false, message: 'Los datos proporcionados no coinciden con ningún usuario registrado.' });
    }

    const userId = users[0].id;

    // Actualizar la contraseña
    await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [newPassword, userId]);

    res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error en el servidor al restablecer contraseña.' });
  }
});

module.exports = router;