import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class PositionNotExist extends DomainException {
  constructor(id: string) {
    super(`Position with id ${id} does not exist`)
  }
}
