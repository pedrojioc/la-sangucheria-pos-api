import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'

export class EmployeeNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Employee with id ${id} does not exist`)
  }
}
