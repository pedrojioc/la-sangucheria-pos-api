import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidPasswordHash extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
