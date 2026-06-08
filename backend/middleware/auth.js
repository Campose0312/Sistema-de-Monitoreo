/* c:\Users\pc\Documents\tesis\Sistema de Monitoreo\backend\middleware\auth.js */
const jwt = require('jsonwebtoken');

// Clave secreta para firmar los tokens (en producción usar variables de entorno .env)
const SECRET_KEY = 'secreto_super_seguro_tesis_catatumbo';

const verifyToken = (req, res, next) => {
  // Esperamos el header "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Obtener solo el token (quitando "Bearer")

  if (!token) {
    return res.status(403).json({ error: 'Acceso denegado. Token requerido.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Guardamos los datos del usuario en la petición para usarlos luego
    next(); // Continuar a la ruta protegida
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = { verifyToken, SECRET_KEY };
