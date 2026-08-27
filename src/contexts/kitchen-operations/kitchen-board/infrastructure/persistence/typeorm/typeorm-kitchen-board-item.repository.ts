import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'

import {
  KitchenBoardItemRepository,
  KitchenBoardItemData,
  KitchenBoardPlaceholderData
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
        orderStatus: item.orderStatus,
        tableId: item.tableId,
        tableLabel: item.tableLabel,
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

  async insertPlaceholder(placeholder: KitchenBoardPlaceholderData): Promise<void> {
    const exists = await this.repository.existsBy({
      orderId: placeholder.orderId,
      itemId: IsNull()
    })
    if (exists) return

    await this.repository.insert({
      id: placeholder.id,
      orderId: placeholder.orderId,
      orderNumber: placeholder.orderNumber,
      orderStatus: 'OPEN',
      tableId: placeholder.tableId,
      tableLabel: null,
      itemId: null,
      itemName: '',
      stationId: null,
      status: 'PLACEHOLDER',
      quantity: 0,
      notes: null,
      modifiers: [],
      sentAt: placeholder.sentAt,
      readyAt: null,
      deliveredAt: null,
      cancelledAt: null
    })
  }

  async deletePlaceholderByOrderId(orderId: string): Promise<void> {
    await this.repository.delete({ orderId, itemId: IsNull() })
  }

  async updateOrderStatusByOrderId(orderId: string, orderStatus: string): Promise<void> {
    await this.repository.update({ orderId }, { orderStatus })
  }
}
