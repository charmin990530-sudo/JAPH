/**
 * db.js
 * Única responsabilidad: abrir y vigilar la conexión con MongoDB a través
 * de Mongoose. No conoce nada de Express ni de las rutas.
 */

const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

mongoose.set('strictQuery', true);

async function conectarBaseDeDatos() {
  mongoose.connection.on('connected', () => {
    console.log('[db] Conectado a MongoDB');
  });

  mongoose.connection.on('error', (error) => {
    console.error('[db] Error de conexión:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] Conexión perdida. Mongoose reintentará automáticamente.');
  });

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10
  });

  return mongoose.connection;
}

async function cerrarBaseDeDatos() {
  await mongoose.connection.close();
  console.log('[db] Conexión cerrada');
}

module.exports = { conectarBaseDeDatos, cerrarBaseDeDatos };
