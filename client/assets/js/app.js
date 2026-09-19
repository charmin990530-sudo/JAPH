/**
 * app.js
 * Único punto de entrada del cliente: importa los módulos y los arranca.
 * No contiene lógica de interfaz; si algo falla, lo registra y sigue con
 * el resto para que un módulo roto no tumbe la página entera.
 */

import { initMenu } from './modules/menu.js';
import { initCursor } from './modules/cursor.js';
import { initScroll } from './modules/scroll.js';
import { initAnimations } from './modules/animations.js';
import { initForms } from './modules/forms.js';

const MODULOS = [
  ['menu', initMenu],
  ['cursor', initCursor],
  ['scroll', initScroll],
  ['animations', initAnimations],
  ['forms', initForms]
];

function iniciar() {
  document.documentElement.classList.add('js-listo');

  MODULOS.forEach(([nombre, iniciarModulo]) => {
    try {
      iniciarModulo();
    } catch (error) {
      console.error(`[JAPH] El módulo "${nombre}" no pudo iniciarse:`, error);
    }
  });

  // GSAP llega por CDN y puede cargar después del DOM: recalculamos posiciones.
  window.addEventListener('load', () => {
    try {
      window.ScrollTrigger?.refresh();
    } catch (error) {
      console.error('[JAPH] No se pudo refrescar ScrollTrigger:', error);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
