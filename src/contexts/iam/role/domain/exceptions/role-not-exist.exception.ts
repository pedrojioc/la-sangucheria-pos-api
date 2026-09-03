import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'

export class RoleNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Role with id ${id} does not exist`)
  }
}
