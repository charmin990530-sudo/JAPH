/**
 * api.js
 * Responsabilidad única: hablar con el servidor.
 * Ningún otro módulo debería llamar a fetch directamente.
 */

/** Base del API: en local apunta al puerto del servidor; en producción, al mismo dominio. */
const BASE = (() => {
  const { hostname, origin } = window.location;
  const esLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  return esLocal ? 'http://localhost:4000' : origin;
})();

const TIEMPO_LIMITE = 12000;

/** Error con la forma que espera la interfaz: mensaje legible + errores por campo. */
export class ErrorApi extends Error {
  constructor(mensaje, { estado = 0, errores = [] } = {}) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.errores = errores;
  }
}

/**
 * Petición JSON con tiempo límite y errores normalizados.
 * @param {string} ruta  Ruta absoluta del API, por ejemplo '/api/contact'.
 * @param {RequestInit} opciones
 */
async function peticion(ruta, opciones = {}) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE);

  try {
    const respuesta = await fetch(`${BASE}${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: control.signal,
      ...opciones
    });

    const tipo = respuesta.headers.get('content-type') || '';
    const cuerpo = tipo.includes('application/json') ? await respuesta.json() : null;

    if (!respuesta.ok) {
      throw new ErrorApi(cuerpo?.mensaje || 'No pudimos completar la operación.', {
        estado: respuesta.status,
        errores: Array.isArray(cuerpo?.errores) ? cuerpo.errores : []
      });
    }

    return cuerpo;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ErrorApi('La conexión tardó demasiado. Inténtalo de nuevo.', { estado: 408 });
    }
    if (error instanceof ErrorApi) throw error;
    throw new ErrorApi('No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.', {
      estado: 0
    });
  } finally {
    clearTimeout(reloj);
  }
}

/**
 * Envía el formulario de contacto.
 * @param {object} datos Datos ya limpios del formulario.
 * @returns {Promise<{ok: boolean, mensaje: string}>}
 */
export function enviarContacto(datos) {
  return peticion('/api/contact', {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

/** Comprobación de estado del API, útil para diagnóstico. */
export function consultarEstado() {
  return peticion('/api/salud');
}
