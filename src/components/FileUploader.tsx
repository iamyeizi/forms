import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'
import type { PendingUploadFile } from '@/types/uploads'
import { formatBytes } from '@/utils/file'

interface FileUploaderProps {
    files: PendingUploadFile[]
    onFilesAdded: (files: FileList | File[]) => void
    onRemove: (id: string) => void
    onClear?: () => void
    remainingSlots: number
    accept?: string
}

const ACCEPTED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
])

const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.mp4', '.mov']
const PREVIEW_SLOTS = 7

const FileUploader = ({ files, onFilesAdded, onRemove, onClear, remainingSlots, accept }: FileUploaderProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isListExpanded, setIsListExpanded] = useState(false)
    const [fileError, setFileError] = useState<string | null>(null)

    const visibleFiles = files.slice(0, PREVIEW_SLOTS)
    const overflowCount = Math.max(files.length - PREVIEW_SLOTS, 0)
    const hasFiles = files.length > 0
    const shouldShowGrid = hasFiles
    const showDragInstructions = !hasFiles

    const allowedAccept = useMemo(() => accept ?? Array.from(ACCEPTED_MIME_TYPES).join(','), [accept])

    const sanitizeFiles = (incoming: FileList | File[] | null) => {
        if (!incoming) return []

        const candidates = Array.from(incoming)
        let rejected = 0

        const acceptedFiles = candidates.filter((file) => {
            const normalizedName = file.name.toLowerCase()
            const isAllowed = ACCEPTED_MIME_TYPES.has(file.type) || ACCEPTED_EXTENSIONS.some((ext) => normalizedName.endsWith(ext))
            if (!isAllowed) rejected += 1
            return isAllowed
        })

        setFileError(rejected > 0 ? `Ignoramos ${rejected} archivo(s) por formato no permitido.` : null)

        return acceptedFiles
    }

    const handleFiles = (fileList: FileList | File[] | null) => {
        const sanitized = sanitizeFiles(fileList)
        if (sanitized.length) {
            onFilesAdded(sanitized)
        }
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragging(false)
        handleFiles(event.dataTransfer.files)
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        if (!isDragging) setIsDragging(true)
    }

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragging(false)
    }

    const getPreviewLabel = (file: File) => {
        const extension = file.name.split('.').pop()
        if (extension) return extension.slice(0, 4).toUpperCase()
        const type = file.type.split('/').pop()
        return type ? type.slice(0, 4).toUpperCase() : 'FILE'
    }

    const hasFiniteSlots = Number.isFinite(remainingSlots)
    const canAddMore = !hasFiniteSlots || remainingSlots > 0
    const selectionSummary =
        files.length === 0 ? 'Aún no has agregado archivos.' : `${files.length} ${files.length === 1 ? 'archivo' : 'archivos'} listos para subir.`

    const renderPreviewContent = (entry: PendingUploadFile, variant: 'grid' | 'list' = 'grid') => {
        if (entry.previewUrl) {
            if (entry.file.type.startsWith('video/')) {
                return (
                    <video
                        src={entry.previewUrl}
                        className={variant === 'grid' ? 'file-preview__thumb' : 'file-row__thumb'}
                        muted
                        playsInline
                        onMouseOver={(e) => e.currentTarget.play()}
                        onMouseOut={(e) => {
                            e.currentTarget.pause()
                            e.currentTarget.currentTime = 0
                        }}
                        onTimeUpdate={(e) => {
                            // Loop de los primeros 5 segundos para vista previa
                            if (e.currentTarget.currentTime > 5) {
                                e.currentTarget.currentTime = 0
                            }
                        }}
                    />
                )
            }
            return (
                <img
                    src={entry.previewUrl}
                    alt={`Vista previa de ${entry.file.name}`}
                    className={variant === 'grid' ? 'file-preview__thumb' : 'file-row__thumb'}
                />
            )
        }
        const label = getPreviewLabel(entry.file)
        return <span className={variant === 'grid' ? 'file-preview__label' : 'file-row__badge'}>{label}</span>
    }

    useEffect(() => {
        if (isListExpanded) {
            // Prevent background scrolling
            document.body.style.overflow = 'hidden'

            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    setIsListExpanded(false)
                }
            }

            window.addEventListener('keydown', handleKeyDown)

            return () => {
                window.removeEventListener('keydown', handleKeyDown)
                document.body.style.overflow = ''
            }
        }
    }, [isListExpanded])

    return (
        <div className="field">
            <label htmlFor="media-input">Fotos y videos</label>
            <p className="field__hint">Formatos permitidos: jpg, jpeg, heic, png, mp4, mov.</p>

            <div
                className={classNames('file-dropzone', {
                    'file-dropzone--active': isDragging,
                    'file-dropzone--populated': files.length > 0,
                })}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        inputRef.current?.click()
                    }
                }}
                aria-describedby="media-help"
            >
                <input
                    ref={inputRef}
                    id="media-input"
                    type="file"
                    accept={allowedAccept}
                    multiple
                    hidden
                    onChange={(event) => {
                        handleFiles(event.target.files)
                        event.target.value = ''
                    }}
                />
                <div className="file-dropzone__content">
                    <div className="file-dropzone__headline">
                        {showDragInstructions ? (
                            <>
                                <p className="file-dropzone__title">Arrastra tus archivos o haz clic para seleccionarlos</p>
                                <p className="field__hint" id="media-help">
                                    {selectionSummary}
                                    {hasFiniteSlots && canAddMore && ` · Puedes añadir ${remainingSlots} más.`}
                                </p>
                            </>
                        ) : (
                            <div className="file-dropzone__status" id="media-help">
                                <p className="file-dropzone__count">
                                    {selectionSummary}
                                    {hasFiniteSlots && canAddMore && ` · Puedes añadir ${remainingSlots} más.`}
                                </p>
                                <button
                                    type="button"
                                    className="icon-button"
                                    onClick={() => setIsListExpanded(true)}
                                    aria-haspopup="dialog"
                                    aria-controls="file-modal"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path
                                            d="M8.5 12.25 13.75 7a2.5 2.5 0 1 1 3.54 3.54l-7.07 7.07a3.5 3.5 0 0 1-4.95-4.95l6.01-6.01"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span>Ver archivos</span>
                                </button>
                            </div>
                        )}
                        {fileError && <p className="error-text">{fileError}</p>}
                    </div>

                    {shouldShowGrid && (
                        <div className="file-preview-grid" aria-label="Vista previa de archivos seleccionados">
                            {visibleFiles.map((entry) => (
                                <div
                                    key={entry.id}
                                    className={classNames('file-preview', { 'file-preview--image': Boolean(entry.previewUrl) })}
                                    title={entry.file.name}
                                >
                                    {renderPreviewContent(entry, 'grid')}
                                </div>
                            ))}
                            {overflowCount > 0 && (
                                <div className="file-preview file-preview--more" aria-label={`Hay ${overflowCount} archivo(s) adicionales`}>
                                    <span className="file-preview__icon" aria-hidden="true">+</span>
                                    <span className="file-preview__count">{overflowCount}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="file-dropzone__actions">
                        <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()} disabled={!canAddMore}>
                            Elegir archivos
                        </button>
                    </div>
                </div>
            </div>

            {isListExpanded && createPortal(
                <div className="file-modal" role="dialog" aria-modal="true" aria-labelledby="file-modal-title" id="file-modal">
                    <div className="file-modal__backdrop" aria-hidden="true" onClick={() => setIsListExpanded(false)} />
                    <div className="file-modal__panel" role="document">
                        <div className="file-modal__header">
                            <div>
                                <p className="file-modal__title" id="file-modal-title">
                                    Archivos seleccionados
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <p className="field__hint" style={{ margin: 0 }}>{selectionSummary}</p>
                                    {files.length > 0 && onClear && (
                                        <button
                                            type="button"
                                            onClick={onClear}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: 0,
                                                color: 'var(--accent-strong)',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            Borrar todo
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button type="button" className="file-modal__close" onClick={() => setIsListExpanded(false)} aria-label="Cerrar lista">
                                ×
                            </button>
                        </div>
                        <div className="file-modal__body" aria-live="polite">
                            {files.length === 0 ? (
                                <p className="field__hint">Aún no has agregado archivos.</p>
                            ) : (
                                <div className="file-list">
                                    {files.map((entry) => (
                                        <div key={entry.id} className="file-row">
                                            <div className="file-row__preview" aria-hidden="true">
                                                {renderPreviewContent(entry, 'list')}
                                            </div>
                                            <div className="file-row__meta">
                                                <span className="file-row__name">{entry.file.name}</span>
                                                <span className="file-row__size">{formatBytes(entry.file.size)}</span>
                                            </div>
                                            <button type="button" onClick={() => onRemove(entry.id)} aria-label={`Eliminar ${entry.file.name}`}>
                                                Quitar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

export default FileUploader
