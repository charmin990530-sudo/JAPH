/**
 * sanitize.js
 * Utilidades puras de saneamiento de texto. No validan (eso es
 * responsabilidad de validateContact.js): solo limpian lo que llega antes
 * de que se compare contra ninguna regla.
 */

const ETIQUETAS_HTML = /<[^>]*>/g;
const CARACTERES_DE_CONTROL = /[\u0000-\u001F\u007F]/g;

/**
 * Convierte cualquier valor a texto seguro: sin etiquetas HTML, sin
 * caracteres de control y sin espacios sobrantes. Un objeto o un arreglo
 * enviados donde se espera texto se convierten en cadena vacía en lugar
 * de propagar el objeto: así un intento de inyección de operadores de
 * MongoDB (por ejemplo, { "$ne": null }) nunca llega a validarse como texto.
 *
 * @param {unknown} valor
 * @param {number} limite Longitud máxima a conservar.
 */
function textoSeguro(valor, limite = 2000) {
  if (typeof valor !== 'string' && typeof valor !== 'number') return '';

  return String(valor)
    .replace(ETIQUETAS_HTML, '')
    .replace(CARACTERES_DE_CONTROL, '')
    .trim()
    .slice(0, limite);
}

/** Igual que textoSeguro, pero conservando el formato de correo en minúsculas. */
function emailSeguro(valor, limite = 150) {
  return textoSeguro(valor, limite).toLowerCase();
}

/** Convierte cualquier valor a booleano estricto: solo true da como resultado true. */
function booleanoSeguro(valor) {
  return valor === true || valor === 'true' || valor === 'on';
}

module.exports = { textoSeguro, emailSeguro, booleanoSeguro };
