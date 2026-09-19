/**
 * forms.js
 * Responsabilidad única: el formulario de contacto.
 * Valida, anuncia los errores de forma accesible y delega el envío en api.js.
 * Las mismas reglas se repiten en el servidor: aquí solo buscamos respuesta
 * inmediata, no seguridad.
 */

import { enviarContacto, ErrorApi } from './api.js';

/** Reglas por campo. La clave es el atributo name del input. */
const REGLAS = {
  nombre: {
    valida: (valor) => valor.trim().length >= 2 && valor.trim().length <= 80,
    error: 'Escribe tu nombre: entre 2 y 80 caracteres.'
  },
  email: {
    valida: (valor) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(valor.trim()),
    error: 'Revisa el correo: debe tener el formato nombre@dominio.com.'
  },
  empresa: {
    valida: (valor) => valor.trim().length <= 80,
    error: 'El nombre de la empresa no puede superar 80 caracteres.'
  },
  telefono: {
    valida: (valor) => valor.trim() === '' || /^[+()\d\s-]{7,20}$/.test(valor.trim()),
    error: 'El teléfono solo admite números, espacios, paréntesis, + y guiones.'
  },
  servicio: {
    valida: (valor) => valor.trim() !== '',
    error: 'Selecciona el servicio que te interesa.'
  },
  mensaje: {
    valida: (valor) => valor.trim().length >= 20 && valor.trim().length <= 2000,
    error: 'Cuéntanos un poco más: al menos 20 caracteres.'
  },
  consentimiento: {
    // Un checkbox no se valida por el texto de su "value": lo que importa
    // es si quedó marcado. Por eso esta regla recibe el campo completo.
    valida: (_valor, campo) => campo.checked === true,
    error: 'Debes aceptar la Política de Privacidad para enviar el formulario.'
  }
};

export function initForms() {
  // El deslizador de presupuesto existe aunque no se envíe el formulario.
  initRangoPresupuesto();

  const formulario = document.querySelector('[data-formulario-contacto]');
  if (!formulario) return;

  const aviso = formulario.querySelector('[data-aviso]');
  const boton = formulario.querySelector('button[type="submit"]');
  const textoOriginal = boton?.textContent || 'Enviar mensaje';
  const campos = Array.from(formulario.querySelectorAll('input[name], textarea[name], select[name]'));

  // Cada campo se valida al salir y se limpia al corregir.
  // Los checkboxes (como el de consentimiento) no disparan un "blur" útil
  // en todos los navegadores al hacer clic, así que además escuchan "change".
  campos.forEach((campo) => {
    prepararDescripcion(campo);
    campo.addEventListener('blur', () => validarCampo(campo));
    campo.addEventListener('input', () => limpiarCampo(campo));
    if (campo.type === 'checkbox') {
      campo.addEventListener('change', () => validarCampo(campo));
    }
  });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    ocultarAviso(aviso);

    const invalidos = campos.filter((campo) => !validarCampo(campo));

    if (invalidos.length) {
      mostrarAviso(
        aviso,
        'error',
        `Hay ${invalidos.length} ${invalidos.length === 1 ? 'campo' : 'campos'} por corregir antes de enviar.`
      );
      invalidos[0].focus();
      return;
    }

    if (boton) {
      boton.disabled = true;
      boton.textContent = 'Enviando…';
    }

    try {
      const respuesta = await enviarContacto(recogerDatos(formulario));

      formulario.reset();
      campos.forEach((campo) => limpiarCampo(campo, { forzar: true }));
      initRangoPresupuesto();

      mostrarAviso(
        aviso,
        'exito',
        respuesta?.mensaje || 'Mensaje enviado. Te respondemos lo antes posible.'
      );
    } catch (error) {
      // Si el servidor señaló campos concretos, los marcamos uno a uno.
      if (error instanceof ErrorApi && error.errores.length) {
        error.errores.forEach((detalle) => {
          const campo = formulario.querySelector(`[name="${detalle.campo}"]`);
          if (campo) pintarEstado(campo, detalle.mensaje);
        });
      }

      mostrarAviso(aviso, 'error', error.message || 'No pudimos enviar el mensaje.');
    } finally {
      if (boton) {
        boton.disabled = false;
        boton.textContent = textoOriginal;
      }
    }
  });
}

/* --- Datos ---------------------------------------------------------------- */
function recogerDatos(formulario) {
  const datos = Object.fromEntries(new FormData(formulario).entries());

  return {
    nombre: (datos.nombre || '').trim(),
    email: (datos.email || '').trim().toLowerCase(),
    empresa: (datos.empresa || '').trim(),
    telefono: (datos.telefono || '').trim(),
    servicio: (datos.servicio || '').trim(),
    mensaje: (datos.mensaje || '').trim(),
    presupuesto: Number(datos.presupuesto) || 0,
    // Un checkbox sin marcar no aparece en FormData: por eso se lee aparte,
    // directamente de su propiedad "checked", en vez de confiar en "datos".
    consentimiento: formulario.querySelector('[name="consentimiento"]')?.checked === true,
    origen: document.referrer || 'directo',
    // Campo trampa: si un bot lo rellena, el servidor descarta el envío.
    web: datos.web || ''
  };
}

/* --- Validación y mensajes accesibles ------------------------------------- */
function validarCampo(campo) {
  const regla = REGLAS[campo.name];
  if (!regla) return true;

  const valido = regla.valida(campo.value, campo);
  pintarEstado(campo, valido ? '' : regla.error);
  return valido;
}

function limpiarCampo(campo, { forzar = false } = {}) {
  const envoltura = campo.closest('.campo');
  if (!envoltura) return;
  if (forzar || envoltura.dataset.error === 'true') pintarEstado(campo, '');
}

/** Conecta cada campo con su mensaje de error mediante aria-describedby. */
function prepararDescripcion(campo) {
  const salida = campo.closest('.campo')?.querySelector('.campo-error');
  if (!salida) return;

  if (!salida.id) salida.id = `error-${campo.name}`;
  salida.setAttribute('role', 'alert');
  campo.setAttribute('aria-describedby', salida.id);
}

function pintarEstado(campo, mensaje) {
  const envoltura = campo.closest('.campo');
  if (!envoltura) return;

  const salida = envoltura.querySelector('.campo-error');
  const hayError = Boolean(mensaje);

  envoltura.dataset.error = String(hayError);
  campo.setAttribute('aria-invalid', String(hayError));
  if (salida) salida.textContent = mensaje;
}

function mostrarAviso(aviso, estado, mensaje) {
  if (!aviso) return;
  aviso.dataset.estado = estado;
  aviso.textContent = mensaje;
  aviso.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function ocultarAviso(aviso) {
  if (!aviso) return;
  aviso.removeAttribute('data-estado');
  aviso.textContent = '';
}

/* --- Deslizador de presupuesto -------------------------------------------- */
function initRangoPresupuesto() {
  const rango = document.querySelector('[data-rango]');
  const salida = document.querySelector('[data-rango-salida]');
  if (!rango || !salida) return;

  const formato = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  const pintar = () => {
    const valor = Number(rango.value);
    salida.textContent =
      valor >= Number(rango.max) ? `${formato.format(valor)} o más` : formato.format(valor);
  };

  rango.addEventListener('input', pintar);
  pintar();
}
