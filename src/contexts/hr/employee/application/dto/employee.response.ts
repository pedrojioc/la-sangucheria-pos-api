import { EmployeeStatusValue } from '../../domain/employee-status'
import { SalaryBasisValue } from '../../domain/employee-salary-basis'
import { PaymentFrequencyValue } from '../../domain/employee-payment-frequency'

export interface PositionData {
  id: string
  name: string
  description: string | null
}

export interface SalaryData {
  amount: number
  basis: SalaryBasisValue
  paymentFrequency: PaymentFrequencyValue
}

export class EmployeeResponse {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly position: PositionData | null,
    public readonly phone: string | null,
    public readonly email: string | null,
    public readonly address: string | null,
    public readonly hireDate: Date | null,
    public readonly status: EmployeeStatusValue,
    public readonly notes: string | null,
    public readonly userId: string | null,
    public readonly salary: SalaryData | null
  ) {}
}
