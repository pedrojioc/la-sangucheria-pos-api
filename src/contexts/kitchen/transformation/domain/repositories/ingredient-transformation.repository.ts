import { IngredientTransformation } from '../ingredient-transformation'
import { TransformationId } from '../transformation-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'

export abstract class IngredientTransformationRepository {
  abstract save(transformation: IngredientTransformation): Promise<void>

  abstract search(id: TransformationId): Promise<IngredientTransformation | null>

  /**
   * Busca transformaciones por ingrediente de salida
   * Útil para rastrear historial de producción de un ingrediente
   */
  abstract findByOutputIngredient(ingredientId: IngredientId): Promise<IngredientTransformation[]>

  /**
   * Busca transformaciones por ingrediente base
   */
  abstract findByBaseIngredient(ingredientId: IngredientId): Promise<IngredientTransformation[]>

  abstract searchAll(): Promise<IngredientTransformation[]>
}
