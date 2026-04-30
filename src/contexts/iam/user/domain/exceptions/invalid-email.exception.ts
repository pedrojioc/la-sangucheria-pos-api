import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidEmail extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
