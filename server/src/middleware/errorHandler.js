/**
 * errorHandler.js
 * Manejo centralizado de errores: toda la aplicación traduce cualquier
 * fallo a una única forma de respuesta JSON. En producción nunca se
 * exponen detalles internos (mensajes de MongoDB, rutas de archivo,
 * stack traces): esos datos solo van a la consola del servidor.
 */

/** 404: ninguna ruta coincidió. */
function noEncontrado(req, res) {
  res.status(404).json({
    ok: false,
    mensaje: 'El recurso solicitado no existe.'
  });
}

/** Middleware de error de Express: debe declarar los cuatro argumentos. */
function manejadorDeErrores(error, req, res, _next) {
  const enProduccion = process.env.NODE_ENV === 'production';

  let estado = error.status || error.statusCode || 500;
  let mensaje = 'No pudimos procesar la solicitud. Inténtalo de nuevo más tarde.';
  let errores = [];

  // Validación de Mongoose (última línea de defensa del esquema).
  if (error.name === 'ValidationError') {
    estado = 400;
    mensaje = 'Revisa los campos marcados antes de enviar el formulario.';
    errores = Object.values(error.errors).map((detalle) => ({
      campo: detalle.path,
      mensaje: detalle.message
    }));
  }

  // Identificador de Mongo con formato inválido.
  if (error.name === 'CastError') {
    estado = 400;
    mensaje = 'La solicitud contiene un identificador no válido.';
  }

  // JSON mal formado en el cuerpo de la petición.
  if (error.type === 'entity.parse.failed') {
    estado = 400;
    mensaje = 'El cuerpo de la solicitud no es JSON válido.';
  }

  // Origen rechazado por CORS.
  if (error.message === 'Origen no permitido por la política de CORS.') {
    estado = 403;
    mensaje = 'Este origen no está autorizado para usar la API.';
  }

  // Los errores 5xx sí se registran en el servidor, con todo el detalle.
  if (estado >= 500) {
    console.error('[error]', error);
    if (enProduccion) {
      mensaje = 'No pudimos procesar la solicitud. Inténtalo de nuevo más tarde.';
    } else {
      mensaje = error.message || mensaje;
    }
  }

  res.status(estado).json({
    ok: false,
    mensaje,
    ...(errores.length ? { errores } : {})
  });
}

module.exports = { noEncontrado, manejadorDeErrores };
