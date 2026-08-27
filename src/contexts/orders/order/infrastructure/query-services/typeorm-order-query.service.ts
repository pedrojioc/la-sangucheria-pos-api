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
    let queryBuilder = this.repository
      .createQueryBuilder('order')
      .leftJoin('tables', 'table', 'table.id = order.table_id')
      .addSelect('table.number', 'table_number')
    queryBuilder = converter.convert(queryBuilder, criteria, 'order')

    const { entities, raw } = await queryBuilder.getRawAndEntities()
    const total = await queryBuilder.getCount()

    const items = entities.map((e, index) => {
      const tableLabel = (raw[index]?.table_number as string | undefined) ?? null

      return new OrderListItem(
        e.id,
        e.orderNumber,
        e.type,
        e.status,
        e.tableId,
        tableLabel,
        e.customerId,
        Number(e.subtotal),
        Number(e.total),
        e.currency,
        e.openedBy,
        e.openedAt,
        e.closedAt
      )
    })

    return PaginatedResult.create(
      items,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }
}
