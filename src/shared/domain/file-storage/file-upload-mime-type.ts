import { StringValueObject } from '@/shared/domain/value-objects/string'

export class FileUploadMimeType extends StringValueObject {
  constructor(value: string) {
    super(value)
  }
}
