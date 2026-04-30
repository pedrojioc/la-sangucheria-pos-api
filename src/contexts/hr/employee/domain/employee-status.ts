export const EMPLOYEE_STATUSES = ['active', 'inactive', 'on_break', 'on_vacation'] as const
export type EmployeeStatusValue = (typeof EMPLOYEE_STATUSES)[number]

export class EmployeeStatus {
  constructor(public readonly value: EmployeeStatusValue) {
    if (!EMPLOYEE_STATUSES.includes(value)) {
      throw new Error(
        `Invalid employee status: ${value}. Valid values: ${EMPLOYEE_STATUSES.join(', ')}`
      )
    }
  }
}
