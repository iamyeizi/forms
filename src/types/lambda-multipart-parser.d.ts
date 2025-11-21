declare module 'lambda-multipart-parser' {
    export interface MultipartFile {
        filename: string
        content: string | Buffer
        contentType: string
        encoding: string
        fieldname: string
    }

    export interface MultipartBody {
        files?: MultipartFile[]
        [key: string]: unknown
    }

    export function parse(event: unknown): Promise<MultipartBody>

    const _default: {
        parse: typeof parse
    }

    export default _default
}
