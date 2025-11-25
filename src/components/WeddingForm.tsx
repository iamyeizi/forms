import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import FileUploader from '@/components/FileUploader'
import StatusBanner from '@/components/StatusBanner'
import UploadProgressModal from '@/components/UploadProgressModal'
import { useFileQueue } from '@/hooks/useFileQueue'
import type { UploadStatus, FileUploadState } from '@/types/uploads'

const formSchema = z.object({
    fullName: z.string().min(2, 'Tu nombre debe tener al menos 2 caracteres.').max(120, 'Mantén el nombre debajo de 120 caracteres.'),
    message: z
        .string()
        .max(500, 'El mensaje puede tener hasta 500 caracteres.')
        .refine((value) => value.trim().length === 0 || value.trim().length >= 10, {
            message: 'Si vas a dejar un mensajito, escribí al menos 10 caracteres.',
        }),
})

type FormValues = z.infer<typeof formSchema>

const WeddingForm = () => {
    const [status, setStatus] = useState<UploadStatus | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<Record<string, FileUploadState>>({})
    const [fileProgress, setFileProgress] = useState<Record<string, number>>({})
    const [showProgressModal, setShowProgressModal] = useState(false)

    const { files, addFiles, removeFile, remainingSlots, clearFiles } = useFileQueue()

    const uploadEndpoint = useMemo(() => import.meta.env.VITE_UPLOAD_ENDPOINT ?? '/.netlify/functions/upload', [])
    const emailEndpoint = useMemo(() => import.meta.env.VITE_EMAIL_ENDPOINT ?? '/.netlify/functions/send-email', [])

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: '',
            message: '',
        },
    })

    const messageValue = watch('message')
    const messageLength = messageValue?.length || 0
    const isMessageTooLong = messageLength >= 500

    const onSubmit = handleSubmit(async (values) => {
        setIsSubmitting(true)
        setStatus(null)

        // Initialize progress
        const initialProgress: Record<string, FileUploadState> = {}
        const initialFileProgress: Record<string, number> = {}
        files.forEach((f) => {
            initialProgress[f.id] = 'pending'
            initialFileProgress[f.id] = 0
        })
        setUploadProgress(initialProgress)
        setFileProgress(initialFileProgress)

        if (files.length > 0) {
            setShowProgressModal(true)
        }

        try {
            // 1. Subir archivos usando Resumable Uploads (Directo a Google)
            const results = await Promise.all(
                files.map(async (entry) => {
                    setUploadProgress((prev) => ({ ...prev, [entry.id]: 'uploading' }))
                    try {
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

                        // B. Subir el archivo directamente a Google usando XHR para progreso
                        await new Promise<void>((resolve, reject) => {
                            const xhr = new XMLHttpRequest()
                            xhr.open('PUT', uploadUrl)

                            xhr.upload.onprogress = (e) => {
                                if (e.lengthComputable) {
                                    const percent = Math.round((e.loaded / e.total) * 100)
                                    setFileProgress((prev) => ({ ...prev, [entry.id]: percent }))
                                }
                            }

                            xhr.onload = () => {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    resolve()
                                } else {
                                    reject(new Error('Upload failed'))
                                }
                            }

                            xhr.onerror = () => reject(new Error('Network error'))
                            xhr.send(entry.file)
                        })

                        setUploadProgress((prev) => ({ ...prev, [entry.id]: 'success' }))
                        return true
                    } catch (error) {
                        console.error(error)
                        setUploadProgress((prev) => ({ ...prev, [entry.id]: 'error' }))
                        return false
                    }
                })
            )

            const allSuccess = results.every(Boolean)

            if (files.length > 0) {
                if (allSuccess) {
                    // Send email notification
                    fetch(emailEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fullName: values.fullName,
                            message: values.message,
                            fileCount: files.length,
                            fileNames: files.map(f => f.file.name)
                        }),
                    }).catch(console.error)

                    await new Promise((resolve) => setTimeout(resolve, 800))
                    setShowProgressModal(false)
                    setStatus({
                        type: 'success',
                        message: '¡Listo! Tus datos han sido enviados con éxito.',
                    })
                    reset()
                    clearFiles()
                }
            } else {
                // Send email notification for text only
                fetch(emailEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: values.fullName,
                        message: values.message,
                        fileCount: 0,
                        fileNames: []
                    }),
                }).catch(console.error)

                setStatus({
                    type: 'success',
                    message: '¡Listo! Tus datos han sido enviados con éxito.',
                })
                reset()
            }
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
                <textarea
                    id="message"
                    placeholder="Dejanos un mensajito o contanos alguna anécdota de la fiesta"
                    maxLength={500}
                    {...register('message')}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {errors.message ? (
                        <span className="error-text">{errors.message.message}</span>
                    ) : (
                        <span />
                    )}
                    <span style={{ color: isMessageTooLong ? 'var(--accent-strong)' : 'var(--muted)' }}>
                        {messageLength}/500
                    </span>
                </div>
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
                <button
                    className="primary-button"
                    type="submit"
                    disabled={isSubmitting || (files.length === 0 && messageLength === 0)}
                >
                    {isSubmitting ? 'Enviando...' : 'Enviar'}
                </button>
                <StatusBanner status={status} onDismiss={() => setStatus(null)} />
            </div>

            <UploadProgressModal
                files={files}
                progress={uploadProgress}
                fileProgress={fileProgress}
                isOpen={showProgressModal}
                onClose={() => setShowProgressModal(false)}
                isFinished={!isSubmitting}
            />
        </form>
    )
}

export default WeddingForm
