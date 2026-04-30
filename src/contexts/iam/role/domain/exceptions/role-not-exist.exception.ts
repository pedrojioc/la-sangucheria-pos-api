import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class RoleNotExist extends DomainException {
  constructor(id: string) {
    super(`Role with id ${id} does not exist`)
  }
}
