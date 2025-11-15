import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'

import { Query } from '@/shared/application/bus/query'
import { FindIngredientCategoryQuery } from './find-ingredient-category.query'
import { FindIngredientCategory } from './find-ingredient-category'
import { IngredientCategoryResponse } from '../dto/ingredient-category.response'

@QueryHandler(FindIngredientCategoryQuery)
export class FindIngredientCategoryHandler implements IQueryHandler<FindIngredientCategoryQuery> {
  constructor(private readonly findIngredientCategory: FindIngredientCategory) {}

  subscribedTo(): Query {
    return FindIngredientCategoryQuery
  }

  async execute(query: FindIngredientCategoryQuery) {
    const ingredientCategory = await this.findIngredientCategory.run(query.id)
    return IngredientCategoryResponse.fromDomain(ingredientCategory)
  }
}
