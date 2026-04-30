import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { promises as fs } from 'fs'
import { join } from 'path'
import { FileStorageRepository, FileUpload, UploadedFile } from '@/shared/domain/file-storage'
import { LocalStorageException } from '../exceptions/local-storage.exception'
import { FileStorageException } from '../exceptions/file-storage.exception'

/**
 * Local file storage implementation for development and testing.
 *
 * This adapter stores files in the local filesystem.
 * It's useful for development environments where you don't want to use Cloudflare.
 *
 * Files are stored in: uploads/{folder}/
 */
@Injectable()
export class LocalFileStorage implements FileStorageRepository {
  private readonly logger = new Logger(LocalFileStorage.name)
  private readonly uploadsDir: string
  private readonly baseUrl: string

  constructor(private readonly configService: ConfigService) {
    this.uploadsDir = this.configService.get<string>('LOCAL_UPLOADS_DIR', 'uploads')
    const port = this.configService.get<string>('PORT', '3000')
    this.baseUrl = this.configService.get<string>('LOCAL_UPLOADS_URL', `http://localhost:${port}`)

    this.ensureUploadsDirExists()
    this.logger.log(`Local file storage initialized (dir: ${this.uploadsDir})`)
  }

  async upload(file: FileUpload): Promise<UploadedFile> {
    const primitives = file.toPrimitives()

    try {
      // 1. Generate unique filename
      const storageKey = this.generateStorageKey(file)
      const filePath = join(this.uploadsDir, storageKey)

      // 2. Ensure directory exists
      const directory = join(this.uploadsDir, storageKey.split('/')[0])
      await fs.mkdir(directory, { recursive: true })

      // 3. Write file to disk
      this.logger.log(
        `Saving file locally: ${storageKey} (${this.formatFileSize(primitives.size)})`
      )
      await fs.writeFile(filePath, primitives.buffer)

      // 4. Create public URL
      const publicUrl = this.getPublicUrl(storageKey)

      const uploadedFile = new UploadedFile(
        storageKey, // storageKey (path in filesystem)
        publicUrl, // publicUrl
        primitives.originalName, // fileName
        primitives.size, // sizeInBytes
        primitives.mimeType, // mimeType
        new Date() // uploadedAt
      )

      this.logger.log(`File saved successfully: ${storageKey}`)

      return uploadedFile
    } catch (error) {
      // If already a known infrastructure exception, re-throw
      if (error instanceof LocalStorageException) {
        throw error
      }

      this.logger.error(`Failed to save file locally: ${error.message}`, error.stack)

      // Wrap as infrastructure exception
      throw new FileStorageException(`Failed to save file locally: ${error.message}`, error)
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      const filePath = join(this.uploadsDir, storageKey)

      this.logger.log(`Deleting local file: ${storageKey}`)

      await fs.unlink(filePath)

      this.logger.log(`File deleted successfully: ${storageKey}`)
    } catch (error) {
      this.logger.warn(`Failed to delete file ${storageKey}: ${error.message}`)
      // Don't throw - deletion failures shouldn't break the main operation
    }
  }

  getPublicUrl(storageKey: string, variant?: string): string {
    // Local storage doesn't support variants, ignore the parameter
    return `${this.baseUrl}/${this.uploadsDir}/${storageKey}`
  }

  /**
   * Generate unique storage key (path) for the file
   */
  private generateStorageKey(file: FileUpload): string {
    const primitives = file.toPrimitives()
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(7)
    const extension = this.getFileExtension(primitives.originalName)
    const filename = `${timestamp}-${randomSuffix}${extension ? `.${extension}` : ''}`

    // Store in a subdirectory based on file type
    const folder = primitives.mimeType.startsWith('image/') ? 'images' : 'files'

    return `${folder}/${filename}`
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string | null {
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1] : null
  }

  /**
   * Format file size for logging
   */
  private formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)}MB`
  }

  /**
   * Ensure uploads directory exists
   */
  private ensureUploadsDirExists(): void {
    fs.mkdir(this.uploadsDir, { recursive: true }).catch(error => {
      this.logger.error(`Failed to create uploads directory: ${error.message}`)
    })
  }
}
