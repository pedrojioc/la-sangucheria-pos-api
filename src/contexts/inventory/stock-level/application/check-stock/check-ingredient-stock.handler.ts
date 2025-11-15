import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { CheckIngredientStockQuery } from './check-ingredient-stock.query'
import { CheckIngredientStock } from './check-ingredient-stock'

@QueryHandler(CheckIngredientStockQuery)
export class CheckIngredientStockHandler
  implements IQueryHandler<CheckIngredientStockQuery, boolean>
{
  constructor(private readonly useCase: CheckIngredientStock) {}

  async execute(query: CheckIngredientStockQuery): Promise<boolean> {
    return this.useCase.run(query.ingredientId, query.quantity, query.unitId)
  }
}
