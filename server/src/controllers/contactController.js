/**
 * contactController.js
 * Qué hacer con un mensaje de contacto ya saneado y validado. No valida
 * (eso ya ocurrió en el middleware) ni define rutas: solo guarda y
 * responde.
 */

const Contact = require('../models/Contact');

/**
 * POST /api/contact
 * Crea un nuevo mensaje de contacto. Solo se llega aquí si sanitizeContact
 * y validateContact ya aprobaron los datos, incluido el consentimiento.
 */
async function crearContacto(req, res, next) {
  try {
    const datos = req.datosContacto;

    const contacto = await Contact.create({
      nombre: datos.nombre,
      email: datos.email,
      empresa: datos.empresa,
      telefono: datos.telefono,
      servicio: datos.servicio,
      mensaje: datos.mensaje,
      consentimiento: datos.consentimiento,
      ip: req.ip,
      origen: req.get('origin') || ''
    });

    // Aquí es donde se conectaría un aviso por correo o Slack al equipo.
    console.log(`[contacto] Nuevo mensaje de ${contacto.email} (${contacto.servicio})`);

    res.status(201).json({
      ok: true,
      mensaje: 'Mensaje recibido. Te responderemos lo antes posible.',
      datos: contacto.aSalida()
    });
  } catch (error) {
    // Cualquier fallo (de validación del esquema o de conexión) se delega
    // al manejador centralizado: aquí no se decide el formato de la respuesta.
    next(error);
  }
}

module.exports = { crearContacto };
