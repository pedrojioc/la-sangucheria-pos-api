import { Injectable } from '@nestjs/common'
import { ReserveStock } from '@contexts/inventory/stock-level/application/reserve-stock/reserve-stock'
import { ReleaseStockForItem } from '@contexts/inventory/stock-level/application/release-stock/release-stock-for-item'
import { ReleaseStockForOrder } from '@contexts/inventory/stock-level/application/release-stock/release-stock-for-order'
import { ConsumeStockReservation } from '@contexts/inventory/stock-level/application/consume-stock-reservation/consume-stock-reservation'
import {
  StockReservationLine,
  StockReservationPort
} from '../../application/ports/stock-reservation.port'

@Injectable()
export class InventoryStockReservationAdapter extends StockReservationPort {
  constructor(
    private readonly reserveStock: ReserveStock,
    private readonly releaseStockForItem: ReleaseStockForItem,
    private readonly releaseStockForOrder: ReleaseStockForOrder,
    private readonly consumeStockReservation: ConsumeStockReservation
  ) {
    super()
  }

  async reserve(orderId: string, lines: StockReservationLine[]): Promise<void> {
    await this.reserveStock.run(orderId, lines)
  }

  async releaseForItem(orderId: string, itemId: string): Promise<void> {
    await this.releaseStockForItem.run(orderId, itemId)
  }

  async releaseForOrder(orderId: string): Promise<void> {
    await this.releaseStockForOrder.run(orderId)
  }

  async consume(orderId: string, itemId: string, reason: string): Promise<boolean> {
    return this.consumeStockReservation.run(orderId, itemId, reason)
  }
}
