import classNames from 'classnames'
import type { UploadStatus } from '@/types/uploads'

interface StatusBannerProps {
    status: UploadStatus | null
}

const StatusBanner = ({ status }: StatusBannerProps) => {
    if (!status) return null

    return (
        <div
            className={classNames('status-banner', {
                'status-banner--success': status.type === 'success',
                'status-banner--error': status.type === 'error',
            })}
            role={status.type === 'error' ? 'alert' : 'status'}
        >
            {status.message}
        </div>
    )
}

export default StatusBanner
