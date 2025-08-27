
import fs from 'fs';
import archiver from 'archiver';

console.log('Iniciando el proceso de compresión...');

// Define el nombre del archivo de salida.
const OUTPUT_FILE = 'app.zip';
// Crea un stream de escritura para el archivo zip.
const output = fs.createWriteStream(OUTPUT_FILE);
// Crea una instancia de archiver, especificando el formato 'zip' y el nivel de compresión.
const archive = archiver('zip', {
  zlib: { level: 9 } // Nivel máximo de compresión.
});

// Escucha el evento 'close' para saber cuándo ha terminado el proceso.
output.on('close', function() {
  console.log(`Compresión finalizada. Total: ${archive.pointer()} bytes.`);
  console.log(`Archivo guardado en: ${OUTPUT_FILE}`);
});

// Escucha eventos de 'warning' o 'error'.
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Advertencia durante la compresión:', err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

// Conecta el stream de archiver con el stream del archivo de salida.
archive.pipe(output);

// Añade el contenido del directorio actual al archivo zip.
// - `globOptions.dot: true` incluye archivos ocultos (como .gitignore).
// - `globOptions.ignore` excluye archivos y directorios específicos.
archive.glob('**/*', {
    cwd: './',
    dot: true,
    ignore: [
        'node_modules/**',
        '.next/**',
        '.git/**',
        'app.zip', // No incluir el propio archivo zip.
        '.env',
        '.env.local',
        '.env.production',
    ]
});

// Finaliza el archivo. Esto es esencial para que se escriba todo correctamente.
archive.finalize();
