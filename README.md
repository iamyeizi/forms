# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Formulario de boda

  Landing mobile-first construida con React + TypeScript + Vite. Incluye un formulario accesible para capturar nombres, mensajes y subir fotos o videos que terminan en una carpeta privada de Google Drive a través de una función serverless de Netlify.

  ## Características

  - Diseño responsive con gradientes suaves y componentes reutilizables.
  - Manejo de formulario con `react-hook-form` + `zod` para validaciones amistosas.
  - Componente de carga con drag & drop y límite configurable de archivos.
  - Función serverless (`netlify/functions/upload.ts`) que usa un Service Account de Google para escribir en Drive.
  - Configuración lista para desplegar en Netlify (build command, funciones y variables de entorno).

  ## Variables de entorno

  Copia `.env.example` en `.env` y llena los valores:

  ```
  VITE_UPLOAD_ENDPOINT=/.netlify/functions/upload
  GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-servicio@project.iam.gserviceaccount.com
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_AQUI\n-----END PRIVATE KEY-----\n"
  GOOGLE_DRIVE_FOLDER_ID=xxxxxxxxxxxxxxxxxxxx
  ```

  > En Netlify deberás registrar las mismas variables en la sección **Site Settings → Environment variables**. Nunca compartas la clave privada en texto plano fuera de los entornos seguros.

  ### Cómo obtener las credenciales de Google

  1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto y habilita la **Google Drive API**.
  2. En **APIs & Services → Credentials** crea un **Service Account** y genera una clave tipo JSON.
  3. Copia `client_email` y `private_key` al `.env` (respeta los saltos de línea usando `\n`).
  4. En Google Drive crea la carpeta destino, copia su ID (parte final de la URL) y agrégala al `.env` como `GOOGLE_DRIVE_FOLDER_ID`.
  5. Comparte esa carpeta con el correo del Service Account con permiso de editor.

  ## Scripts

  - `npm run dev` – Levanta Vite en `http://localhost:5173`.
  - `netlify dev` – (opcional) Levanta Vite + funciones serverless en caliente.
  - `npm run build` – Compila la app y la función para producción.
  - `npm run preview` – Sirve la versión generada en `dist/`.

  ## Flujo de despliegue

  1. Conecta el repositorio en Netlify y selecciona la rama `main`.
  2. Configura las variables de entorno anteriores.
  3. Netlify ejecutará `npm run build`, publicará `dist/` y expondrá la función `/.netlify/functions/upload`.

  ## Límites y recomendaciones

  - Netlify Functions acepta payloads de hasta 10MB; se recomienda subir archivos individuales menores a 50MB por la conversión base64.
  - Para colecciones más pesadas considera mover la lógica a un backend dedicado o a la API de Uploads de Drive con sesiones resumibles.
  - Mantén el Service Account aislado a una carpeta específica y revoca permisos cuando finalice el evento.
  },
