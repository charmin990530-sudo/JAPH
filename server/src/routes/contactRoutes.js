/**
 * contactRoutes.js
 * Define el endpoint del formulario de contacto y el orden exacto en el
 * que se aplican sus middleware: primero se limita la frecuencia, luego
 * se sanea el cuerpo, después se valida y solo al final se guarda.
 */

const { Router } = require('express');
const { contactRateLimiter } = require('../middleware/rateLimiter');
const sanitizeContact = require('../middleware/sanitizeContact');
const validateContact = require('../middleware/validateContact');
const { crearContacto } = require('../controllers/contactController');

const router = Router();

router.post('/', contactRateLimiter, sanitizeContact, validateContact, crearContacto);

module.exports = router;
