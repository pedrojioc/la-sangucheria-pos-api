import { EmployeeRepository } from '../../domain/repositories/employee.repository'
import { EmployeeId } from '../../domain/employee-id'
import { EmployeeNotExist } from '../../domain/exceptions/employee-not-exist.exception'
import { RegisterUser } from '@contexts/iam/user/application/register/register-user'
import { EventBus } from '@/shared/domain/events'

export class GrantEmployeeAccess {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly registerUser: RegisterUser,
    private readonly eventBus: EventBus
  ) {}

  async run(
    employeeId: string,
    userId: string,
    username: string,
    email: string,
    password: string,
    roleId: string
  ): Promise<void> {
    const employee = await this.employeeRepository.search(new EmployeeId(employeeId))
    if (!employee) throw new EmployeeNotExist(employeeId)

    // RegisterUser validates uniqueness, hashes password, saves the User and publishes UserCreatedEvent
    // If it throws (duplicate username/email), we abort before mutating the Employee
    await this.registerUser.run(userId, username, email, password, employee.getFullName(), roleId)

    // Link the new user to the employee and record the domain event
    employee.grantAccess(userId)
    await this.employeeRepository.save(employee)
    await this.eventBus.publish(employee.pullDomainEvents())
  }
}
