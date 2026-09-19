/**
 * app.js
 * Construye la aplicación Express: seguridad, CORS, parseo del cuerpo,
 * rutas y manejo de errores. No escucha en ningún puerto: eso es
 * responsabilidad exclusiva de server.js.
 */

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const { NODE_ENV } = require('./config/env');
const opcionesCors = require('./config/cors');
const contactRoutes = require('./routes/contactRoutes');
const { noEncontrado, manejadorDeErrores } = require('./middleware/errorHandler');

const app = express();

// Detrás de un proxy (Render, Railway, Nginx) para que el rate limiter
// lea la IP real del cliente y no la del proxy.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(opcionesCors));

// Límite de tamaño generoso para un formulario, pequeño para frenar abuso.
app.use(express.json({ limit: '20kb' }));

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, servicio: 'japh-api', hora: new Date().toISOString() });
});

app.use('/api/contact', contactRoutes);

app.use(noEncontrado);
app.use(manejadorDeErrores);

module.exports = app;
