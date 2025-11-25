export interface PendingUploadFile {
    id: string
    file: File
    previewUrl?: string
}

export interface UploadStatus {
    type: 'success' | 'error'
    message: string
}

export type FileUploadState = 'pending' | 'uploading' | 'success' | 'error'
