/**
 * scroll.js
 * Responsabilidad única: la relación entre la página y la posición de scroll.
 * Barra de progreso, estado de la barra de navegación, scroll suave hacia
 * anclas y revelado de secciones al entrar en pantalla.
 * Las animaciones decorativas viven en animations.js.
 */

const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Cola de tareas: un único listener de scroll para toda la página. */
const tareas = [];
let hayCuadroPendiente = false;

export function initScroll() {
  initProgreso();
  initNavegacionFija();
  initScrollSuave();
  initRevelados();
  initIndiceDeLectura();
}

/* --- Barra de progreso de lectura --------------------------------------- */
function initProgreso() {
  const barra = document.querySelector('[data-progreso]');
  if (!barra) return;

  const pintar = () => {
    const recorrido = document.documentElement.scrollHeight - window.innerHeight;
    const avance = recorrido > 0 ? window.scrollY / recorrido : 0;
    barra.style.transform = `scaleX(${Math.min(Math.max(avance, 0), 1)})`;
  };

  enCadaCuadro(pintar);
  pintar();
}

/* --- La barra de navegación se condensa al bajar ------------------------ */
function initNavegacionFija() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  enCadaCuadro(() => {
    nav.classList.toggle('esta-fija', window.scrollY > 40);
  });
}

/* --- Scroll suave hacia anclas ------------------------------------------ */
function initScrollSuave() {
  document.addEventListener('click', (evento) => {
    const enlace = evento.target.closest('a[href^="#"]');
    if (!enlace) return;

    const id = enlace.getAttribute('href');
    if (!id || id === '#' || id.length < 2) return;

    let destino = null;
    try {
      destino = document.querySelector(id);
    } catch {
      // Un href como "#!" no es un selector válido: lo dejamos pasar al navegador.
      return;
    }
    if (!destino) return;

    evento.preventDefault();

    const alturaNav = document.querySelector('[data-nav]')?.offsetHeight || 0;
    const arriba = destino.getBoundingClientRect().top + window.scrollY - alturaNav - 24;

    window.scrollTo({
      top: Math.max(arriba, 0),
      behavior: menosMovimiento.matches ? 'auto' : 'smooth'
    });

    // El foco acompaña al salto para que el teclado no se quede arriba.
    destino.setAttribute('tabindex', '-1');
    destino.focus({ preventScroll: true });
  });
}

/* --- Revelado de secciones ---------------------------------------------- */
function initRevelados() {
  const piezas = Array.from(document.querySelectorAll('[data-revelar]'));
  if (!piezas.length) return;

  // Sin movimiento, o sin soporte del observador: todo visible desde el inicio.
  if (menosMovimiento.matches || !('IntersectionObserver' in window)) {
    piezas.forEach((pieza) => pieza.classList.add('es-visible'));
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('es-visible');
        observador.unobserve(entrada.target);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );

  piezas.forEach((pieza) => {
    // Escalonado entre hermanos del mismo contenedor.
    const hermanos = Array.from(
      pieza.parentElement?.querySelectorAll(':scope > [data-revelar]') || []
    );
    const posicion = Math.max(hermanos.indexOf(pieza), 0);
    pieza.style.setProperty('--retardo', `${posicion * 0.08}s`);
    observador.observe(pieza);
  });
}

/* --- Índice lateral de las páginas legales ------------------------------ */
function initIndiceDeLectura() {
  const indice = document.querySelector('[data-indice-legal]');
  if (!indice || !('IntersectionObserver' in window)) return;

  const enlaces = Array.from(indice.querySelectorAll('a'));
  const secciones = enlaces
    .map((enlace) => {
      try {
        return document.querySelector(enlace.getAttribute('href'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (!secciones.length) return;

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        enlaces.forEach((enlace) =>
          enlace.classList.toggle(
            'esta-activo',
            enlace.getAttribute('href') === `#${entrada.target.id}`
          )
        );
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  secciones.forEach((seccion) => observador.observe(seccion));
}

/* --- Utilidad interna ---------------------------------------------------- */
/** Agrupa tareas de scroll en un solo listener con requestAnimationFrame. */
function enCadaCuadro(tarea) {
  tareas.push(tarea);
  if (tareas.length > 1) return;

  window.addEventListener(
    'scroll',
    () => {
      if (hayCuadroPendiente) return;
      hayCuadroPendiente = true;

      requestAnimationFrame(() => {
        tareas.forEach((fn) => {
          try {
            fn();
          } catch (error) {
            console.error('[scroll] Tarea fallida:', error);
          }
        });
        hayCuadroPendiente = false;
      });
    },
    { passive: true }
  );
}
