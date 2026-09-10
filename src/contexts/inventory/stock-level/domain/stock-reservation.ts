import { Quantity } from '@/shared/domain/value-objects/quantity'
import { StockReservationId } from './stock-reservation-id'
import { StockReservationStatus } from './stock-reservation-status'

export interface StockReservationPrimitives {
  id: string
  orderId: string
  itemId: string
  ingredientId: string
  quantity: number
  unitId: string
  status: StockReservationStatus
}

/**
 * StockReservation - Aggregate Root
 *
 * Represents a hold placed on ingredient stock for one order item,
 * created when the order is sent to kitchen. The reservation snapshots
 * the quantity/unit resolved at reservation time and never re-resolves it.
 *
 * State machine:
 *   ACTIVE -> RELEASED  (order/item cancelled)
 *   ACTIVE -> CONSUMED  (order closed, ingredients deducted via FIFO)
 *
 * RELEASED and CONSUMED are both terminal. A reservation is never
 * reactivated or re-quantified once it leaves ACTIVE. release()/consume()
 * on a non-ACTIVE reservation are no-ops — terminality is the idempotency
 * mechanism, so a repeated release/consume never raises and never mutates.
 */
export class StockReservation {
  private constructor(
    public readonly id: StockReservationId,
    public readonly orderId: string,
    public readonly itemId: string,
    public readonly ingredientId: string,
    public readonly quantity: Quantity,
    private status: StockReservationStatus
  ) {}

  static create(
    id: string,
    orderId: string,
    itemId: string,
    ingredientId: string,
    quantity: number,
    unitId: string
  ): StockReservation {
    return new StockReservation(
      new StockReservationId(id),
      orderId,
      itemId,
      ingredientId,
      new Quantity(quantity, unitId),
      StockReservationStatus.ACTIVE
    )
  }

  release(): void {
    if (this.status !== StockReservationStatus.ACTIVE) return
    this.status = StockReservationStatus.RELEASED
  }

  consume(): void {
    if (this.status !== StockReservationStatus.ACTIVE) return
    this.status = StockReservationStatus.CONSUMED
  }

  isActive(): boolean {
    return this.status === StockReservationStatus.ACTIVE
  }

  getStatus(): StockReservationStatus {
    return this.status
  }

  toPrimitives(): StockReservationPrimitives {
    return {
      id: this.id.value,
      orderId: this.orderId,
      itemId: this.itemId,
      ingredientId: this.ingredientId,
      quantity: this.quantity.value,
      unitId: this.quantity.unitId,
      status: this.status
    }
  }

  static fromPrimitives(primitives: StockReservationPrimitives): StockReservation {
    return new StockReservation(
      new StockReservationId(primitives.id),
      primitives.orderId,
      primitives.itemId,
      primitives.ingredientId,
      new Quantity(primitives.quantity, primitives.unitId),
      primitives.status
    )
  }
}
