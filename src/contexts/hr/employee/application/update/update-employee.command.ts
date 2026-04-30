import { EmployeeStatusValue } from '../../domain/employee-status'
import { SalaryBasisValue } from '../../domain/employee-salary-basis'
import { PaymentFrequencyValue } from '../../domain/employee-payment-frequency'

export class UpdateEmployeeCommand {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly positionId: string | null,
    public readonly phone: string | null,
    public readonly email: string | null,
    public readonly address: string | null,
    public readonly hireDate: Date | null,
    public readonly status: EmployeeStatusValue,
    public readonly notes: string | null,
    public readonly salaryAmount: number | null,
    public readonly salaryBasis: SalaryBasisValue | null,
    public readonly paymentFrequency: PaymentFrequencyValue | null
  ) {}
}
