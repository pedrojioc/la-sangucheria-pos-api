import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'

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
    const query = this.repository
      .createQueryBuilder('item')
      .where('item.status IN (:...activeStatuses)', { activeStatuses: ['SENT', 'READY'] })

    // PLACEHOLDER rows have no station yet — always included regardless of
    // station filter so OPEN orders appear on every station's board.
    if (stationId !== undefined) {
      query.andWhere(
        new Brackets(qb => {
          qb.where('item.status = :placeholder', { placeholder: 'PLACEHOLDER' })
          if (stationId === 'UNASSIGNED') {
            qb.orWhere('item.stationId IS NULL')
          } else {
            qb.orWhere('item.stationId = :stationId', { stationId })
          }
        })
      )
    } else {
      query.orWhere('item.status = :placeholder', { placeholder: 'PLACEHOLDER' })
    }

    const items = await query.orderBy('item.sentAt', 'ASC').getMany()

    return this.groupByOrder(items)
  }

  private groupByOrder(items: KitchenBoardItemEntity[]): KitchenBoardOrderGroup[] {
    const orderMap = new Map<
      string,
      {
        orderNumber: string
        orderStatus: string
        tableId: string | null
        tableLabel: string | null
        sentAt: Date
        items: KitchenBoardItemResponse[]
      }
    >()

    for (const item of items) {
      let group = orderMap.get(item.orderId)
      if (!group) {
        group = {
          orderNumber: item.orderNumber,
          orderStatus: item.orderStatus,
          tableId: item.tableId,
          tableLabel: item.tableLabel,
          sentAt: item.sentAt,
          items: []
        }
        orderMap.set(item.orderId, group)
      } else if (item.sentAt < group.sentAt) {
        group.sentAt = item.sentAt
      }

      // Placeholder rows only carry orderStatus — they never surface as a fake item.
      if (item.itemId === null) continue

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
      groups.push({
        orderId,
        orderNumber: group.orderNumber,
        orderStatus: group.orderStatus,
        tableId: group.tableId,
        tableLabel: group.tableLabel,
        oldestSentAt: group.sentAt,
        items: group.items
      })
    }

    groups.sort((a, b) => a.oldestSentAt.getTime() - b.oldestSentAt.getTime())

    return groups
  }
}
