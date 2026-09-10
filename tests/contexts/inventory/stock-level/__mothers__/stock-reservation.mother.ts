import { StockReservation } from '@contexts/inventory/stock-level/domain/stock-reservation'
import { StockReservationStatus } from '@contexts/inventory/stock-level/domain/stock-reservation-status'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'

export class StockReservationMother {
  static create(
    params: Partial<{
      id: string
      orderId: string
      itemId: string
      ingredientId: string
      quantity: number
      unitId: string
      status: StockReservationStatus
    }> = {}
  ): StockReservation {
    const id = params.id ?? UuidMother.random()
    const orderId = params.orderId ?? UuidMother.random()
    const itemId = params.itemId ?? UuidMother.random()
    const ingredientId = params.ingredientId ?? UuidMother.random()
    const quantity = params.quantity ?? NumberMother.positive()
    const unitId = params.unitId ?? UuidMother.random()
    const status = params.status ?? StockReservationStatus.ACTIVE

    return StockReservation.fromPrimitives({
      id,
      orderId,
      itemId,
      ingredientId,
      quantity,
      unitId,
      status
    })
  }

  static random(): StockReservation {
    return this.create()
  }

  static forOrderItem(orderId: string, itemId: string): StockReservation {
    return this.create({ orderId, itemId })
  }

  static forIngredient(ingredientId: string): StockReservation {
    return this.create({ ingredientId })
  }

  static active(): StockReservation {
    return this.create({ status: StockReservationStatus.ACTIVE })
  }

  static released(): StockReservation {
    return this.create({ status: StockReservationStatus.RELEASED })
  }

  static consumed(): StockReservation {
    return this.create({ status: StockReservationStatus.CONSUMED })
  }
}
