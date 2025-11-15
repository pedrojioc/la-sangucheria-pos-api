import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class FileUploadFailed extends DomainException {
  constructor(message: string) {
    super(`File upload failed: ${message}`)
  }
}
