import { FileUpload } from '@/shared/domain/file-storage/file-upload'
import { FileUploadBuffer } from '@/shared/domain/file-storage/file-upload-buffer'
import { FileUploadName } from '@/shared/domain/file-storage/file-upload-name'
import { FileUploadMimeType } from '@/shared/domain/file-storage/file-upload-mime-type'
import { FileUploadSize } from '@/shared/domain/file-storage/file-upload-size'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class ProductImageUpload extends FileUpload {
  constructor(
    public readonly buffer: FileUploadBuffer,
    public readonly originalName: FileUploadName,
    public readonly mimeType: FileUploadMimeType,
    public readonly size: FileUploadSize
  ) {
    super(buffer, originalName, mimeType, size)
    this.ensureIsImage()
    this.ensureImageSizeIsLessThan2MB()
  }

  ensureIsImage(): void {
    if (!this.mimeType.value.startsWith('image/')) {
      throw new InvalidArgument('File is not an image')
    }
  }

  ensureImageSizeIsLessThan2MB(): void {
    if (this.size.value > 2 * 1024 * 1024) {
      throw new InvalidArgument('Image size must be less than 2MB')
    }
  }
}
