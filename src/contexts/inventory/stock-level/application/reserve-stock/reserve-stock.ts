import { StockReservationRepository } from '@contexts/inventory/stock-level/domain/repositories/stock-reservation.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { StockReservation } from '@contexts/inventory/stock-level/domain/stock-reservation'
import { InsufficientStockForReservation } from '@contexts/inventory/stock-level/domain/exceptions/insufficient-stock-for-reservation.exception'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Uuid } from '@/shared/domain/value-objects/uuid'

export interface ReserveStockLine {
  itemId: string
  ingredientId: string
  quantity: number
  unitId: string
}

/**
 * ReserveStock - Use Case
 *
 * Creates one ACTIVE StockReservation per line for an order sent to
 * kitchen. Validates availability (currentQuantity - active reservations)
 * for every ingredient before writing anything: if any ingredient is
 * short, the whole reservation batch is rejected and zero rows are saved.
 *
 * Locks are acquired one per distinct ingredient, in ascending
 * ingredientId order, to keep concurrent requests deadlock-free.
 */
export class ReserveStock {
  constructor(
    private readonly reservationRepository: StockReservationRepository,
    private readonly levelRepository: InventoryLevelRepository
  ) {}

  async run(orderId: string, lines: ReserveStockLine[]): Promise<void> {
    const requiredByIngredient = this.groupByIngredient(lines)

    for (const ingredientId of [...requiredByIngredient.keys()].sort()) {
      const required = requiredByIngredient.get(ingredientId)!
      const ingredientIdVO = new IngredientId(ingredientId)

      const level = await this.levelRepository.findByIngredientForUpdate(ingredientIdVO)
      if (!level) {
        throw new InsufficientStockForReservation(ingredientId, required, 0)
      }

      const reserved = await this.reservationRepository.sumActiveByIngredient(ingredientIdVO)
      const available = level.getCurrentQuantity().value - reserved

      if (available < required) {
        throw new InsufficientStockForReservation(ingredientId, required, available)
      }
    }

    for (const line of lines) {
      const reservation = StockReservation.create(
        Uuid.random().value,
        orderId,
        line.itemId,
        line.ingredientId,
        line.quantity,
        line.unitId
      )
      await this.reservationRepository.save(reservation)
    }
  }

  private groupByIngredient(lines: ReserveStockLine[]): Map<string, number> {
    const grouped = new Map<string, number>()
    for (const line of lines) {
      grouped.set(line.ingredientId, (grouped.get(line.ingredientId) ?? 0) + line.quantity)
    }
    return grouped
  }
}
