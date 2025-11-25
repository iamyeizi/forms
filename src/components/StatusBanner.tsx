import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'
import type { UploadStatus } from '@/types/uploads'

interface StatusBannerProps {
    status: UploadStatus | null
    onDismiss: () => void
}

const StatusBanner = ({ status, onDismiss }: StatusBannerProps) => {
    useEffect(() => {
        if (!status || status.type !== 'success') return

        const timer = window.setTimeout(onDismiss, 4000)
        return () => window.clearTimeout(timer)
    }, [status, onDismiss])

    if (!status) return null

    return createPortal(
        <div className="status-modal" role="dialog" aria-modal="true">
            <div className="status-modal__backdrop" onClick={onDismiss} />
            <div
                className={classNames('status-modal__content', {
                    'status-modal__content--success': status.type === 'success',
                    'status-modal__content--error': status.type === 'error',
                })}
            >
                {status.type === 'success' && (
                    <div className="checkmark-circle">
                        <div className="checkmark"></div>
                    </div>
                )}
                <p className="status-modal__message">{status.message}</p>
            </div>
        </div>,
        document.body,
    )
}

export default StatusBanner
