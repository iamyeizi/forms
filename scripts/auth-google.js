import { google } from 'googleapis';
import readline from 'readline';

// Instrucciones para el usuario:
// 1. Ve a Google Cloud Console -> Credenciales.
// 2. Crea un "ID de cliente de OAuth 2.0".
// 3. Tipo de aplicación: "App de escritorio" (para facilitar este script) o "Aplicación web".
//    - Si eliges "Aplicación web", añade "http://localhost:3000" en "URI de redireccionamiento autorizados".
// 4. Copia el ID de cliente y el Secreto.

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n--- Generador de Refresh Token para Google Drive ---\n');

  const clientId = await question('Introduce tu Client ID: ');
  const clientSecret = await question('Introduce tu Client Secret: ');

  const oauth2Client = new google.auth.OAuth2(
    clientId.trim(),
    clientSecret.trim(),
    'urn:ietf:wg:oauth:2.0:oob' // Para apps de escritorio/scripts, esto muestra el código en pantalla
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Importante para obtener refresh_token
    scope: SCOPES,
  });

  console.log('\nAutoriza la aplicación visitando esta URL:\n');
  console.log(authUrl);
  console.log('\n');

  const code = await question('Introduce el código que aparece en la página: ');

  try {
    const { tokens } = await oauth2Client.getToken(code.trim());

    console.log('\n¡Éxito! Aquí tienes tus nuevas variables para el archivo .env:\n');
    console.log(`GOOGLE_CLIENT_ID=${clientId.trim()}`);
    console.log(`GOOGLE_CLIENT_SECRET=${clientSecret.trim()}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`GOOGLE_DRIVE_FOLDER_ID=(El que ya tenías)`);

  } catch (error) {
    console.error('\nError obteniendo el token:', error.message);
  } finally {
    rl.close();
  }
}

main();
