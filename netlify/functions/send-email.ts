import type { Handler } from '@netlify/functions'
import nodemailer from 'nodemailer'
import * as dotenv from 'dotenv'

dotenv.config()

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' }
    }

    try {
        const { fullName, message, fileCount } = JSON.parse(event.body || '{}')

        if (!fullName) {
            return { statusCode: 400, body: 'Missing fullName' }
        }

        const emailUser = process.env.EMAIL_USER
        const emailPass = process.env.EMAIL_PASS
        const emailDest = process.env.EMAIL_DESTINATION
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

        console.log('Email Config Check:', {
            hasUser: !!emailUser,
            hasPass: !!emailPass,
            hasDest: !!emailDest
        });

        if (!emailUser || !emailPass || !emailDest) {
            console.error('Missing email configuration')
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Server email configuration missing' }),
            }
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass.replace(/\s+/g, ''),
            },
        })

        const driveLink = folderId ? `https://drive.google.com/drive/folders/${folderId}` : 'https://drive.google.com/'

        // HTML Template
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fdf9f6; color: #271c19; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 20px; margin-bottom: 20px; border: 1px solid rgba(39, 28, 25, 0.1); }
                .header { background-color: #f4ebe3; padding: 30px 20px; text-align: center; border-bottom: 1px solid rgba(39, 28, 25, 0.05); }
                .header h1 { margin: 0; color: #b85c4f; font-size: 24px; letter-spacing: 1px; text-transform: uppercase; }
                .content { padding: 30px; }
                .message-box { background-color: #fdf9f6; border-left: 4px solid #b85c4f; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .message-text { font-style: italic; color: #6d5f57; font-size: 16px; line-height: 1.6; }
                .stats { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
                .stat-badge { background-color: rgba(184, 92, 79, 0.1); color: #8f3a2d; padding: 8px 16px; border-radius: 50px; font-weight: bold; font-size: 14px; }
                .file-list { margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
                .file-list h3 { margin-top: 0; font-size: 16px; color: #271c19; }
                .file-list ul { padding-left: 20px; color: #6d5f57; font-size: 14px; }
                .file-list li { margin-bottom: 5px; }
                .btn { display: inline-block; background-color: #b85c4f; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 50px; font-weight: bold; margin-top: 20px; text-align: center; }
                .footer { background-color: #fdf9f6; padding: 20px; text-align: center; font-size: 12px; color: #999; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Lucía y Andrés</h1>
                </div>
                <div class="content">
                    <h2 style="margin-top: 0; color: #271c19;">¡Nuevo mensaje recibido!</h2>
                    <p style="font-size: 16px; line-height: 1.5;"><strong>${fullName}</strong> ha compartido recuerdos de la boda.</p>

                    ${message ? `
                    <div class="message-box">
                        <div class="message-text">"${message}"</div>
                    </div>
                    ` : ''}

                    <div class="stats">
                        <span class="stat-badge">${fileCount} archivo${fileCount !== 1 ? 's' : ''} subido${fileCount !== 1 ? 's' : ''}</span>
                    </div>

                    <div style="text-align: center;">
                        <a href="${driveLink}" class="btn">Ver archivos en Google Drive</a>
                    </div>
                </div>
                <div class="footer">
                    Este correo fue enviado automáticamente desde la web de la boda.
                </div>
            </div>
        </body>
        </html>
        `

        await transporter.sendMail({
            from: `"Lucia y Andrés 💍" <${emailUser}>`,
            to: emailDest,
            subject: `📸 Nuevo recuerdo de ${fullName}`,
            html: htmlContent,
        })

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully' }),
        }
    } catch (error) {
        console.error('Detailed Email Error:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to send email',
                error: error instanceof Error ? error.message : String(error)
            }),
        }
    }
}

export { handler }
