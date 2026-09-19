/**
 * validateContact.js
 * Validación estricta del formulario de contacto. Se ejecuta después de
 * sanitizeContact.js: aquí ya no se limpia nada, solo se decide si los
 * datos limpios cumplen las reglas de negocio. Si algo falla, la petición
 * termina aquí con un 400 y el controlador nunca llega a ejecutarse, así
 * que nunca se guarda un formulario inválido o sin consentimiento.
 */

const { SERVICIOS } = require('../models/Contact');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const TELEFONO_RE = /^[+()\d\s-]{7,20}$/;

function validateContact(req, res, next) {
  const datos = req.datosContacto || {};
  const errores = [];

  // Campo trampa: si viene relleno, es casi seguro un bot. Se responde
  // con éxito para no delatar la protección, pero no se guarda nada.
  if (datos.web) {
    return res.status(200).json({
      ok: true,
      mensaje: 'Mensaje recibido. Te responderemos pronto.'
    });
  }

  if (datos.nombre.length < 2 || datos.nombre.length > 100) {
    errores.push({ campo: 'nombre', mensaje: 'El nombre debe tener entre 2 y 100 caracteres.' });
  }

  if (!EMAIL_RE.test(datos.email)) {
    errores.push({ campo: 'email', mensaje: 'El correo no tiene un formato válido.' });
  }

  if (datos.empresa.length > 100) {
    errores.push({ campo: 'empresa', mensaje: 'La empresa no puede superar 100 caracteres.' });
  }

  // El teléfono es opcional: solo se valida el formato si se envió algo.
  if (datos.telefono && !TELEFONO_RE.test(datos.telefono)) {
    errores.push({ campo: 'telefono', mensaje: 'El teléfono no tiene un formato válido.' });
  }

  if (!SERVICIOS.includes(datos.servicio)) {
    errores.push({ campo: 'servicio', mensaje: 'Selecciona un servicio válido.' });
  }

  if (datos.mensaje.length < 20 || datos.mensaje.length > 2000) {
    errores.push({ campo: 'mensaje', mensaje: 'El mensaje debe tener entre 20 y 2000 caracteres.' });
  }

  // Regla explícita del enunciado: sin consentimiento no hay guardado.
  if (datos.consentimiento !== true) {
    errores.push({
      campo: 'consentimiento',
      mensaje: 'Debes aceptar el tratamiento de tus datos personales para continuar.'
    });
  }

  if (errores.length) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Revisa los campos marcados antes de enviar el formulario.',
      errores
    });
  }

  next();
}

module.exports = validateContact;
