import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class EmployeeNotExist extends DomainException {
  constructor(id: string) {
    super(`Employee with id ${id} does not exist`)
  }
}
