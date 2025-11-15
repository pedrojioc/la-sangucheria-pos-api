import { FileUpload } from '@/shared/domain/file-storage/file-upload'
import { FileStorageRepository } from '@/shared/domain/file-storage/repositories/file-storage.repository'
import { UploadedFile } from '@/shared/domain/file-storage/uploaded-file'

export class FileUploader {
  constructor(private readonly fileStorageRepository: FileStorageRepository) {}

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    size: number
  ): Promise<UploadedFile> {
    const file = FileUpload.fromUploadedFile(buffer, originalName, mimeType, size)
    return this.fileStorageRepository.upload(file)
  }
}
