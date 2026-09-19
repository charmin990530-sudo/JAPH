/**
 * Contact.js
 * Forma de un mensaje de contacto en la base de datos. El esquema valida
 * de nuevo lo que ya validó el middleware: es la última línea de defensa,
 * y la única que también protege contra escrituras hechas fuera de la API
 * (una consola de Mongo, un script de migración, etc.).
 */

const mongoose = require('mongoose');

/** Servicios que ofrece JAPH. Se reutiliza en el middleware de validación. */
const SERVICIOS = [
  'web',
  'app-web',
  'app-movil',
  'automatizacion',
  'marketing',
  'video',
  'branding'
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const TELEFONO_RE = /^[+()\d\s-]{7,20}$/;

const contactSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres.'],
      maxlength: [100, 'El nombre no puede superar 100 caracteres.']
    },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio.'],
      trim: true,
      lowercase: true,
      maxlength: [150, 'El correo no puede superar 150 caracteres.'],
      match: [EMAIL_RE, 'El correo no tiene un formato válido.']
    },
    empresa: {
      type: String,
      trim: true,
      maxlength: [100, 'El nombre de la empresa no puede superar 100 caracteres.'],
      default: ''
    },
    telefono: {
      type: String,
      trim: true,
      default: '',
      validate: {
        // Vacío es válido: el teléfono es opcional.
        validator: (valor) => valor === '' || TELEFONO_RE.test(valor),
        message: 'El teléfono no tiene un formato válido.'
      }
    },
    servicio: {
      type: String,
      required: [true, 'Selecciona el servicio que te interesa.'],
      enum: {
        values: SERVICIOS,
        message: 'El servicio seleccionado no es válido.'
      }
    },
    mensaje: {
      type: String,
      required: [true, 'El mensaje es obligatorio.'],
      trim: true,
      minlength: [20, 'Cuéntanos un poco más: al menos 20 caracteres.'],
      maxlength: [2000, 'El mensaje no puede superar 2000 caracteres.']
    },
    consentimiento: {
      type: Boolean,
      required: [true, 'Debes aceptar el tratamiento de tus datos personales.'],
      validate: {
        // No basta con que el campo exista: tiene que ser explícitamente true.
        validator: (valor) => valor === true,
        message: 'Debes aceptar el tratamiento de tus datos personales para continuar.'
      }
    },
    fecha: {
      type: Date,
      default: Date.now
    },
    // Metadatos internos, nunca expuestos en la respuesta al cliente.
    ip: { type: String, trim: true, default: '', select: false },
    origen: { type: String, trim: true, maxlength: 300, default: '', select: false }
  },
  {
    versionKey: false,
    // No usamos timestamps automáticos porque "fecha" ya cumple ese rol
    // y así el esquema queda igual al que pide el enunciado.
    timestamps: false
  }
);

// Consulta habitual de un futuro panel interno: los más recientes primero.
contactSchema.index({ fecha: -1 });

/** Representación segura para devolver en las respuestas JSON. */
contactSchema.methods.aSalida = function aSalida() {
  return {
    id: this._id,
    nombre: this.nombre,
    email: this.email,
    servicio: this.servicio,
    fecha: this.fecha
  };
};

module.exports = mongoose.model('Contact', contactSchema);
module.exports.SERVICIOS = SERVICIOS;
