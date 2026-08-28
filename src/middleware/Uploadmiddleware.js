const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta donde se guardan los archivos subidos
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Crea la carpeta si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Solo permitimos PDF y Word
const TIPOS_PERMITIDOS = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Nombre único para evitar sobreescribir archivos con el mismo nombre
    const sufijoUnico = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, sufijoUnico + extension);
  },
});

const fileFilter = (req, file, cb) => {
  if (TIPOS_PERMITIDOS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF o Word (.doc, .docx)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // máximo 10 MB
  },
});

module.exports = upload;