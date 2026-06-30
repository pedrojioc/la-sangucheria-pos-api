import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Criteria } from '@shared/domain/criteria/criteria'
import { PaginatedResult } from '@shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

import { OrderQueryService } from '../../application/services/order-query.service'
import { OrderListItem } from '../../application/dto/order-list-item'
import { OrderEntity } from '../persistence/typeorm/order.entity'

@Injectable()
export class TypeOrmOrderQueryService implements OrderQueryService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<OrderListItem>> {
    const converter = new TypeOrmCriteriaConverter<OrderEntity>()
    let queryBuilder = this.repository.createQueryBuilder('order')
    queryBuilder = converter.convert(queryBuilder, criteria, 'order')

    const [entities, total] = await queryBuilder.getManyAndCount()

    const items = entities.map(
      e =>
        new OrderListItem(
          e.id,
          e.orderNumber,
          e.type,
          e.status,
          e.tableId,
          e.customerId,
          Number(e.subtotal),
          Number(e.total),
          e.currency,
          e.openedBy,
          e.openedAt,
          e.closedAt
        )
    )

    return PaginatedResult.create(
      items,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }
}
