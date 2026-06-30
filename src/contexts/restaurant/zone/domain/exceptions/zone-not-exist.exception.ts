import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class ZoneNotExist extends DomainException {
  constructor(id: string) {
    super(`La zona con id ${id} no existe`)
  }
}
