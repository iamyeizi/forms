import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import FileUploader from '@/components/FileUploader'
import StatusBanner from '@/components/StatusBanner'
import { useFileQueue } from '@/hooks/useFileQueue'
import type { UploadStatus } from '@/types/uploads'

const formSchema = z.object({
    fullName: z.string().min(2, 'Tu nombre debe tener al menos 2 caracteres.').max(120, 'Mantén el nombre debajo de 120 caracteres.'),
    message: z
        .string()
        .max(400, 'El mensaje puede tener hasta 400 caracteres.')
        .refine((value) => value.trim().length === 0 || value.trim().length >= 10, {
            message: 'Si vas a dejar un mensajito, escribí al menos 10 caracteres.',
        }),
})

type FormValues = z.infer<typeof formSchema>

const WeddingForm = () => {
    const [status, setStatus] = useState<UploadStatus | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { files, addFiles, removeFile, remainingSlots, clearFiles } = useFileQueue()

    const uploadEndpoint = useMemo(() => import.meta.env.VITE_UPLOAD_ENDPOINT ?? '/.netlify/functions/upload', [])

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: '',
            message: '',
        },
    })

    const onSubmit = handleSubmit(async (values) => {
        setIsSubmitting(true)
        setStatus(null)

        try {
            // 1. Subir archivos usando Resumable Uploads (Directo a Google)
            const uploadPromises = files.map(async (entry) => {
                // A. Pedir URL de subida al backend
                const initRes = await fetch(uploadEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: entry.file.name,
                        mimeType: entry.file.type,
                        description: `${values.fullName} · ${values.message || 'Sin mensaje'}`,
                    }),
                })

                if (!initRes.ok) {
                    throw new Error(`Error iniciando subida para ${entry.file.name}`)
                }

                const { uploadUrl } = await initRes.json()

                // B. Subir el archivo directamente a Google
                const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: entry.file,
                })

                if (!uploadRes.ok) {
                    throw new Error(`Fallo al subir ${entry.file.name} a Drive`)
                }
            })

            // 2. Si no hay archivos, podríamos querer guardar el mensaje igual.
            // Por ahora, si no hay archivos, no hacemos nada con Drive, o podríamos crear un archivo de texto.
            // Dado que el form pide archivos opcionalmente (según tu último cambio no, pero el uploader sí),
            // asumimos que si hay texto y no archivos, queremos guardarlo.

            if (files.length === 0 && (values.fullName || values.message)) {
                // Caso borde: Solo texto. Creamos un .txt
                const initRes = await fetch(uploadEndpoint, {
                    method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                         name: `mensaje-${values.fullName.replace(/\s+/g, '-')}.txt`,
                         mimeType: 'text/plain',
                         description: 'Mensaje de texto sin fotos',
                     }),
                 })

                if (initRes.ok) {
                    const { uploadUrl } = await initRes.json()
                    await fetch(uploadUrl, {
                        method: 'PUT',
                        body: `Nombre: ${values.fullName}\nMensaje: ${values.message}`,
                    })
                }
            } else {
                await Promise.all(uploadPromises)
            }

            setStatus({
                type: 'success',
                message: '¡Listo! Tus datos han sido enviados con éxito.',
            })
            reset()
            clearFiles()
        } catch (error) {
            console.error(error)
            const message = error instanceof Error ? error.message : 'No pudimos subir tus archivos.'
            setStatus({ type: 'error', message })
        } finally {
            setIsSubmitting(false)
        }
    })

    return (
        <form className="form" onSubmit={onSubmit} noValidate>
            <div className="field">
                <label htmlFor="fullName">Nombre</label>
                <input id="fullName" placeholder="María López" {...register('fullName')} autoComplete="name" />
                {errors.fullName && <span className="error-text">{errors.fullName.message}</span>}
            </div>

            <div className="field">
                <label htmlFor="message">Mensaje</label>
                <textarea id="message" placeholder="Dejanos un mensajito o contanos alguna anécdota de la fiesta" {...register('message')} />
                {errors.message && <span className="error-text">{errors.message.message}</span>}
            </div>

            <FileUploader
                files={files}
                onFilesAdded={addFiles}
                onRemove={removeFile}
                onClear={clearFiles}
                remainingSlots={remainingSlots}
                accept="image/jpeg,image/png,image/heic,image/heif,video/mp4,video/quicktime"
            />

            <div className="actions">
                <button className="primary-button" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar'}
                </button>
                <StatusBanner status={status} onDismiss={() => setStatus(null)} />
            </div>
        </form>
    )
}

export default WeddingForm
