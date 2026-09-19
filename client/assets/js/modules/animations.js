/**
 * animations.js
 * Responsabilidad única: el movimiento decorativo de la página.
 * Usa GSAP y ScrollTrigger cuando están cargados por CDN, y tiene un camino
 * alternativo en JavaScript nativo cuando no lo están. Nunca decide qué
 * contenido se muestra: de eso se encarga scroll.js.
 */

const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

/** ¿GSAP y ScrollTrigger disponibles en esta página? */
function hayGsap() {
  return typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
}

export function initAnimations() {
  // Sin movimiento no registramos nada: dejamos el contenido estático.
  if (menosMovimiento.matches) {
    mostrarSinAnimacion();
    return;
  }

  if (hayGsap()) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  initTitularesPorLinea();
  initManifiesto();
  initParallax();
  initCarrilHorizontal();
  initContadores();
  initLienzoDelHeroe();
  initFiltrosDeProyectos();
}

/** Deja visible todo lo que normalmente entra animado. */
function mostrarSinAnimacion() {
  document.querySelectorAll('[data-lineas]').forEach((titular) => {
    titular.querySelectorAll('.linea-texto').forEach((linea) => linea.classList.add('es-visible'));
  });

  const manifiesto = document.querySelector('[data-manifiesto]');
  manifiesto?.querySelectorAll('.palabra').forEach((palabra) => palabra.classList.add('encendida'));

  document.querySelectorAll('[data-contador]').forEach((cifra) => {
    cifra.textContent = `${cifra.dataset.contador}${cifra.dataset.sufijo || ''}`;
  });

  initFiltrosDeProyectos();
}

/* --- Titulares que entran línea a línea --------------------------------- */
function initTitularesPorLinea() {
  const titulares = Array.from(document.querySelectorAll('[data-lineas]'));
  if (!titulares.length) return;

  titulares.forEach((titular) => {
    // Cada <br> del HTML marca una línea; cada línea entra desde abajo.
    const lineas = titular.innerHTML.split('<br>');
    titular.innerHTML = lineas
      .map(
        (linea, i) =>
          `<span class="linea-texto" style="--retardo:${i * 0.11}s"><span>${linea.trim()}</span></span>`
      )
      .join('');
  });

  if (!('IntersectionObserver' in window)) {
    titulares.forEach((titular) =>
      titular.querySelectorAll('.linea-texto').forEach((l) => l.classList.add('es-visible'))
    );
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target
          .querySelectorAll('.linea-texto')
          .forEach((linea) => linea.classList.add('es-visible'));
        observador.unobserve(entrada.target);
      });
    },
    { threshold: 0.3 }
  );

  titulares.forEach((titular) => observador.observe(titular));
}

/* --- Manifiesto: las palabras se encienden con el scroll ----------------- */
function initManifiesto() {
  const bloque = document.querySelector('[data-manifiesto]');
  if (!bloque) return;

  bloque.innerHTML = bloque.textContent
    .trim()
    .split(/\s+/)
    .map((palabra) => `<span class="palabra">${palabra}</span>`)
    .join(' ');

  const palabras = Array.from(bloque.querySelectorAll('.palabra'));
  if (!palabras.length) return;

  if (hayGsap()) {
    window.gsap.to(palabras, {
      color: 'var(--texto)',
      stagger: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: bloque,
        start: 'top 80%',
        end: 'bottom 55%',
        scrub: true
      }
    });
    return;
  }

  // Alternativa sin GSAP: se calcula el corte en cada cuadro de scroll.
  const pintar = () => {
    const caja = bloque.getBoundingClientRect();
    const inicio = window.innerHeight * 0.85;
    const fin = window.innerHeight * 0.25;
    const avance = (inicio - caja.top) / (inicio - fin + caja.height);
    const corte = Math.round(Math.min(Math.max(avance, 0), 1) * palabras.length);
    palabras.forEach((palabra, i) => palabra.classList.toggle('encendida', i < corte));
  };

  escucharScroll(pintar);
  pintar();
}

/* --- Parallax sutil: data-parallax="0.08" -------------------------------- */
function initParallax() {
  const capas = Array.from(document.querySelectorAll('[data-parallax]'));
  if (!capas.length) return;

  if (hayGsap()) {
    capas.forEach((capa) => {
      const fuerza = Number(capa.dataset.parallax) || 0.1;
      window.gsap.to(capa, {
        yPercent: fuerza * -100,
        ease: 'none',
        scrollTrigger: { trigger: capa, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    return;
  }

  const centro = () => window.innerHeight / 2;

  escucharScroll(() => {
    capas.forEach((capa) => {
      const caja = capa.getBoundingClientRect();
      // Fuera de pantalla no calculamos nada.
      if (caja.bottom < -200 || caja.top > window.innerHeight + 200) return;
      const fuerza = Number(capa.dataset.parallax) || 0.1;
      const delta = (caja.top + caja.height / 2 - centro()) * fuerza;
      capa.style.transform = `translate3d(0, ${delta.toFixed(2)}px, 0)`;
    });
  });
}

/* --- Carril horizontal de servicios -------------------------------------- */
function initCarrilHorizontal() {
  const carril = document.querySelector('[data-carril]');
  const pista = carril?.querySelector('[data-carril-pista]');
  if (!carril || !pista) return;

  // El arrastre con el puntero funciona siempre, con o sin GSAP.
  activarArrastre(pista);

  const anchoSuficiente = window.innerWidth >= 960;
  if (!hayGsap() || !anchoSuficiente) return;

  const { gsap } = window;
  carril.classList.add('esta-fijada');

  const recorrido = () => Math.max(pista.scrollWidth - window.innerWidth + 32, 0);

  gsap.to(pista, {
    x: () => -recorrido(),
    ease: 'none',
    scrollTrigger: {
      trigger: carril,
      start: 'top top',
      end: () => `+=${recorrido()}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1
    }
  });
}

/** Arrastre con mouse o dedo dentro del carril. */
function activarArrastre(pista) {
  let activo = false;
  let inicioX = 0;
  let inicioScroll = 0;

  pista.addEventListener('pointerdown', (evento) => {
    activo = true;
    inicioX = evento.clientX;
    inicioScroll = pista.scrollLeft;
    pista.classList.add('arrastrando');
  });

  pista.addEventListener('pointermove', (evento) => {
    if (!activo) return;
    pista.scrollLeft = inicioScroll - (evento.clientX - inicioX) * 1.25;
  });

  const soltar = () => {
    activo = false;
    pista.classList.remove('arrastrando');
  };

  ['pointerup', 'pointerleave', 'pointercancel'].forEach((tipo) =>
    pista.addEventListener(tipo, soltar)
  );
}

/* --- Contadores ---------------------------------------------------------- */
function initContadores() {
  const cifras = Array.from(document.querySelectorAll('[data-contador]'));
  if (!cifras.length) return;

  const animar = (elemento) => {
    const destino = Number(elemento.dataset.contador) || 0;
    const sufijo = elemento.dataset.sufijo || '';
    const duracion = 1400;
    const inicio = performance.now();

    const paso = (ahora) => {
      const t = Math.min((ahora - inicio) / duracion, 1);
      const suave = 1 - Math.pow(1 - t, 3);
      elemento.textContent = `${Math.round(destino * suave)}${sufijo}`;
      if (t < 1) requestAnimationFrame(paso);
    };

    requestAnimationFrame(paso);
  };

  if (!('IntersectionObserver' in window)) {
    cifras.forEach(animar);
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        animar(entrada.target);
        observador.unobserve(entrada.target);
      });
    },
    { threshold: 0.6 }
  );

  cifras.forEach((cifra) => observador.observe(cifra));
}

/* --- Lienzo del héroe: nodos conectados ---------------------------------- */
function initLienzoDelHeroe() {
  const lienzo = document.querySelector('[data-organismo]');
  if (!lienzo) return;

  const ctx = lienzo.getContext?.('2d');
  if (!ctx) return;

  const tintas = ['#7c5cff', '#2e8bff', '#3df5a0', '#ff6b5b'];
  const puntero = { x: -999, y: -999 };
  let nodos = [];
  let ancho = 0;
  let alto = 0;
  let animando = true;

  const dimensionar = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = lienzo.offsetWidth;
    alto = lienzo.offsetHeight;
    lienzo.width = ancho * dpr;
    lienzo.height = alto * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cantidad = Math.round(Math.min(Math.max((ancho * alto) / 16000, 28), 90));
    nodos = Array.from({ length: cantidad }, () => ({
      x: Math.random() * ancho,
      y: Math.random() * alto,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.7 + 0.8,
      tinta: tintas[Math.floor(Math.random() * tintas.length)]
    }));
  };

  const dibujar = () => {
    if (!animando) return;
    ctx.clearRect(0, 0, ancho, alto);

    nodos.forEach((nodo) => {
      nodo.x += nodo.vx;
      nodo.y += nodo.vy;
      if (nodo.x < 0 || nodo.x > ancho) nodo.vx *= -1;
      if (nodo.y < 0 || nodo.y > alto) nodo.vy *= -1;

      // El puntero aparta suavemente los nodos cercanos.
      const dx = nodo.x - puntero.x;
      const dy = nodo.y - puntero.y;
      const distancia = Math.hypot(dx, dy);
      if (distancia < 130 && distancia > 0) {
        nodo.x += (dx / distancia) * 0.7;
        nodo.y += (dy / distancia) * 0.7;
      }

      ctx.beginPath();
      ctx.arc(nodo.x, nodo.y, nodo.r, 0, Math.PI * 2);
      ctx.fillStyle = nodo.tinta;
      ctx.globalAlpha = 0.85;
      ctx.fill();
    });

    for (let i = 0; i < nodos.length; i += 1) {
      for (let j = i + 1; j < nodos.length; j += 1) {
        const d = Math.hypot(nodos[i].x - nodos[j].x, nodos[i].y - nodos[j].y);
        if (d > 128) continue;
        ctx.beginPath();
        ctx.globalAlpha = (1 - d / 128) * 0.26;
        ctx.strokeStyle = nodos[i].tinta;
        ctx.lineWidth = 0.7;
        ctx.moveTo(nodos[i].x, nodos[i].y);
        ctx.lineTo(nodos[j].x, nodos[j].y);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(dibujar);
  };

  window.addEventListener(
    'mousemove',
    (evento) => {
      const caja = lienzo.getBoundingClientRect();
      puntero.x = evento.clientX - caja.left;
      puntero.y = evento.clientY - caja.top;
    },
    { passive: true }
  );

  window.addEventListener('resize', dimensionar);

  // Se detiene cuando el héroe sale de pantalla.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting && !animando) {
          animando = true;
          requestAnimationFrame(dibujar);
        } else if (!entrada.isIntersecting) {
          animando = false;
        }
      });
    }).observe(lienzo);
  }

  dimensionar();
  requestAnimationFrame(dibujar);
}

/* --- Filtros del índice de proyectos -------------------------------------
   Aquí solo se resuelve la transición de entrada y salida de las tarjetas.
   Qué categoría tiene cada proyecto lo declara el HTML con data-categorias.
   -------------------------------------------------------------------------- */
function initFiltrosDeProyectos() {
  const grupo = document.querySelector('[data-filtros]');
  const indice = document.querySelector('[data-indice-proyectos]');
  if (!grupo || !indice) return;

  const botones = Array.from(grupo.querySelectorAll('.filtro'));
  const proyectos = Array.from(indice.querySelectorAll('[data-categorias]'));
  const vacio = document.querySelector('[data-vacio]');

  grupo.addEventListener('click', (evento) => {
    const boton = evento.target.closest('.filtro');
    if (!boton) return;

    const clave = boton.dataset.filtro;
    botones.forEach((otro) => otro.setAttribute('aria-pressed', String(otro === boton)));

    let visibles = 0;

    proyectos.forEach((proyecto) => {
      const categorias = (proyecto.dataset.categorias || '').split(' ');
      const coincide = clave === 'todo' || categorias.includes(clave);
      proyecto.hidden = !coincide;
      if (coincide) visibles += 1;
    });

    if (vacio) vacio.hidden = visibles > 0;
  });
}

/* --- Utilidad interna ----------------------------------------------------- */
/** Listener de scroll propio del módulo, limitado a un cuadro por evento. */
function escucharScroll(tarea) {
  let pendiente = false;

  window.addEventListener(
    'scroll',
    () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        tarea();
        pendiente = false;
      });
    },
    { passive: true }
  );
}
