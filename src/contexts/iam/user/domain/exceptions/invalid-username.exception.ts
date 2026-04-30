import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidUsername extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
