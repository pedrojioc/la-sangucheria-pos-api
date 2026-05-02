import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { SupplierQueryService } from '../../application/services/supplier-query.service'
import { SupplierListItem } from '../../application/dto/supplier-list-item'
import { SupplierEntity } from '../persistence/typeorm/supplier.entity'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

export class TypeOrmSupplierQueryService implements SupplierQueryService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<SupplierListItem>> {
    const converter = new TypeOrmCriteriaConverter<SupplierEntity>()

    let queryBuilder = this.supplierRepository.createQueryBuilder('supplier')
    queryBuilder = converter.convert(queryBuilder, criteria, 'supplier')

    const [items, total] = await queryBuilder.getManyAndCount()
    const suppliers = items.map(
      row =>
        new SupplierListItem(
          row.id,
          row.name,
          row.contactName,
          row.email,
          row.phone,
          row.whatsappNumber,
          row.address,
          row.taxId,
          row.paymentTerms,
          row.notes,
          row.rating,
          row.isActive
        )
    )

    return PaginatedResult.create(
      suppliers,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }
}
