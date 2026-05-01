import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CustomerRepository } from '../../../domain/repositories/customer.repository'
import { Customer, CustomerPrimitives } from '../../../domain/customer'
import { CustomerId } from '../../../domain/customer-id'
import { CustomerEntity } from './customer.entity'
import { DocumentTypeValue } from '../../../domain/customer-document-type'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

function toDomain(entity: CustomerEntity): Customer {
  return Customer.fromPrimitives({
    id: entity.id,
    name: entity.name,
    phone: entity.phone,
    email: entity.email,
    documentType: entity.documentType,
    documentNumber: entity.documentNumber,
    taxRegime: entity.taxRegime,
    defaultAddressId: entity.defaultAddressId,
    notes: entity.notes,
    status: entity.status
  })
}

function toEntity(primitives: CustomerPrimitives): Partial<CustomerEntity> {
  return {
    id: primitives.id,
    name: primitives.name,
    phone: primitives.phone,
    email: primitives.email,
    documentType: primitives.documentType,
    documentNumber: primitives.documentNumber,
    taxRegime: primitives.taxRegime,
    defaultAddressId: primitives.defaultAddressId,
    notes: primitives.notes,
    status: primitives.status
  }
}

@Injectable()
export class TypeOrmCustomerRepository implements CustomerRepository {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly repository: Repository<CustomerEntity>
  ) {}

  async save(customer: Customer): Promise<void> {
    await this.repository.save(toEntity(customer.toPrimitives()))
  }

  async search(id: CustomerId): Promise<Customer | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    return entity ? toDomain(entity) : null
  }

  async searchByPhone(phone: string): Promise<Customer[]> {
    const entities = await this.repository
      .createQueryBuilder('customer')
      .where('customer.phone ILIKE :phone', { phone: `%${phone}%` })
      .andWhere('customer.status = :status', { status: 'active' })
      .orderBy('customer.name', 'ASC')
      .limit(5)
      .getMany()

    return entities.map(toDomain)
  }

  async existsByPhone(phone: string): Promise<boolean> {
    const count = await this.repository.count({ where: { phone } })
    return count > 0
  }

  async existsByDocument(type: DocumentTypeValue, number: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { documentType: type, documentNumber: number }
    })
    return count > 0
  }

  async matching(criteria: Criteria): Promise<PaginatedResult<Customer>> {
    const queryBuilder = this.repository.createQueryBuilder('customer')

    const converter = new TypeOrmCriteriaConverter()
    converter.convert(queryBuilder, criteria, 'customer')

    const [entities, total] = await queryBuilder.getManyAndCount()
    const customers = entities.map(toDomain)

    return PaginatedResult.create(
      customers,
      total,
      criteria.pagination?.page || 1,
      criteria.pagination?.pageSize || 20
    )
  }
}
