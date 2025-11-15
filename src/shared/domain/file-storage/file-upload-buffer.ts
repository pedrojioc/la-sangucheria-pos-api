import { InvalidArgument } from '../exceptions/invalid-argument.exception'

export class FileUploadBuffer {
  readonly value: Buffer

  constructor(buffer: Buffer) {
    this.value = buffer
    this.ensureBufferIsNotEmpty(buffer)
  }

  private ensureBufferIsNotEmpty(buffer: Buffer): void {
    if (this.value.length === 0) {
      throw new InvalidArgument('Buffer cannot be empty')
    }
  }
}
