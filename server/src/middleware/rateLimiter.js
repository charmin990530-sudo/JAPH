/**
 * rateLimiter.js
 * Límite de peticiones específico para el formulario de contacto, para
 * frenar el envío masivo o automatizado. Usa express-rate-limit, que ya
 * resuelve el conteo por IP y las cabeceras estándar de la especificación.
 */

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('../config/env');

const contactRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true, // Expone RateLimit-* en la respuesta.
  legacyHeaders: false,
  // Respuesta con la misma forma que el resto de la API: nunca un HTML por defecto.
  handler(req, res) {
    const segundos = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
    res.status(429).json({
      ok: false,
      mensaje: `Has enviado demasiadas solicitudes. Intenta de nuevo en ${segundos / 60} minutos.`
    });
  }
});

module.exports = { contactRateLimiter };
