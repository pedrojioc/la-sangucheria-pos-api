import { Injectable } from '@nestjs/common'
import { FindIngredient } from '@contexts/inventory/ingredient/application/find/find-ingredient'
import { IngredientExistencePort } from '../../application/ports/ingredient-existence.port'

@Injectable()
export class IngredientExistenceAdapter extends IngredientExistencePort {
  constructor(private readonly findIngredient: FindIngredient) {
    super()
  }

  async ensureExists(ingredientId: string): Promise<void> {
    await this.findIngredient.run(ingredientId)
  }
}
