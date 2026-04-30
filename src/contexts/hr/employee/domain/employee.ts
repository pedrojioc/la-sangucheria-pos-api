import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { EmployeeId } from './employee-id'
import { EmployeeFirstName } from './employee-first-name'
import { EmployeeLastName } from './employee-last-name'
import { EmployeePhone } from './employee-phone'
import { EmployeeEmail } from './employee-email'
import { EmployeeAddress } from './employee-address'
import { EmployeeStatus, EmployeeStatusValue } from './employee-status'
import { EmployeeSalary, SalaryPrimitives } from './employee-salary'
import { SalaryBasisValue } from './employee-salary-basis'
import { PaymentFrequencyValue } from './employee-payment-frequency'
import { EmployeeCreatedEvent } from './events/employee-created.event'
import { EmployeeAccessGrantedEvent } from './events/employee-access-granted.event'
import { EmployeeAlreadyHasAccess } from './exceptions/employee-already-has-access.exception'

export interface EmployeePrimitives {
  id: string
  firstName: string
  lastName: string
  positionId: string | null
  phone: string | null
  email: string | null
  address: string | null
  hireDate: Date | null
  status: EmployeeStatusValue
  notes: string | null
  userId: string | null
  salary: SalaryPrimitives | null
}

export class Employee extends AggregateRoot {
  private constructor(
    public readonly id: EmployeeId,
    private firstName: EmployeeFirstName,
    private lastName: EmployeeLastName,
    private positionId: string | null,
    private phone: EmployeePhone | null,
    private email: EmployeeEmail | null,
    private address: EmployeeAddress | null,
    private hireDate: Date | null,
    private status: EmployeeStatus,
    private notes: string | null,
    private userId: string | null,
    private salary: EmployeeSalary | null
  ) {
    super()
  }

  static create(
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
  ): Employee {
    const employee = Employee.fromPrimitives({
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
      userId: null,
      salary:
        salaryAmount !== null && salaryBasis !== null && paymentFrequency !== null
          ? { amount: salaryAmount, basis: salaryBasis, paymentFrequency }
          : null
    })

    employee.record(new EmployeeCreatedEvent({ employeeId: id, firstName, lastName }))

    return employee
  }

  static fromPrimitives(primitives: EmployeePrimitives): Employee {
    return new Employee(
      new EmployeeId(primitives.id),
      new EmployeeFirstName(primitives.firstName),
      new EmployeeLastName(primitives.lastName),
      primitives.positionId,
      primitives.phone !== null ? new EmployeePhone(primitives.phone) : null,
      primitives.email !== null ? new EmployeeEmail(primitives.email) : null,
      primitives.address !== null ? new EmployeeAddress(primitives.address) : null,
      primitives.hireDate,
      new EmployeeStatus(primitives.status),
      primitives.notes,
      primitives.userId,
      primitives.salary !== null ? EmployeeSalary.fromPrimitives(primitives.salary) : null
    )
  }

  update(
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
  ): void {
    this.firstName = new EmployeeFirstName(firstName)
    this.lastName = new EmployeeLastName(lastName)
    this.positionId = positionId
    this.phone = phone !== null ? new EmployeePhone(phone) : null
    this.email = email !== null ? new EmployeeEmail(email) : null
    this.address = address !== null ? new EmployeeAddress(address) : null
    this.hireDate = hireDate
    this.status = new EmployeeStatus(status)
    this.notes = notes
    this.salary =
      salaryAmount !== null && salaryBasis !== null && paymentFrequency !== null
        ? EmployeeSalary.create(salaryAmount, salaryBasis, paymentFrequency)
        : null
  }

  grantAccess(userId: string): void {
    if (this.userId !== null) {
      throw new EmployeeAlreadyHasAccess(this.id.value)
    }
    this.userId = userId
    this.record(new EmployeeAccessGrantedEvent({ employeeId: this.id.value, userId }))
  }

  hasAccess(): boolean {
    return this.userId !== null
  }

  getFullName(): string {
    return `${this.firstName.value} ${this.lastName.value}`
  }

  toPrimitives(): EmployeePrimitives {
    return {
      id: this.id.value,
      firstName: this.firstName.value,
      lastName: this.lastName.value,
      positionId: this.positionId,
      phone: this.phone?.value ?? null,
      email: this.email?.value ?? null,
      address: this.address?.value ?? null,
      hireDate: this.hireDate,
      status: this.status.value,
      notes: this.notes,
      userId: this.userId,
      salary: this.salary?.toPrimitives() ?? null
    }
  }
}
