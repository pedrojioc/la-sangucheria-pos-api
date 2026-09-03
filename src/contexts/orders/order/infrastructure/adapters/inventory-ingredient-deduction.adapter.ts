import { Injectable } from '@nestjs/common'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'
import { IngredientDeductionPort } from '../../application/ports/ingredient-deduction.port'

@Injectable()
export class InventoryIngredientDeductionAdapter extends IngredientDeductionPort {
  constructor(private readonly deductIngredient: DeductIngredient) {
    super()
  }

  async deduct(
    ingredientId: string,
    quantity: number,
    unitId: string,
    reason: string,
    referenceId: string
  ): Promise<void> {
    await this.deductIngredient.run(ingredientId, quantity, unitId, reason, referenceId, null)
  }
}
