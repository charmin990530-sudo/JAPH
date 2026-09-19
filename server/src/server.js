/**
 * server.js
 * Punto de arranque del proceso: conecta la base de datos, abre el
 * puerto HTTP y se asegura de apagar todo de forma ordenada.
 */

const { PORT, NODE_ENV } = require('./config/env');
const app = require('./app');
const { conectarBaseDeDatos, cerrarBaseDeDatos } = require('./config/db');

let servidor;

async function iniciar() {
  try {
    await conectarBaseDeDatos();

    servidor = app.listen(PORT, () => {
      console.log(`[api] JAPH escuchando en http://localhost:${PORT}`);
      console.log(`[api] Entorno: ${NODE_ENV}`);
    });
  } catch (error) {
    console.error('[api] No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

async function apagar(senal) {
  console.log(`\n[api] ${senal} recibido. Cerrando…`);

  if (!servidor) {
    await cerrarBaseDeDatos();
    process.exit(0);
    return;
  }

  servidor.close(async () => {
    await cerrarBaseDeDatos();
    process.exit(0);
  });

  // Si algo se queda colgado, forzamos la salida en vez de bloquear el proceso.
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));
process.on('unhandledRejection', (razon) => {
  console.error('[api] Promesa sin capturar:', razon);
  apagar('unhandledRejection');
});

iniciar();
