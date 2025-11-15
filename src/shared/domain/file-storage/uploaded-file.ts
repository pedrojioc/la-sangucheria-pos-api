export interface UploadedFilePrimitives {
  storageKey: string
  publicUrl: string
  fileName: string
  sizeInBytes: number
  mimeType: string
  uploadedAt: Date
}

export class UploadedFile {
  constructor(
    public readonly storageKey: string,
    public readonly publicUrl: string,
    public readonly fileName: string,
    public readonly sizeInBytes: number,
    public readonly mimeType: string,
    public readonly uploadedAt: Date
  ) {}

  isImage(): boolean {
    return this.mimeType.startsWith('image/')
  }

  /**
   * Get file size in megabytes
   */
  getSizeInMB(): number {
    return this.sizeInBytes / (1024 * 1024)
  }

  toPrimitives(): UploadedFilePrimitives {
    return {
      storageKey: this.storageKey,
      publicUrl: this.publicUrl,
      fileName: this.fileName,
      sizeInBytes: this.sizeInBytes,
      mimeType: this.mimeType,
      uploadedAt: this.uploadedAt
    }
  }
}
