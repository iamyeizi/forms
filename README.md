# Formulario de Boda - Subida de Fotos a Drive

Aplicación web mobile-first construida con React + TypeScript + Vite. Permite a los invitados dejar mensajes y subir fotos o videos que se guardan automáticamente en una carpeta de tu Google Drive personal.

## Características

- 🎨 Diseño moderno y responsive (Mobile First).
- 📝 Formulario validado con `react-hook-form` y `zod`.
- 📁 Carga de archivos con Drag & Drop, previsualización inteligente y barra de progreso detallada.
- ☁️ Funciones serverless en Netlify:
  - `upload.ts`: Genera URLs firmadas para subir archivos directamente a Google Drive (Resumable Uploads).
  - `send-email.ts`: Envía notificaciones por correo con `nodemailer`.
- 🔐 Integración segura con Google Drive usando OAuth 2.0.
- 📧 Notificaciones automáticas por email con diseño HTML personalizado.

## Configuración de Google Drive (OAuth 2.0)

Para que la aplicación pueda subir archivos a tu Drive, necesitas configurar un proyecto en Google Cloud y autorizarlo.

### 1. Crear Proyecto y Credenciales

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto (ej: "Boda Uploads").
3. En el buscador, escribe **"Google Drive API"**, selecciónala y dale a **Habilitar**.
4. Ve a **APIs y servicios** > **Pantalla de consentimiento de OAuth**:
   - Selecciona **Externo**.
   - Rellena los datos obligatorios (nombre de la app, emails).
   - **IMPORTANTE:** En la sección **"Usuarios de prueba" (Test users)**, añade tu propio correo de Gmail (el dueño del Drive).
5. Ve a **Credenciales** > **+ CREAR CREDENCIALES** > **ID de cliente de OAuth 2.0**:
   - Tipo de aplicación: **App de escritorio**.
   - Dale un nombre y crea la credencial.
   - Copia el **ID de cliente** y el **Secreto de cliente**.

### 2. Generar el Refresh Token

Hemos incluido un script para facilitar este paso. En tu terminal ejecuta:

```bash
node scripts/auth-google.js
```

Sigue las instrucciones: pega el ID y Secreto que copiaste, abre el link que te dará, autoriza la app con tu cuenta de Gmail y copia el código que te devuelva Google.

El script te mostrará las variables exactas que necesitas.

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (puedes copiar `.env.example` si existe) y configura las siguientes variables:

```dotenv
# URL de la función serverless (local o producción)
VITE_UPLOAD_ENDPOINT=/.netlify/functions/upload

# Credenciales de Google (obtenidas en el paso anterior)
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REFRESH_TOKEN=tu-refresh-token

# ID de la carpeta de destino en Drive
# (Es el código al final de la URL cuando entras a la carpeta en el navegador)
GOOGLE_DRIVE_FOLDER_ID=xxxxxxxxxxxxxxxxxxxx
```

## Configuración de Notificaciones por Email

La aplicación envía un correo electrónico cada vez que alguien completa el formulario. Para esto, utiliza una cuenta de Gmail y `nodemailer`.

### 1. Generar Contraseña de Aplicación (App Password)

Como tu cuenta de Gmail probablemente tiene autenticación en 2 pasos, no puedes usar tu contraseña normal. Necesitas una "Contraseña de aplicación".

1. Asegúrate de tener la **Verificación en 2 pasos** activada en tu cuenta de Google.
2. Entra directamente a este enlace (es difícil de encontrar en el menú):
   👉 **[https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**
3. Crea una nueva contraseña:
   - **App:** Correo.
   - **Dispositivo:** Otro (ponle un nombre como "Web Boda").
4. Copia la clave de 16 caracteres que te da (ej: `abcd efgh ijkl mnop`).

### 2. Variables de Entorno para Email

Añade estas variables a tu archivo `.env`:

```dotenv
# Correo desde donde se envían las notificaciones (tu Gmail)
EMAIL_USER=tucorreo@gmail.com

# La contraseña de aplicación de 16 caracteres (sin espacios o con espacios, funciona igual)
EMAIL_PASS=abcd efgh ijkl mnop

# Correo donde quieres RECIBIR las notificaciones
EMAIL_DESTINATION=destinatario@gmail.com
```

## Desarrollo Local

Para probar la aplicación completa (frontend + subida de archivos), debes usar el entorno de Netlify, ya que Vite por sí solo no ejecuta las funciones serverless.

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev:netlify
   ```
   Esto abrirá la aplicación en `http://localhost:8888`.

## Despliegue en Netlify

1. Conecta tu repositorio a Netlify.
2. En la configuración del sitio en Netlify, ve a **Site configuration** > **Environment variables**.
3. Agrega las **7 variables de entorno** definidas en tu `.env`:
   - **Google:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID`
   - **Email:** `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_DESTINATION`
4. ¡Listo! Netlify detectará automáticamente la configuración y desplegará el frontend y las funciones.

## Estructura del Proyecto

```
src/
  components/    # Componentes React (Formulario, Uploader, etc.)
  hooks/         # Hooks personalizados (useFileQueue)
  styles/        # Estilos globales CSS
  types/         # Definiciones de tipos TypeScript
netlify/
  functions/     # Código del backend (upload.ts)
scripts/
  auth-google.js # Script de utilidad para generar tokens
```
