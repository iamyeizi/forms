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
    message: z.string().min(10, 'Escribe al menos 10 caracteres.').max(400, 'El mensaje puede tener hasta 400 caracteres.'),
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
            const formData = new FormData()
            formData.append('fullName', values.fullName)
            formData.append('message', values.message)

            files.forEach((entry) => {
                formData.append('files', entry.file, entry.file.name)
            })

            const response = await fetch(uploadEndpoint, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => ({ message: 'Error desconocido' }))
                throw new Error(payload.message ?? 'No pudimos cargar tus archivos. Intenta nuevamente.')
            }

            setStatus({
                type: 'success',
                message: '¡Listo! Registramos tus datos y empezamos a guardar tus archivos.',
            })
            reset()
            clearFiles()
        } catch (error) {
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
                <StatusBanner status={status} />
            </div>
        </form>
    )
}

export default WeddingForm
