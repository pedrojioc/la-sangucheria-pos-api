import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class StationNameAlreadyExists extends DomainException {
  constructor(name: string) {
    super(`A station with the name "${name}" already exists`)
  }
}
