import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { KitchenBoardQueryService } from '../../application/services/kitchen-board-query.service'
import {
  KitchenBoardResponse,
  KitchenBoardOrderGroup,
  KitchenBoardItemResponse
} from '../../application/dto/kitchen-board.response'

interface KitchenBoardRawRow {
  orderId: string
  orderNumber: string
  orderStatus: string
  tableId: string | null
  tableLabel: string | null
  openedAt: Date
  itemId: string | null
  itemName: string | null
  stationId: string | null
  itemStatus: string | null
  quantity: number | null
  notes: string | null
  modifiers: Record<string, unknown>[] | null
  sentAt: Date | null
  readyAt: Date | null
  deliveredAt: Date | null
  cancelledAt: Date | null
}

@Injectable()
export class TypeOrmKitchenBoardQueryService implements KitchenBoardQueryService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>
  ) {}

  async findActiveByStation(stationId?: string): Promise<KitchenBoardResponse> {
    const query = this.repository
      .createQueryBuilder('o')
      .leftJoin(
        'order_items',
        'i',
        'i.order_id = o.id AND i.status IN (:...activeStatuses)' +
          this.stationJoinPredicate(stationId),
        { activeStatuses: ['SENT', 'READY'], stationId }
      )
      .leftJoin('tables', 't', 't.id = o.table_id')
      .where('o.status IN (:...orderStatuses)', {
        orderStatuses: ['OPEN', 'IN_PROGRESS', 'READY']
      })
      .select([
        'o.id AS "orderId"',
        'o.order_number AS "orderNumber"',
        'o.status AS "orderStatus"',
        'o.table_id AS "tableId"',
        't.number AS "tableLabel"',
        'o.opened_at AS "openedAt"',
        'i.id AS "itemId"',
        'i.product_name AS "itemName"',
        'i.station_id AS "stationId"',
        'i.status AS "itemStatus"',
        'i.quantity AS "quantity"',
        'i.notes AS "notes"',
        'i.modifiers AS "modifiers"',
        'i.sent_at AS "sentAt"',
        'i.ready_at AS "readyAt"',
        'i.delivered_at AS "deliveredAt"',
        'i.cancelled_at AS "cancelledAt"'
      ])
      .orderBy('o.opened_at', 'ASC')
      .addOrderBy('i.sent_at', 'ASC')

    const rows: KitchenBoardRawRow[] = await query.getRawMany()

    return this.groupByOrder(rows)
  }

  // Station predicate lives in the JOIN's ON clause, not WHERE — this is what
  // makes an OPEN order with no matching items still yield one row (all i.*
  // columns NULL), giving items: [] without any synthetic PLACEHOLDER row.
  private stationJoinPredicate(stationId?: string): string {
    if (stationId === undefined) return ''
    if (stationId === 'UNASSIGNED') return ' AND i.station_id IS NULL'
    return ' AND i.station_id = :stationId'
  }

  private groupByOrder(rows: KitchenBoardRawRow[]): KitchenBoardOrderGroup[] {
    const orderMap = new Map<
      string,
      {
        orderNumber: string
        orderStatus: string
        tableId: string | null
        tableLabel: string | null
        openedAt: Date
        sentAts: Date[]
        items: KitchenBoardItemResponse[]
      }
    >()

    for (const row of rows) {
      let group = orderMap.get(row.orderId)
      if (!group) {
        group = {
          orderNumber: row.orderNumber,
          orderStatus: row.orderStatus,
          tableId: row.tableId,
          tableLabel: row.tableLabel,
          openedAt: row.openedAt,
          sentAts: [],
          items: []
        }
        orderMap.set(row.orderId, group)
      }

      if (row.itemId === null) continue

      group.items.push({
        id: row.itemId,
        itemId: row.itemId,
        itemName: row.itemName!,
        stationId: row.stationId,
        status: row.itemStatus!,
        quantity: row.quantity!,
        notes: row.notes,
        modifiers: row.modifiers ?? [],
        sentAt: row.sentAt!,
        readyAt: row.readyAt,
        deliveredAt: row.deliveredAt,
        cancelledAt: row.cancelledAt
      })

      if (row.sentAt) group.sentAts.push(row.sentAt)
    }

    const groups: KitchenBoardOrderGroup[] = []
    for (const [orderId, group] of orderMap) {
      const oldestSentAt =
        group.sentAts.length > 0
          ? group.sentAts.reduce((oldest, current) => (current < oldest ? current : oldest))
          : group.openedAt

      groups.push({
        orderId,
        orderNumber: group.orderNumber,
        orderStatus: group.orderStatus,
        tableId: group.tableId,
        tableLabel: group.tableLabel,
        oldestSentAt,
        items: group.items
      })
    }

    groups.sort((a, b) => a.oldestSentAt.getTime() - b.oldestSentAt.getTime())

    return groups
  }
}
