import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class InvalidResolucionRange extends InvalidValueObjectException {
  constructor(from: number, to: number) {
    super(`Resolucion range is invalid: from (${from}) must be <= to (${to})`)
    this.name = 'InvalidResolucionRange'
  }
}
