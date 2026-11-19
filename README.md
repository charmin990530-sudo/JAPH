# JAPH

Sitio y API de una agencia de ecosistemas digitales. El frontend es estático y el backend recibe formularios de contacto con validación y límites básicos.

## Stack

HTML, CSS y JavaScript en el cliente. Node.js, Express, MongoDB y Mongoose en el servidor.

## Ejecutar

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Después sirve la carpeta `client/` con un servidor estático, por ejemplo:

```bash
npx serve client -l 5173
```

Completa las variables en `.env` y mantenlas fuera de Git.
