import type { Handler } from '@netlify/functions'
import { google } from 'googleapis'

const createDriveClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    if (!clientId || !clientSecret || !refreshToken || !folderId) {
        throw new Error('Faltan variables de entorno para conectarse a Google Drive.')
    }

    const auth = new google.auth.OAuth2(clientId, clientSecret)
    auth.setCredentials({ refresh_token: refreshToken })

    const drive = google.drive({ version: 'v3', auth })

    return { drive, folderId, auth }
}

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Método no permitido' }),
        }
    }

    try {
        const { folderId, auth } = createDriveClient()
        const body = JSON.parse(event.body || '{}')
        const { name, description, mimeType } = body
        const origin = event.headers['origin'] || event.headers['Origin']

        if (!name) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Falta el nombre del archivo' }),
            }
        }

        // Iniciamos una sesión de subida resumible (Resumable Upload)
        // Usamos el token generado por la librería para autenticar nuestro fetch manual
        const tokenResponse = await auth.getAccessToken()
        const accessToken = tokenResponse.token

        if (!accessToken) {
            throw new Error('No se pudo obtener el token de acceso.')
        }

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': mimeType,
        }

        // Importante: Pasamos el Origin del cliente para que Google configure CORS en la URL de subida
        if (origin) {
            headers['Origin'] = origin
        }

        const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: `${Date.now()}-${name}`,
                description: description || 'Subido desde formulario',
                parents: [folderId],
                mimeType,
            })
        })

        if (!initRes.ok) {
            throw new Error(`Error iniciando subida: ${initRes.statusText}`)
        }

        const uploadUrl = initRes.headers.get('Location')

        if (!uploadUrl) {
            throw new Error('No se recibió la URL de subida de Google.')
        }

        const responseHeaders: Record<string, string | number | boolean> = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
        }

        return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify({ uploadUrl }),
        }

    } catch (error) {
        console.error('Error en upload function:', error)
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: error instanceof Error ? error.message : 'Fallo al iniciar la subida',
            }),
        }
    }
}
