import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TableEntity } from '../persistence/typeorm/table.entity'
import { TableQueryService } from '../../application/services/table-query.service'
import {
  TableWithOrderResponse,
  CurrentOrderSummary
} from '../../application/dto/table-with-order.response'

@Injectable()
export class TypeOrmTableQueryService implements TableQueryService {
  constructor(
    @InjectRepository(TableEntity)
    private readonly repository: Repository<TableEntity>
  ) {}

  async searchAllWithOrders(): Promise<TableWithOrderResponse[]> {
    const rows = await this.repository
      .createQueryBuilder('table')
      .leftJoin('orders', 'o', 'o.id = table.current_order_id')
      .leftJoin('order_items', 'i', 'i.order_id = o.id AND i.status != :cancelledStatus', {
        cancelledStatus: 'CANCELLED'
      })
      .select([
        'table.id AS "id"',
        'table.number AS "number"',
        'table.capacity AS "capacity"',
        'table.status AS "status"',
        'table.shape AS "shape"',
        'table.current_order_id AS "currentOrderId"',
        'table.zone_id AS "zoneId"',
        'table.position_x AS "positionX"',
        'table.position_y AS "positionY"',
        'table.rotation AS "rotation"',
        'o.id AS "orderId"',
        'o.order_number AS "orderNumber"',
        'o.status AS "orderStatus"',
        'o.type AS "orderType"',
        'o.subtotal AS "orderSubtotal"',
        'o.total AS "orderTotal"',
        'o.opened_at AS "orderOpenedAt"',
        'COUNT(i.id) AS "activeItemCount"'
      ])
      .groupBy('table.id, o.id')
      .orderBy('table.number', 'ASC')
      .getRawMany()

    return rows.map(row => {
      const response = new TableWithOrderResponse()
      response.id = row.id
      response.number = row.number
      response.capacity = row.capacity
      response.status = row.status
      response.shape = row.shape
      response.currentOrderId = row.currentOrderId
      response.zoneId = row.zoneId
      response.positionX = row.positionX !== null ? Number(row.positionX) : null
      response.positionY = row.positionY !== null ? Number(row.positionY) : null
      response.rotation = row.rotation

      if (row.orderId) {
        const order: CurrentOrderSummary = {
          id: row.orderId,
          orderNumber: row.orderNumber,
          status: row.orderStatus,
          type: row.orderType,
          subtotal: Number(row.orderSubtotal),
          total: Number(row.orderTotal),
          openedAt: row.orderOpenedAt,
          itemCount: Number(row.activeItemCount)
        }
        response.currentOrder = order
      } else {
        response.currentOrder = null
      }

      return response
    })
  }
}
