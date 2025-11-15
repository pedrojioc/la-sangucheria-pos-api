import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import {
  CloudflareImagesUploadResponse,
  CloudflareImagesDeleteResponse
} from './cloudflare-images-api.types'
import { FileStorageRepository, FileUpload, UploadedFile } from '@/shared/domain/file-storage'
import { CloudflareUploadException } from '../exceptions/cloudflare-upload.exception'
import { FileStorageException } from '../exceptions/file-storage.exception'

/**
 * Cloudflare Images storage implementation.
 *
 * This adapter implements the FileStorage domain interface using Cloudflare Images API.
 * It translates domain concepts to Cloudflare-specific API calls.
 *
 * API Documentation: https://developers.cloudflare.com/images/
 */
@Injectable()
export class CloudflareImagesStorage implements FileStorageRepository {
  private readonly logger = new Logger(CloudflareImagesStorage.name)
  private readonly accountId: string
  private readonly apiToken: string
  private readonly accountHash: string
  private readonly baseUrl: string

  constructor(private readonly configService: ConfigService) {
    this.accountId = this.configService.getOrThrow<string>('CLOUDFLARE_ACCOUNT_ID')
    this.apiToken = this.configService.getOrThrow<string>('CLOUDFLARE_IMAGES_API_TOKEN')
    this.accountHash = this.configService.getOrThrow<string>('CLOUDFLARE_IMAGES_ACCOUNT_HASH')
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`

    this.logger.log('Cloudflare Images storage initialized')
  }

  async upload(file: FileUpload, options?: Record<string, unknown>): Promise<UploadedFile> {
    const primitives = file.toPrimitives()
    try {
      const formData = new FormData()
      // Convert Node.js Buffer to Uint8Array for Blob compatibility
      const uint8Array = new Uint8Array(primitives.buffer)
      const blob = new Blob([uint8Array], { type: primitives.mimeType })
      formData.append('file', blob, primitives.originalName)

      if (options?.requireSignedURLs !== undefined) {
        formData.append('requireSignedURLs', String(options.requireSignedURLs))
      }

      if (options?.metadata) {
        formData.append('metadata', JSON.stringify(options.metadata))
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.errors?.[0]?.message || response.statusText
        throw new CloudflareUploadException(
          `Cloudflare upload failed: ${errorMessage}`,
          response.status
        )
      }

      const data = await response.json()

      if (!data.success) {
        const errorMessage = data.errors?.[0]?.message || 'Unknown error from Cloudflare API'
        throw new CloudflareUploadException(errorMessage)
      }

      // 4. Adapt Cloudflare response to domain VO
      const uploadedFile = this.adaptCloudflareResponseToDomain(data, file)

      return uploadedFile
    } catch (error) {
      if (error instanceof CloudflareUploadException) {
        throw error
      }

      this.logger.error(`Failed to upload file: ${error.message}`, error.stack)

      throw new FileStorageException(`Failed to upload file: ${error.message}`, error)
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      this.logger.log(`Deleting image from Cloudflare: ${storageKey}`)

      const response = await fetch(`${this.baseUrl}/${storageKey}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.apiToken}`
        }
      })

      if (!response.ok) {
        const errorData = (await response.json()) as CloudflareImagesDeleteResponse
        const errorMessage = errorData.errors?.[0]?.message || response.statusText
        this.logger.warn(`Failed to delete image ${storageKey}: ${errorMessage}`)
        // Don't throw - deletion failures shouldn't break the main operation
        return
      }

      const data = (await response.json()) as CloudflareImagesDeleteResponse

      if (!data.success) {
        const errorMessage = data.errors?.[0]?.message || 'Unknown error'
        this.logger.warn(`Failed to delete image ${storageKey}: ${errorMessage}`)
        // Don't throw - deletion failures shouldn't break the main operation
        return
      }

      this.logger.log(`Image deleted successfully: ${storageKey}`)
    } catch (error) {
      this.logger.error(`Error deleting image ${storageKey}: ${error.message}`)
      // Don't throw - deletion failures shouldn't break the main operation
    }
  }

  getPublicUrl(storageKey: string, variant: string = 'public'): string {
    // Cloudflare Images URL format: https://imagedelivery.net/{account_hash}/{image_id}/{variant}
    return `https://imagedelivery.net/${this.accountHash}/${storageKey}/${variant}`
  }

  /**
   * Adapt Cloudflare API response to domain VO
   * This is where infrastructure concerns are translated to domain concepts
   */
  private adaptCloudflareResponseToDomain(
    response: CloudflareImagesUploadResponse,
    originalFile: FileUpload
  ): UploadedFile {
    // Use the 'public' variant as the main URL
    const publicUrl = this.getPublicUrl(response.result.id, 'public')

    return new UploadedFile(
      response.result.id, // storageKey (Cloudflare Image ID)
      publicUrl, // publicUrl
      response.result.filename, // fileName
      originalFile.size.value, // sizeInBytes
      originalFile.mimeType.value, // mimeType
      new Date(response.result.uploaded) // uploadedAt
    )
  }

  /**
   * Get URL for a specific variant (e.g., thumbnail)
   * This is an extra method specific to Cloudflare, not in the domain interface
   */
  getThumbnailUrl(storageKey: string): string {
    return this.getPublicUrl(storageKey, 'thumbnail')
  }
}
