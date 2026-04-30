import { Employee } from '../../domain/employee'
import { EmployeeRepository } from '../../domain/repositories/employee.repository'
import { EmployeeStatusValue } from '../../domain/employee-status'
import { SalaryBasisValue } from '../../domain/employee-salary-basis'
import { PaymentFrequencyValue } from '../../domain/employee-payment-frequency'
import { EventBus } from '@/shared/domain/events'

export class CreateEmployee {
  constructor(
    private readonly repository: EmployeeRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    firstName: string,
    lastName: string,
    positionId: string | null,
    phone: string | null,
    email: string | null,
    address: string | null,
    hireDate: Date | null,
    status: EmployeeStatusValue,
    notes: string | null,
    salaryAmount: number | null,
    salaryBasis: SalaryBasisValue | null,
    paymentFrequency: PaymentFrequencyValue | null
  ): Promise<void> {
    const employee = Employee.create(
      id,
      firstName,
      lastName,
      positionId,
      phone,
      email,
      address,
      hireDate,
      status,
      notes,
      salaryAmount,
      salaryBasis,
      paymentFrequency
    )
    await this.repository.save(employee)
    await this.eventBus.publish(employee.pullDomainEvents())
  }
}
