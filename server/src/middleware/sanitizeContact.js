/**
 * sanitizeContact.js
 * Middleware que limpia el cuerpo de la petición ANTES de validarlo.
 * Solo toma los campos que el formulario de contacto puede enviar
 * (lista blanca): cualquier otro campo del cuerpo se descarta aquí, lo
 * que evita que datos inesperados lleguen al controlador o al modelo.
 */

const { textoSeguro, emailSeguro, booleanoSeguro } = require('../utils/sanitize');

function sanitizeContact(req, res, next) {
  const cuerpo = req.body && typeof req.body === 'object' ? req.body : {};

  req.datosContacto = {
    nombre: textoSeguro(cuerpo.nombre, 100),
    email: emailSeguro(cuerpo.email, 150),
    empresa: textoSeguro(cuerpo.empresa, 100),
    telefono: textoSeguro(cuerpo.telefono, 20),
    servicio: textoSeguro(cuerpo.servicio, 40),
    mensaje: textoSeguro(cuerpo.mensaje, 2000),
    consentimiento: booleanoSeguro(cuerpo.consentimiento),
    // Campo trampa opcional para bots: si un formulario lo incluye oculto
    // y llega relleno, validateContact lo usa para descartar el envío.
    web: textoSeguro(cuerpo.web, 100)
  };

  next();
}

module.exports = sanitizeContact;
