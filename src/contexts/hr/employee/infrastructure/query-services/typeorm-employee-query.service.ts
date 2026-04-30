import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EmployeeEntity } from '../persistence/typeorm/employee.entity'
import { EmployeeQueryService } from '../../application/services/employee-query.service'
import { EmployeeResponse } from '../../application/dto/employee.response'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

@Injectable()
export class TypeOrmEmployeeQueryService implements EmployeeQueryService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly repository: Repository<EmployeeEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<EmployeeResponse>> {
    const qb = this.repository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.position', 'position')

    const converter = new TypeOrmCriteriaConverter()
    converter.convert(qb, criteria, 'employee')

    const [entities, total] = await qb.getManyAndCount()

    const items: EmployeeResponse[] = entities.map(
      entity =>
        new EmployeeResponse(
          entity.id,
          entity.firstName,
          entity.lastName,
          entity.position
            ? {
                id: entity.position.id,
                name: entity.position.name,
                description: entity.position.description
              }
            : null,
          entity.phone,
          entity.email,
          entity.address,
          entity.hireDate,
          entity.status,
          entity.notes,
          entity.userId,
          entity.salaryAmount !== null &&
          entity.salaryBasis !== null &&
          entity.paymentFrequency !== null
            ? {
                amount: Number(entity.salaryAmount),
                basis: entity.salaryBasis,
                paymentFrequency: entity.paymentFrequency
              }
            : null
        )
    )

    return PaginatedResult.create(
      items,
      total,
      criteria.pagination?.page || 1,
      criteria.pagination?.pageSize || 20
    )
  }
}
