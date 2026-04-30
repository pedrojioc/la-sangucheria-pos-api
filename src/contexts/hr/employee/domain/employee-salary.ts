import { EmployeeSalaryAmount } from './employee-salary-amount'
import { EmployeeSalaryBasis, SalaryBasisValue } from './employee-salary-basis'
import { EmployeePaymentFrequency, PaymentFrequencyValue } from './employee-payment-frequency'

export interface SalaryPrimitives {
  amount: number
  basis: SalaryBasisValue
  paymentFrequency: PaymentFrequencyValue
}

export class EmployeeSalary {
  private constructor(
    public readonly amount: EmployeeSalaryAmount,
    public readonly basis: EmployeeSalaryBasis,
    public readonly paymentFrequency: EmployeePaymentFrequency
  ) {}

  static create(
    amount: number,
    basis: SalaryBasisValue,
    paymentFrequency: PaymentFrequencyValue
  ): EmployeeSalary {
    return new EmployeeSalary(
      new EmployeeSalaryAmount(amount),
      new EmployeeSalaryBasis(basis),
      new EmployeePaymentFrequency(paymentFrequency)
    )
  }

  static fromPrimitives(primitives: SalaryPrimitives): EmployeeSalary {
    return EmployeeSalary.create(primitives.amount, primitives.basis, primitives.paymentFrequency)
  }

  toPrimitives(): SalaryPrimitives {
    return {
      amount: this.amount.value,
      basis: this.basis.value,
      paymentFrequency: this.paymentFrequency.value
    }
  }
}
