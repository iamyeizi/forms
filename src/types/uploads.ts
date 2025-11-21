export interface PendingUploadFile {
    id: string
    file: File
    previewUrl?: string
}

export interface UploadStatus {
    type: 'success' | 'error'
    message: string
}
