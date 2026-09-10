import { StockReservation } from '../stock-reservation'
import { StockReservationId } from '../stock-reservation-id'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'

export abstract class StockReservationRepository {
  abstract save(reservation: StockReservation): Promise<void>

  abstract search(id: StockReservationId): Promise<StockReservation | null>

  /**
   * Active rows for one order item — release/consume key.
   */
  abstract findActiveByOrderItem(orderId: string, itemId: string): Promise<StockReservation[]>

  /**
   * Every still-ACTIVE row for the order — whole-order cancel.
   */
  abstract findActiveByOrder(orderId: string): Promise<StockReservation[]>

  /**
   * SUM(quantity) WHERE ingredient_id = ? AND status = 'ACTIVE'; 0 when none.
   */
  abstract sumActiveByIngredient(ingredientId: IngredientId): Promise<number>
}
