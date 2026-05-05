import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { CustomerQueryService } from '../../application/services/customer-query.service'
import { CustomerListItem, DefaultAddressData } from '../../application/dto/customer-list-item'
import { CustomerEntity } from '../persistence/typeorm/customer.entity'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

type CustomerRow = CustomerEntity & {
  addr_id: string | null
  addr_label: string | null
  addr_street: string | null
  addr_neighborhood: string | null
  addr_city: string | null
  addr_reference: string | null
  addr_lat: number | null
  addr_lng: number | null
  loyalty_points: string | null
}

export class TypeOrmCustomerQueryService implements CustomerQueryService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<CustomerListItem>> {
    const converter = new TypeOrmCriteriaConverter<CustomerEntity>()

    let queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('addresses', 'addr', 'addr.id = customer.default_address_id')
      .addSelect('addr.id', 'addr_id')
      .addSelect('addr.label', 'addr_label')
      .addSelect('addr.street', 'addr_street')
      .addSelect('addr.neighborhood', 'addr_neighborhood')
      .addSelect('addr.city', 'addr_city')
      .addSelect('addr.reference', 'addr_reference')
      .addSelect('addr.lat', 'addr_lat')
      .addSelect('addr.lng', 'addr_lng')
      .leftJoin('loyalty_accounts', 'loyalty', 'loyalty.customer_id = customer.id')
      .addSelect('loyalty.points', 'loyalty_points')

    queryBuilder = converter.convert(queryBuilder, criteria, 'customer')

    const { entities, raw: rawRows } = await queryBuilder.getRawAndEntities()
    const total = await queryBuilder.getCount()
    const customers = entities.map((row: CustomerEntity, i: number) => {
      const raw = rawRows[i] as CustomerRow
      const defaultAddress: DefaultAddressData | null = raw.addr_id
        ? {
            id: raw.addr_id,
            label: raw.addr_label!,
            street: raw.addr_street!,
            neighborhood: raw.addr_neighborhood,
            city: raw.addr_city!,
            reference: raw.addr_reference,
            lat: raw.addr_lat,
            lng: raw.addr_lng
          }
        : null

      return new CustomerListItem(
        row.id,
        row.name,
        row.phone,
        row.email,
        row.documentType,
        row.documentNumber,
        row.taxRegime,
        row.defaultAddressId,
        defaultAddress,
        Number(row.lifetimeValue),
        raw.loyalty_points !== null ? Number(raw.loyalty_points) : 0,
        row.notes,
        row.status
      )
    })

    return PaginatedResult.create(
      customers,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }
}
