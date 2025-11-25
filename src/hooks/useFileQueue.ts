import { useCallback, useEffect, useRef, useState } from 'react'
import type { PendingUploadFile } from '@/types/uploads'

const createId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const createPreview = (file: File) => {
    // Detección robusta: por tipo MIME o por extensión (para iOS .mov)
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|quicktime)$/i.test(file.name)

    return isImage || isVideo ? URL.createObjectURL(file) : undefined
}

export const useFileQueue = (maxFiles = Number.POSITIVE_INFINITY) => {
    const [files, setFiles] = useState<PendingUploadFile[]>([])
    const previews = useRef(new Map<string, string>())

    const addFiles = useCallback(
        (incoming: FileList | File[]) => {
            const next = Array.from(incoming)
            if (!next.length) return

            setFiles((current) => {
                const available = Number.isFinite(maxFiles) ? Math.max(0, maxFiles - current.length) : next.length
                const slice = Number.isFinite(maxFiles) ? next.slice(0, available) : next
                const uniqueSlice = slice.filter(
                    (candidate) => !current.some((item) => item.file.name === candidate.name && item.file.size === candidate.size),
                )

                const additions = uniqueSlice.map<PendingUploadFile>((file) => {
                    const id = createId()
                    const previewUrl = createPreview(file)
                    if (previewUrl) {
                        previews.current.set(id, previewUrl)
                    }
                    return { id, file, previewUrl }
                })

                return [...current, ...additions]
            })
        },
        [maxFiles],
    )

    const removeFile = useCallback((id: string) => {
        setFiles((current) => {
            const fileToRemove = current.find((item) => item.id === id)
            if (fileToRemove?.previewUrl) {
                URL.revokeObjectURL(fileToRemove.previewUrl)
                previews.current.delete(id)
            }
            return current.filter((item) => item.id !== id)
        })
    }, [])

    const clearFiles = useCallback(() => {
        previews.current.forEach((url) => URL.revokeObjectURL(url))
        previews.current.clear()
        setFiles([])
    }, [])

    useEffect(() => {
        const previewRegistry = previews.current
        return () => {
            previewRegistry.forEach((url) => URL.revokeObjectURL(url))
            previewRegistry.clear()
        }
    }, [])

    return {
        files,
        addFiles,
        removeFile,
        clearFiles,
        remainingSlots: Number.isFinite(maxFiles) ? Math.max(0, maxFiles - files.length) : Number.POSITIVE_INFINITY,
    }
}
