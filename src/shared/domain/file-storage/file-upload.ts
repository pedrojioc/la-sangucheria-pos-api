import { FileUploadBuffer } from './file-upload-buffer'
import { FileUploadName } from './file-upload-name'
import { FileUploadMimeType } from './file-upload-mime-type'
import { FileUploadSize } from './file-upload-size'

export interface FileUploadPrimitives {
  buffer: Buffer
  originalName: string
  mimeType: string
  size: number
}

export class FileUpload {
  constructor(
    public readonly buffer: FileUploadBuffer,
    public readonly originalName: FileUploadName,
    public readonly mimeType: FileUploadMimeType,
    public readonly size: FileUploadSize
  ) {}

  static fromUploadedFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    size: number
  ): FileUpload {
    return new FileUpload(
      new FileUploadBuffer(buffer),
      new FileUploadName(originalName),
      new FileUploadMimeType(mimeType),
      new FileUploadSize(size)
    )
  }

  toPrimitives(): FileUploadPrimitives {
    return {
      buffer: this.buffer.value,
      originalName: this.originalName.value,
      mimeType: this.mimeType.value,
      size: this.size.value
    }
  }
}
