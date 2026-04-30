import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EmployeeRepository } from '../../../domain/repositories/employee.repository'
import { Employee, EmployeePrimitives } from '../../../domain/employee'
import { EmployeeId } from '../../../domain/employee-id'
import { EmployeeEntity } from './employee.entity'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

function toDomain(entity: EmployeeEntity): Employee {
  return Employee.fromPrimitives({
    id: entity.id,
    firstName: entity.firstName,
    lastName: entity.lastName,
    positionId: entity.positionId,
    phone: entity.phone,
    email: entity.email,
    address: entity.address,
    hireDate: entity.hireDate,
    status: entity.status,
    notes: entity.notes,
    userId: entity.userId,
    salary:
      entity.salaryAmount !== null && entity.salaryBasis !== null && entity.paymentFrequency !== null
        ? {
            amount: Number(entity.salaryAmount),
            basis: entity.salaryBasis,
            paymentFrequency: entity.paymentFrequency
          }
        : null
  })
}

function toEntity(primitives: EmployeePrimitives): Partial<EmployeeEntity> {
  return {
    id: primitives.id,
    firstName: primitives.firstName,
    lastName: primitives.lastName,
    positionId: primitives.positionId,
    phone: primitives.phone,
    email: primitives.email,
    address: primitives.address,
    hireDate: primitives.hireDate,
    status: primitives.status,
    notes: primitives.notes,
    userId: primitives.userId,
    salaryAmount: primitives.salary?.amount ?? null,
    salaryBasis: primitives.salary?.basis ?? null,
    paymentFrequency: primitives.salary?.paymentFrequency ?? null
  }
}

@Injectable()
export class TypeOrmEmployeeRepository implements EmployeeRepository {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly repository: Repository<EmployeeEntity>
  ) {}

  async save(employee: Employee): Promise<void> {
    await this.repository.save(toEntity(employee.toPrimitives()))
  }

  async search(id: EmployeeId): Promise<Employee | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value },
      relations: { position: true }
    })
    return entity ? toDomain(entity) : null
  }

  async delete(id: EmployeeId): Promise<void> {
    await this.repository.delete({ id: id.value })
  }

  async matching(criteria: Criteria): Promise<PaginatedResult<Employee>> {
    const queryBuilder = this.repository.createQueryBuilder('employee')

    const converter = new TypeOrmCriteriaConverter()
    converter.convert(queryBuilder, criteria, 'employee')

    const [entities, total] = await queryBuilder.getManyAndCount()
    const employees = entities.map(toDomain)

    return PaginatedResult.create(
      employees,
      total,
      criteria.pagination?.page || 1,
      criteria.pagination?.pageSize || 20
    )
  }
}
