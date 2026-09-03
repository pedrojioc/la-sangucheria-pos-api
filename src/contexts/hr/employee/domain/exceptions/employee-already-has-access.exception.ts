import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class EmployeeAlreadyHasAccess extends BusinessRuleViolationException {
  constructor(employeeId: string) {
    super(`Employee ${employeeId} already has system access. Revoke it first.`)
  }
}
