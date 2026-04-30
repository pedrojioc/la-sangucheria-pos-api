export class EmployeeSalaryAmount {
  constructor(public readonly value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Salary amount must be a non-negative integer (in cents)')
    }
  }

  toUnit(): number {
    return this.value / 100
  }
}
