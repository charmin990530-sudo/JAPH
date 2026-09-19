/**
 * env.js
 * Lee y valida las variables de entorno una sola vez, al arrancar el
 * proceso. Si falta algo indispensable, el servidor no debe iniciar:
 * es preferible fallar rápido y con un mensaje claro en la consola.
 */

require('dotenv').config();

const OBLIGATORIAS = ['MONGODB_URI', 'CLIENT_URL'];

function leerEntorno() {
  const faltantes = OBLIGATORIAS.filter((clave) => !process.env[clave]);

  if (faltantes.length) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${faltantes.join(', ')}. ` +
        'Copia .env.example como .env y complétalas.'
    );
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 4000,
    MONGODB_URI: process.env.MONGODB_URI,
    // Uno o varios orígenes separados por comas, ej: "https://japh.studio,https://www.japh.studio"
    CLIENT_URL: process.env.CLIENT_URL,
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 5
  };
}

module.exports = leerEntorno();
