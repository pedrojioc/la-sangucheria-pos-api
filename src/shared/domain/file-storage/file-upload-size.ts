import { NumberValueObject } from '../value-objects/number'

export class FileUploadSize extends NumberValueObject {
  constructor(value: number) {
    super(value)
    this.ensureFileSizeIsGreaterThanZero(value)
  }

  private ensureFileSizeIsGreaterThanZero(value: number) {
    if (value <= 0) {
      throw new Error('File size must be greater than zero')
    }
  }
}
