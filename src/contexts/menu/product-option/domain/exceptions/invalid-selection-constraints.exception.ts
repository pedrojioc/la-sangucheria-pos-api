import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class InvalidSelectionConstraints extends DomainException {
  constructor(min: number, max: number) {
    super(`maxSelections (${max}) must be >= minSelections (${min})`)
  }
}
