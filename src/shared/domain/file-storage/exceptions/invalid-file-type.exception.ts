import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidFileType extends DomainException {
  constructor(actualType: string, allowedTypes: string[]) {
    super(
      `File type "${actualType}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    )
  }
}
