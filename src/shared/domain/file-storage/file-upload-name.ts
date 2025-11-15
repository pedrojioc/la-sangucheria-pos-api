import { StringValueObject } from '@/shared/domain/value-objects/string'

export class FileUploadName extends StringValueObject {
  constructor(value: string) {
    super(value)
  }
}
