import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class UnitNotExist extends DomainException {
  constructor(id: string) {
    super(`Unit with id ${id} does not exist`)
  }
}
