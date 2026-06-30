import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import {
  KitchenBoardItemRepository,
  KitchenBoardItemData
} from '../../../domain/kitchen-board-item.repository'
import { KitchenBoardItemEntity } from './kitchen-board-item.entity'

@Injectable()
export class TypeOrmKitchenBoardItemRepository implements KitchenBoardItemRepository {
  constructor(
    @InjectRepository(KitchenBoardItemEntity)
    private readonly repository: Repository<KitchenBoardItemEntity>
  ) {}

  async upsert(item: KitchenBoardItemData): Promise<void> {
    await this.repository.upsert(
      {
        id: item.id,
        orderId: item.orderId,
        orderNumber: item.orderNumber,
        itemId: item.itemId,
        itemName: item.itemName,
        stationId: item.stationId,
        status: item.status,
        quantity: item.quantity,
        notes: item.notes,
        modifiers: item.modifiers,
        sentAt: item.sentAt,
        readyAt: null,
        deliveredAt: null,
        cancelledAt: null
      },
      ['itemId']
    )
  }

  async updateStatus(
    itemId: string,
    status: string,
    timestamps: Partial<{
      readyAt: Date
      deliveredAt: Date
      cancelledAt: Date
    }>
  ): Promise<void> {
    await this.repository.update({ itemId }, { status, ...timestamps })
  }

  async existsByItemId(itemId: string): Promise<boolean> {
    return this.repository.existsBy({ itemId })
  }

  async findStationIdByItemId(itemId: string): Promise<string | null> {
    const entity = await this.repository.findOne({
      where: { itemId },
      select: ['stationId']
    })
    return entity?.stationId ?? null
  }
}
