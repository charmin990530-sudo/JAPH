/**
 * cursor.js
 * Responsabilidad única: el cursor personalizado.
 * Solo se activa en dispositivos con puntero fino (mouse o trackpad) y
 * cuando la persona no ha pedido menos movimiento. En táctil no hace nada.
 */

const SENSIBLE = 'a, button, input, textarea, select, [data-cursor-crece]';

export function initCursor() {
  const tieneMouse = window.matchMedia('(pointer: fine)').matches;
  const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!tieneMouse || menosMovimiento) return;

  const punto = document.querySelector('[data-cursor]');
  const halo = document.querySelector('[data-cursor-halo]');
  if (!punto || !halo) return;

  document.body.classList.add('cursor-activo');

  const raton = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const halito = { ...raton };
  let cuadro = null;

  const seguir = (evento) => {
    raton.x = evento.clientX;
    raton.y = evento.clientY;
    // El punto va pegado al puntero real; el halo lo persigue con inercia.
    punto.style.transform = `translate3d(${raton.x}px, ${raton.y}px, 0)`;
  };

  const bucle = () => {
    halito.x += (raton.x - halito.x) * 0.16;
    halito.y += (raton.y - halito.y) * 0.16;
    halo.style.transform = `translate3d(${halito.x}px, ${halito.y}px, 0)`;
    cuadro = requestAnimationFrame(bucle);
  };

  window.addEventListener('mousemove', seguir, { passive: true });
  cuadro = requestAnimationFrame(bucle);

  // El halo crece sobre cualquier elemento accionable.
  document.addEventListener('mouseover', (evento) => {
    if (evento.target.closest(SENSIBLE)) halo.classList.add('es-enlace');
  });

  document.addEventListener('mouseout', (evento) => {
    if (evento.target.closest(SENSIBLE)) halo.classList.remove('es-enlace');
  });

  // Al salir de la ventana ocultamos el cursor propio y devolvemos el del sistema.
  document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-activo'));
  document.addEventListener('mouseenter', () => document.body.classList.add('cursor-activo'));

  // Si la pestaña deja de verse, paramos el bucle para no gastar batería.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(cuadro);
    } else {
      cuadro = requestAnimationFrame(bucle);
    }
  });

  initMagnetismo();
  initBrilloDeFichas();
}

/** Botones marcados con data-magnetico se acercan levemente al puntero. */
function initMagnetismo() {
  document.querySelectorAll('[data-magnetico]').forEach((elemento) => {
    const fuerza = Number(elemento.dataset.magnetico) || 0.28;

    elemento.addEventListener('mousemove', (evento) => {
      const caja = elemento.getBoundingClientRect();
      const dx = evento.clientX - (caja.left + caja.width / 2);
      const dy = evento.clientY - (caja.top + caja.height / 2);
      elemento.style.transform = `translate(${dx * fuerza}px, ${dy * fuerza}px)`;
    });

    elemento.addEventListener('mouseleave', () => {
      elemento.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
      elemento.style.transform = '';
      window.setTimeout(() => {
        elemento.style.transition = '';
      }, 500);
    });
  });
}

/** Halo de color que sigue al puntero dentro de las fichas y tarjetas. */
function initBrilloDeFichas() {
  document.querySelectorAll('.ficha, .tarjeta-servicio').forEach((ficha) => {
    ficha.addEventListener('mousemove', (evento) => {
      const caja = ficha.getBoundingClientRect();
      ficha.style.setProperty('--mx', `${evento.clientX - caja.left}px`);
      ficha.style.setProperty('--my', `${evento.clientY - caja.top}px`);
    });
  });
}
