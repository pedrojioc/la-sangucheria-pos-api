export const SALARY_BASES = ['daily', 'biweekly', 'monthly'] as const
export type SalaryBasisValue = (typeof SALARY_BASES)[number]

export class EmployeeSalaryBasis {
  constructor(public readonly value: SalaryBasisValue) {
    if (!SALARY_BASES.includes(value)) {
      throw new Error(`Invalid salary basis: ${value}. Valid values: ${SALARY_BASES.join(', ')}`)
    }
  }
}
