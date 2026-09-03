import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class InvalidSelectionConstraints extends InvalidValueObjectException {
  constructor(min: number, max: number) {
    super(`maxSelections (${max}) must be >= minSelections (${min})`)
  }
}
