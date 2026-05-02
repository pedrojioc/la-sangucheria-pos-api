import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { CustomerQueryService } from '../../application/services/customer-query.service'
import { CustomerListItem } from '../../application/dto/customer-list-item'
import { CustomerEntity } from '../persistence/typeorm/customer.entity'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

export class TypeOrmCustomerQueryService implements CustomerQueryService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<CustomerListItem>> {
    const converter = new TypeOrmCriteriaConverter<CustomerEntity>()

    let queryBuilder = this.customerRepository.createQueryBuilder('customer')
    queryBuilder = converter.convert(queryBuilder, criteria, 'customer')

    const [items, total] = await queryBuilder.getManyAndCount()
    const customers = items.map(
      row =>
        new CustomerListItem(
          row.id,
          row.name,
          row.phone,
          row.email,
          row.documentType,
          row.documentNumber,
          row.taxRegime,
          row.defaultAddressId,
          row.notes,
          row.status
        )
    )

    return PaginatedResult.create(
      customers,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }
}
