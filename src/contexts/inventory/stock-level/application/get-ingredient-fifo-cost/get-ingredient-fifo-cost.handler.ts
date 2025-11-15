import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { GetIngredientFifoCostQuery } from './get-ingredient-fifo-cost.query'
import { GetIngredientFifoCost } from './get-ingredient-fifo-cost'
import { Money } from '@/shared/domain/value-objects/money'

@QueryHandler(GetIngredientFifoCostQuery)
export class GetIngredientFifoCostHandler
  implements IQueryHandler<GetIngredientFifoCostQuery, Money>
{
  constructor(private readonly useCase: GetIngredientFifoCost) {}

  async execute(query: GetIngredientFifoCostQuery): Promise<Money> {
    return this.useCase.run(query.ingredientId, query.quantity, query.unitId)
  }
}
