/**
 * menu.js
 * Responsabilidad única: el menú de navegación móvil.
 * Abre y cierra el panel, lo hace operable con teclado, marca la página
 * actual y cierra al navegar. No anima nada más de la página.
 */

const SELECTOR_ENFOCABLE = 'a[href], button:not([disabled])';

export function initMenu() {
  const boton = document.querySelector('[data-menu-boton]');
  const panel = document.querySelector('[data-menu]');

  // Si la página no tiene menú, salimos en silencio.
  if (!boton || !panel) return;

  const enlaces = Array.from(panel.querySelectorAll('a'));
  let abierto = false;

  /** Escalona la entrada de los enlaces al abrir. */
  const escalonar = (estado) => {
    enlaces.forEach((enlace, i) => {
      enlace.style.transitionDelay = estado ? `${0.12 + i * 0.055}s` : '0s';
    });
  };

  const aplicar = (estado) => {
    abierto = estado;
    panel.dataset.abierto = String(estado);
    boton.setAttribute('aria-expanded', String(estado));
    boton.setAttribute('aria-label', estado ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('sin-scroll', estado);
    escalonar(estado);
  };

  const abrir = () => {
    aplicar(true);
    enlaces[0]?.focus({ preventScroll: true });
  };

  const cerrar = ({ devolverFoco = false } = {}) => {
    aplicar(false);
    if (devolverFoco) boton.focus();
  };

  boton.addEventListener('click', () => (abierto ? cerrar() : abrir()));

  // Cierre al navegar: cualquier enlace del panel cierra antes de cambiar de página.
  panel.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) cerrar();
  });

  // Teclado: Escape cierra; Tab queda atrapado dentro del panel mientras está abierto.
  document.addEventListener('keydown', (evento) => {
    if (!abierto) return;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      cerrar({ devolverFoco: true });
      return;
    }

    if (evento.key !== 'Tab') return;

    const enfocables = Array.from(panel.querySelectorAll(SELECTOR_ENFOCABLE));
    if (!enfocables.length) return;

    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];

    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  });

  // El panel es solo para pantallas pequeñas: al ensanchar la ventana se cierra.
  const escritorio = window.matchMedia('(min-width: 60rem)');
  escritorio.addEventListener('change', (evento) => {
    if (evento.matches && abierto) cerrar();
  });

  marcarPaginaActiva();
  aplicar(false);
}

/** Marca con aria-current el enlace de la página que se está viendo. */
function marcarPaginaActiva() {
  const archivo = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('[data-nav] a, [data-menu] a').forEach((enlace) => {
    if (enlace.getAttribute('href') === archivo) {
      enlace.setAttribute('aria-current', 'page');
    }
  });
}
