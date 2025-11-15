import { FileUpload } from '../file-upload'
import { UploadedFile } from '../uploaded-file'

/**
 * File Storage Repository Interface (Domain)
 *
 * This interface defines the contract for file storage operations.
 * Infrastructure layer implements this interface (Cloudflare, Local, etc.)
 *
 * This is an abstract class (not interface) to allow it to be used as a DI token.
 */
export abstract class FileStorageRepository {
  abstract upload(file: FileUpload): Promise<UploadedFile>

  abstract delete(storageKey: string): Promise<void>

  abstract getPublicUrl(storageKey: string, variant?: string): string
}
