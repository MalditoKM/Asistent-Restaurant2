
import * as admin from 'firebase-admin';

// Variable para mantener una única instancia del SDK de Firebase Admin.
// Esto evita reinicializar la aplicación en cada llamada, lo cual es más eficiente.
let adminInstance: typeof admin | null = null;

/**
 * Inicializa el SDK de Firebase Admin para la comunicación del lado del servidor.
 * Lee las credenciales desde las variables de entorno y se asegura de que solo
 * haya una instancia de la aplicación de Firebase activa.
 * 
 * @returns Una instancia del SDK de Firebase Admin si la inicialización es exitosa,
 *          o null si las credenciales no están configuradas.
 */
export async function initializeFirebaseAdmin() {
  // Si ya tenemos una instancia inicializada, la devolvemos inmediatamente.
  if (adminInstance) {
    return adminInstance;
  }

  // Se construye el objeto de credenciales a partir de las variables de entorno.
  // Next.js carga automáticamente las variables del archivo .env.local en process.env.
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // La clave privada a menudo contiene caracteres de nueva línea (\n) que deben ser
    // reemplazados para que se interpreten correctamente.
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  // Verificamos si todas las credenciales necesarias están presentes.
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    // Si falta alguna credencial, mostramos una advertencia clara en la consola del servidor.
    // La aplicación entrará en un "modo sin base de datos", donde las operaciones de DB no funcionarán.
    console.warn('ADVERTENCIA: Las credenciales de Firebase Admin no están configuradas en las variables de entorno. La aplicación utilizará un modo sin base de datos. Rellena el archivo .env.local para conectar a Firestore.');
    return null;
  }

  // Si no hay ninguna aplicación de Firebase inicializada previamente...
  if (!admin.apps.length) {
    try {
      // ...intentamos inicializarla con las credenciales que hemos cargado.
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK inicializado correctamente.');
      // Guardamos la instancia para futuras llamadas.
      adminInstance = admin;
    } catch (error: any) {
      // Si ocurre un error durante la inicialización, lo mostramos en la consola.
      console.error('Error al inicializar Firebase Admin SDK:', error.message);
      return null;
    }
  } else {
    // Si ya existe una aplicación, simplemente la obtenemos y la guardamos en nuestra variable.
    adminInstance = admin;
  }
  
  // Devolvemos la instancia del SDK lista para ser usada.
  return adminInstance;
}
