import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class EmployeeAlreadyHasAccess extends DomainException {
  constructor(employeeId: string) {
    super(`Employee ${employeeId} already has system access. Revoke it first.`)
  }
}
