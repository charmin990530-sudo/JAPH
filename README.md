# JAPH — Agencia de ecosistemas digitales

Sitio y API de JAPH. El cliente es HTML, CSS y JavaScript sin framework ni build
step; el servidor es Express con MongoDB y Mongoose. Cada archivo tiene una
sola responsabilidad: ningún estilo vive dentro del HTML y ningún script se
escribe en línea.

Este README es el punto de partida para abrir el proyecto en VS Code y
levantar front y back en tu máquina. Cada carpeta tiene además su propio
README con el detalle completo (`server/README.md` documenta la API a fondo).

---

## Estructura real del proyecto

```
japh/
  client/                     Sitio estático, 7 páginas
    index.html                Portada
    servicios.html            Detalle de los 7 servicios
    nosotros.html              Equipo, historia, principios
    proyectos.html             Portafolio filtrable
    contacto.html              Formulario conectado a la API
    privacidad.html            Política de privacidad (plantilla editable)
    terminos.html              Términos y condiciones (plantilla editable)
    assets/
      css/
        global.css             Tokens, reset, nav, botones, pie — común a todo
        index.css               Solo la portada
        servicios.css           Carril horizontal y acordeón
        nosotros.css             Línea de tiempo y equipo
        proyectos.css            Filtros y fichas de proyecto
        contacto.css             Formulario, casilla de consentimiento
        legal.css                Privacidad y términos
      js/
        app.js                   Único punto de entrada: importa y arranca todo
        modules/
          menu.js                 Menú móvil accesible
          cursor.js                Cursor a medida (solo con mouse)
          scroll.js                Progreso, scroll suave, revelado de secciones
          animations.js            Movimiento decorativo (usa GSAP si está disponible)
          forms.js                 Validación del formulario y envío a la API
          api.js                   Única función que llama al backend
      images/
        favicon.svg
  server/                     API REST
    src/
      app.js                    Ensambla middleware y rutas
      server.js                 Arranca el proceso: conecta Mongo y abre el puerto
      config/
        env.js                   Lee y valida las variables de entorno
        db.js                    Conexión a MongoDB con Mongoose
        cors.js                  Restringe el acceso a CLIENT_URL
      models/
        Contact.js               Esquema del mensaje de contacto
      middleware/
        sanitizeContact.js        Limpia el cuerpo de la petición (lista blanca)
        validateContact.js        Valida los datos, exige consentimiento=true
        rateLimiter.js            Límite de solicitudes por IP
        errorHandler.js           404 y manejo centralizado de errores
      controllers/
        contactController.js      Guarda el contacto y responde
      routes/
        contactRoutes.js          Define POST /api/contact
      utils/
        sanitize.js               Funciones puras de saneamiento de texto
    package.json
    .env.example
    .gitignore
    README.md                  Documentación completa de la API
  .gitignore
  README.md                   Este archivo
```

---

## Requisitos

- Node.js 18 o superior
- Un editor (VS Code) con terminal integrada
- Una base de datos MongoDB: local o en [MongoDB Atlas](https://www.mongodb.com/atlas) (gratuita)

---

## Puesta en marcha en VS Code

Abre la carpeta `japh/` completa en VS Code (`code .` desde la terminal, o
*File → Open Folder*). Vas a necesitar **dos terminales integradas** abiertas
al mismo tiempo: una para el servidor y otra para el sitio.

### Terminal 1 — Backend

```bash
cd server
cp .env.example .env
```

Abre `server/.env` y completa al menos:

```
MONGODB_URI=mongodb://127.0.0.1:27017/japh
CLIENT_URL=http://localhost:5173
```

(Si vas a usar MongoDB Atlas en lugar de una base local, la sección "MongoDB
Atlas" de `server/README.md` explica paso a paso cómo obtener esa cadena de
conexión.)

Instala y arranca:

```bash
npm install
npm run dev
```

Deberías ver:

```
[db] Conectado a MongoDB
[api] JAPH escuchando en http://localhost:4000
[api] Entorno: development
```

Compruébalo desde el navegador o con curl:

```bash
curl http://localhost:4000/api/health
```

### Terminal 2 — Frontend

El sitio necesita servirse por HTTP: los módulos ES (`type="module"`) no
funcionan abriendo el `.html` directamente con doble clic. Desde la raíz del
proyecto:

```bash
cd client
npx serve . -l 5173
```

(Cualquier servidor estático sirve: la extensión **Live Server** de VS Code
también funciona, solo asegúrate de que quede en el puerto `5173`, que es el
que el backend tiene autorizado en `CLIENT_URL`. Si usas otro puerto, cambia
`CLIENT_URL` en `server/.env` y reinicia el backend.)

Abre `http://localhost:5173` en el navegador.

---

## Cómo quedan enlazados el front y el back

- `client/assets/js/modules/api.js` detecta si estás en `localhost` y en ese
  caso apunta a `http://localhost:4000`; en producción usa el mismo dominio
  donde esté publicado el sitio.
- El formulario de `contacto.html` envía exactamente los campos que el
  modelo `Contact` espera: `nombre`, `email`, `empresa` (opcional),
  `telefono` (opcional), `servicio` (uno solo, de una lista cerrada) y
  `mensaje`. La casilla **"He leído y acepto la Política de Privacidad"**
  no viene premarcada; si no se marca, `forms.js` bloquea el envío antes de
  llamar a la API, y aunque lograra llegar, `validateContact.js` lo
  rechazaría igual en el servidor.
- Los nombres de los servicios (`web`, `app-web`, `app-movil`,
  `automatizacion`, `marketing`, `video`, `branding`) están sincronizados
  entre el `<select>` de `contacto.html` y el `enum` de `Contact.js`: si
  agregas o cambias un servicio, actualiza ambos lados.
- El endpoint es `POST /api/contact` (singular). El servidor responde
  siempre en JSON, nunca con detalles internos.

---

## Verificación rápida de que todo quedó conectado

Con el backend corriendo, prueba un envío real desde la terminal:

```bash
curl -X POST http://localhost:4000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Camila Restrepo",
    "email": "camila@empresa.com",
    "servicio": "web",
    "mensaje": "Necesitamos rehacer el sitio y conectarlo con el CRM.",
    "consentimiento": true
  }'
```

Deberías recibir `201` con un `id` generado. Si mandas el mismo cuerpo sin
`"consentimiento": true`, la API responde `400` y no guarda nada.

---

## Decisiones técnicas

- **Sin framework en el cliente.** Siete páginas estáticas no justifican un
  build step; los módulos ES nativos ya dan la separación de
  responsabilidades sin empaquetador.
- **GSAP y ScrollTrigger por CDN**, solo donde el scroll es más elaborado
  (portada, servicios, proyectos). Todos los módulos comprueban si GSAP
  existe y tienen una alternativa en JavaScript nativo si no.
- **`prefers-reduced-motion` se respeta en todo el sitio**: sin parallax, sin
  cursor a medida, sin lienzo animado y con el contenido ya visible.
- **Validación en tres capas** en el backend: `forms.js` en el cliente para
  respuesta inmediata, `sanitizeContact.js` + `validateContact.js` porque el
  cliente nunca es de fiar, y el esquema de Mongoose como última defensa.
- **Sin consentimiento no hay guardado**, en ningún punto de la cadena: ni el
  cliente envía la petición, ni el servidor la aceptaría si llegara.
- **Límite de solicitudes por IP** solo en `/api/contact`, para frenar el
  envío automatizado sin afectar el resto de la API.
- **Las páginas legales son plantillas editables**, marcadas como tales con
  un aviso visible: no sustituyen la revisión de un abogado antes de
  publicar el sitio.

---

## Despliegue

1. Sube el repositorio a GitHub (`.env` queda fuera gracias a `.gitignore`
   en ambas carpetas).
2. Crea el clúster en MongoDB Atlas (ver `server/README.md`).
3. Despliega la carpeta `server/` en Render, Railway o Fly.io, con las
   variables de `server/.env.example` completadas para producción
   (`CLIENT_URL` con el dominio final del sitio, `NODE_ENV=production`).
4. Publica la carpeta `client/` en Netlify, Cloudflare Pages o el hosting
   estático que prefieras.

---

© JAPH. Código privado.
