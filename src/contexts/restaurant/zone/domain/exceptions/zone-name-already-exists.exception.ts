import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class ZoneNameAlreadyExists extends DomainException {
  constructor(name: string) {
    super(`Ya existe una zona con el nombre "${name}"`)
  }
}
