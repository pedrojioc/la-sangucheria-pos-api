import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, IsNull } from 'typeorm'

import { KitchenBoardQueryService } from '../../application/services/kitchen-board-query.service'
import {
  KitchenBoardResponse,
  KitchenBoardOrderGroup,
  KitchenBoardItemResponse
} from '../../application/dto/kitchen-board.response'
import { KitchenBoardItemEntity } from '../persistence/typeorm/kitchen-board-item.entity'

@Injectable()
export class TypeOrmKitchenBoardQueryService implements KitchenBoardQueryService {
  constructor(
    @InjectRepository(KitchenBoardItemEntity)
    private readonly repository: Repository<KitchenBoardItemEntity>
  ) {}

  async findActiveByStation(stationId?: string): Promise<KitchenBoardResponse> {
    const activeStatuses = ['SENT', 'READY']

    const whereClause: Record<string, any> = {
      status: In(activeStatuses)
    }

    if (stationId !== undefined) {
      whereClause.stationId = stationId === 'UNASSIGNED' ? IsNull() : stationId
    }

    const items = await this.repository.find({
      where: whereClause,
      order: { sentAt: 'ASC' }
    })

    return this.groupByOrder(items)
  }

  private groupByOrder(items: KitchenBoardItemEntity[]): KitchenBoardOrderGroup[] {
    const orderMap = new Map<string, { orderNumber: string; items: KitchenBoardItemResponse[] }>()

    for (const item of items) {
      let group = orderMap.get(item.orderId)
      if (!group) {
        group = { orderNumber: item.orderNumber, items: [] }
        orderMap.set(item.orderId, group)
      }

      group.items.push({
        id: item.id,
        itemId: item.itemId,
        itemName: item.itemName,
        stationId: item.stationId,
        status: item.status,
        quantity: item.quantity,
        notes: item.notes,
        modifiers: item.modifiers,
        sentAt: item.sentAt,
        readyAt: item.readyAt,
        deliveredAt: item.deliveredAt,
        cancelledAt: item.cancelledAt
      })
    }

    const groups: KitchenBoardOrderGroup[] = []
    for (const [orderId, group] of orderMap) {
      const sentAts = group.items.map(i => i.sentAt)
      const oldestSentAt = sentAts.reduce((min, d) => (d < min ? d : min))

      groups.push({
        orderId,
        orderNumber: group.orderNumber,
        oldestSentAt,
        items: group.items
      })
    }

    groups.sort((a, b) => a.oldestSentAt.getTime() - b.oldestSentAt.getTime())

    return groups
  }
}
