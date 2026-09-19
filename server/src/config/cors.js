/**
 * cors.js
 * Construye las opciones de CORS a partir de CLIENT_URL. Acepta uno o
 * varios orígenes separados por comas para cubrir, por ejemplo, el
 * dominio con y sin "www", o un entorno de previsualización.
 */

const { CLIENT_URL } = require('./env');

const origenesPermitidos = CLIENT_URL.split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);

const opcionesCors = {
  origin(origen, callback) {
    // Sin cabecera Origin (curl, apps móviles, Postman): se permite.
    if (!origen || origenesPermitidos.includes(origen)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por la política de CORS.'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400 // Cachea el preflight un día.
};

module.exports = opcionesCors;
