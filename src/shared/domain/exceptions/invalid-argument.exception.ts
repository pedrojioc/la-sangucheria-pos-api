import { DomainException } from './domain.exception'

export class InvalidArgument extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
