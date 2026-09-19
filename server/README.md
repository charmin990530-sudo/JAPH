# JAPH — API de contacto

API mínima en Express y MongoDB que recibe el formulario de contacto del
sitio de JAPH. Un solo endpoint, con validación estricta, saneamiento de
entradas, límite de solicitudes y manejo centralizado de errores.

---

## Estructura

```
server/
  src/
    config/
      env.js          Lee y valida las variables de entorno
      db.js            Conexión a MongoDB con Mongoose
      cors.js          Opciones de CORS a partir de CLIENT_URL
    models/
      Contact.js       Esquema del mensaje de contacto
    middleware/
      sanitizeContact.js  Limpia el cuerpo de la petición (lista blanca)
      validateContact.js  Valida los datos ya limpios, incluido el consentimiento
      rateLimiter.js      Límite de solicitudes por IP para /api/contact
      errorHandler.js     404 y manejo centralizado de errores
    controllers/
      contactController.js  Guarda el contacto y responde
    routes/
      contactRoutes.js      Define POST /api/contact
    utils/
      sanitize.js      Funciones puras de saneamiento de texto
    app.js             Ensambla middleware y rutas
    server.js          Arranca el proceso: conecta la base y abre el puerto
  package.json
  .env.example
  .gitignore
```

Cada carpeta tiene una sola responsabilidad: `config` solo lee configuración,
`models` solo define la forma de los datos, `middleware` solo intercepta la
petición, `controllers` solo decide qué hacer con datos ya validados y
`routes` solo declara qué middleware corre en qué orden.

---

## Requisitos

- Node.js 18 o superior
- Una base de datos MongoDB: local o en MongoDB Atlas (gratuita)

---

## 1. Instalación local

```bash
cd server
cp .env.example .env
npm install
```

Abre `.env` y completa al menos `MONGODB_URI` y `CLIENT_URL` (ver la
sección de variables más abajo).

### Arrancar en desarrollo

```bash
npm run dev
```

Usa `node --watch`: reinicia solo al guardar un archivo, sin dependencias
adicionales.

### Arrancar en producción

```bash
npm start
```

### Comprobar que responde

```bash
curl http://localhost:4000/api/health
```

```json
{ "ok": true, "servicio": "japh-api", "hora": "2026-09-16T12:00:00.000Z" }
```

---

## 2. MongoDB local (opcional)

Si prefieres no usar Atlas todavía, instala MongoDB Community Server y
déjalo escuchando en el puerto por defecto. La variable queda así:

```
MONGODB_URI=mongodb://127.0.0.1:27017/japh
```

Mongoose crea la base de datos y la colección automáticamente en el
primer guardado: no hace falta crearlas a mano.

---

## 3. MongoDB Atlas (recomendado para producción)

1. Crea una cuenta gratuita en [mongodb.com/atlas](https://www.mongodb.com/atlas)
   y un nuevo proyecto.
2. Crea un clúster gratuito (nivel **M0**).
3. En **Database Access**, crea un usuario de base de datos con contraseña
   y anótala en un gestor de contraseñas, no en el código.
4. En **Network Access**, autoriza las IP que van a conectarse:
   - Para probar en tu máquina, tu IP actual.
   - Para un servidor en la nube (Render, Railway, Fly.io), la IP saliente
     de ese proveedor, o `0.0.0.0/0` únicamente si aceptas el riesgo de
     abrir el acceso a cualquier IP con las credenciales correctas.
5. En **Database → Connect → Drivers**, copia la cadena de conexión. Tiene
   esta forma:
   ```
   mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
6. Pégala en `.env` como `MONGODB_URI`, reemplaza `<usuario>` y
   `<contraseña>` por los reales, y añade el nombre de la base después del
   host: `.../japh?retryWrites=true&w=majority`.
7. Si la contraseña tiene caracteres especiales (`@`, `:`, `/`), coéificalos
   con `encodeURIComponent` o el propio asistente de conexión de Atlas los
   sustituye por ti.

Nunca subas la cadena de conexión completa a un repositorio público: contiene
la contraseña de la base de datos.

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `NODE_ENV` | no | `development` o `production`. Cambia el nivel de detalle de los logs y de los mensajes de error. |
| `PORT` | no (por defecto `4000`) | Puerto en el que escucha el servidor. |
| `MONGODB_URI` | **sí** | Cadena de conexión de MongoDB, local o de Atlas. |
| `CLIENT_URL` | **sí** | Origen exacto del sitio que puede llamar a la API. Admite varios separados por comas. |
| `RATE_LIMIT_WINDOW_MS` | no (por defecto `900000`, 15 min) | Duración de la ventana del límite de solicitudes. |
| `RATE_LIMIT_MAX_REQUESTS` | no (por defecto `5`) | Solicitudes permitidas por IP en esa ventana, solo para `/api/contact`. |

El servidor se niega a arrancar si falta `MONGODB_URI` o `CLIENT_URL`: lo
señala con un mensaje claro en la consola en lugar de fallar más adelante
de forma confusa.

---

## Endpoint

### `POST /api/contact`

Crea un nuevo mensaje de contacto.

**Cuerpo esperado** (`Content-Type: application/json`):

```json
{
  "nombre": "Camila Restrepo",
  "email": "camila@empresa.com",
  "empresa": "Empresa S.A.S.",
  "telefono": "+57 300 000 0000",
  "servicio": "web",
  "mensaje": "Necesitamos rediseñar el sitio y conectar el formulario al CRM.",
  "consentimiento": true
}
```

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `nombre` | texto | sí | 2 a 100 caracteres |
| `email` | texto | sí | formato de correo válido |
| `empresa` | texto | no | hasta 100 caracteres |
| `telefono` | texto | no | si se envía, debe tener un formato válido |
| `servicio` | texto | sí | uno de: `web`, `app-web`, `app-movil`, `automatizacion`, `marketing`, `video`, `branding` |
| `mensaje` | texto | sí | 20 a 2000 caracteres |
| `consentimiento` | booleano | sí | debe ser exactamente `true`; si falta o es `false`, no se guarda nada |

**Respuesta con éxito** — `201 Created`:

```json
{
  "ok": true,
  "mensaje": "Mensaje recibido. Te responderemos lo antes posible.",
  "datos": {
    "id": "665f1b2e8a1c2d0012a3b456",
    "nombre": "Camila Restrepo",
    "email": "camila@empresa.com",
    "servicio": "web",
    "fecha": "2026-09-16T12:00:00.000Z"
  }
}
```

**Respuesta con errores de validación** — `400 Bad Request`:

```json
{
  "ok": false,
  "mensaje": "Revisa los campos marcados antes de enviar el formulario.",
  "errores": [
    { "campo": "email", "mensaje": "El correo no tiene un formato válido." },
    { "campo": "consentimiento", "mensaje": "Debes aceptar el tratamiento de tus datos personales para continuar." }
  ]
}
```

**Límite de solicitudes alcanzado** — `429 Too Many Requests`:

```json
{ "ok": false, "mensaje": "Has enviado demasiadas solicitudes. Intenta de nuevo en 15 minutos." }
```

Ninguna respuesta de error incluye detalles internos (mensajes crudos de
MongoDB, rutas de archivo o trazas de pila): eso solo se registra en la
consola del servidor, y únicamente se omite del todo en `NODE_ENV=production`.

### `GET /api/health`

Comprobación de disponibilidad, sin datos sensibles, útil para el monitor
de arranque de Render, Railway o similares.

---

## Decisiones de seguridad

- **Sin consentimiento no hay guardado.** `validateContact.js` rechaza la
  petición con `400` antes de que el controlador llegue a llamar a
  `Contact.create`; el esquema de Mongoose lo vuelve a exigir como última
  defensa por si algo escribe directamente en la base de datos.
- **Lista blanca de campos.** `sanitizeContact.js` solo extrae los siete
  campos que el formulario puede enviar; cualquier otro campo del cuerpo
  se descarta antes de tocar la validación o el modelo.
- **Coerción a texto antes de validar.** Cada campo pasa por `String()`
  antes de compararse con una expresión regular, de modo que un intento de
  inyección de operadores de MongoDB (por ejemplo, enviar `email` como un
  objeto `{"$ne": null}`) se convierte en una cadena inválida en lugar de
  llegar como objeto a una consulta.
- **CORS restringido a un origen conocido.** Solo el dominio declarado en
  `CLIENT_URL` puede llamar a la API desde un navegador; el resto recibe
  `403`.
- **Límite de solicitudes por IP**, aplicado solo a `/api/contact`, para
  frenar el envío automatizado sin afectar `/api/health`.
- **Cabeceras de seguridad con Helmet** y límite de tamaño del cuerpo
  (`20kb`) para descartar payloads anormalmente grandes.

---

## Despliegue

1. Sube el repositorio a GitHub (`.env` queda fuera gracias a `.gitignore`).
2. Crea el clúster en MongoDB Atlas siguiendo la sección 3.
3. Despliega esta carpeta (`server/`) en Render, Railway o Fly.io.
4. Configura en el panel del proveedor las mismas variables de
   `.env.example`, con los valores reales de producción.
5. Pon `CLIENT_URL` con el dominio final del sitio (por ejemplo,
   `https://japh.studio`) y `NODE_ENV=production`.

---

© JAPH. Código privado.
