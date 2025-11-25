import { createPortal } from 'react-dom'
import type { PendingUploadFile, FileUploadState } from '@/types/uploads'

interface UploadProgressModalProps {
    files: PendingUploadFile[]
    progress: Record<string, FileUploadState>
    fileProgress: Record<string, number>
    isOpen: boolean
    onClose: () => void
    isFinished: boolean
}

const UploadProgressModal = ({ files, progress, fileProgress, isOpen, onClose, isFinished }: UploadProgressModalProps) => {
    if (!isOpen) return null

    const hasErrors = Object.values(progress).some((s) => s === 'error')

    return createPortal(
        <div className="file-modal" role="dialog" aria-modal="true">
            <div className="file-modal__backdrop" />
            <div className="file-modal__panel" style={{ maxWidth: '480px' }}>
                <div className="file-modal__header">
                    <p className="file-modal__title">
                        {isFinished ? (hasErrors ? 'Ocurrieron algunos errores' : '¡Subida completa!') : 'Subiendo archivos...'}
                    </p>
                    {isFinished && (
                        <button type="button" className="file-modal__close" onClick={onClose} aria-label="Cerrar">
                            ×
                        </button>
                    )}
                </div>
                <div className="file-modal__body">
                    <div className="file-list">
                        {files.map((entry) => {
                            const status = progress[entry.id] || 'pending'
                            return (
                                <div key={entry.id} className="file-row">
                                    <div className="file-row__meta">
                                        <span className="file-row__name">{entry.file.name}</span>
                                        <span className="file-row__size">
                                            {status === 'pending' && 'En espera...'}
                                            {status === 'uploading' && `Subiendo ${fileProgress[entry.id] || 0}%...`}
                                            {status === 'success' && 'Completado'}
                                            {status === 'error' && 'Error'}
                                        </span>
                                    </div>
                                    <div className="file-row__status">
                                        {status === 'uploading' && <div className="spinner-sm" />}
                                        {status === 'success' && <span className="icon-success">✓</span>}
                                        {status === 'error' && <span className="icon-error">✕</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                {isFinished && hasErrors && (
                    <div className="file-dropzone__actions" style={{ marginTop: '1rem' }}>
                        <button type="button" className="secondary-button" onClick={onClose}>
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}

export default UploadProgressModal
