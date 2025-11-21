import { Readable } from 'stream'
import type { Handler } from '@netlify/functions'
import { google } from 'googleapis'
import parser, { type MultipartFile } from 'lambda-multipart-parser'

const decodeFile = (file: MultipartFile) => {
    const base64Payload = typeof file.content === 'string' ? file.content : file.content.toString('base64')
    return Buffer.from(base64Payload, 'base64')
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB por archivo recomendado

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

    return { drive, folderId }
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
        const { drive, folderId } = createDriveClient()
        const parsed = await parser.parse(event)

        const files = (parsed.files ?? []) as MultipartFile[]
        if (!files.length) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Agrega al menos un archivo.' }),
            }
        }

        const hydratedFiles = files.map((file) => ({ meta: file, buffer: decodeFile(file) }))

        const oversized = hydratedFiles.find((entry) => entry.buffer.byteLength > MAX_FILE_SIZE)
        if (oversized) {
            return {
                statusCode: 413,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `"${oversized.meta.filename}" excede el límite de 50MB.` }),
            }
        }

        const metadataParts = [parsed.fullName, parsed.message]
            .filter(Boolean)
            .join(' · ')

        const uploaded = []

        for (const { meta, buffer } of hydratedFiles) {
            const response = await drive.files.create({
                requestBody: {
                    name: `${Date.now()}-${meta.filename}`,
                    description: metadataParts || 'Subido desde formulario',
                    parents: [folderId],
                },
                media: {
                    mimeType: meta.contentType,
                    body: Readable.from(buffer),
                },
                fields: 'id, name, webViewLink',
            })

            uploaded.push(response.data)
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Archivos cargados con éxito',
                files: uploaded,
            }),
        }
    } catch (error) {
        console.error(error)
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: error instanceof Error ? error.message : 'Fallo al subir tus archivos',
            }),
        }
    }
}
