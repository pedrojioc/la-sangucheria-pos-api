import { Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'

import { Query } from '@/shared/application/bus/query'
import { FindAllIngredientCategoryQuery } from './find-all-ingredient-category.query'
import { FindAllIngredientCategories } from './find-all-ingredient-category'
import { IngredientCategoryListResponse } from '../dto/ingredient-category-list.response'

@Injectable()
@QueryHandler(FindAllIngredientCategoryQuery)
export class FindAllIngredientCategoryHandler
  implements IQueryHandler<FindAllIngredientCategoryQuery>
{
  constructor(private readonly findAllIngredientCategory: FindAllIngredientCategories) {}

  subscribedTo(): Query {
    return FindAllIngredientCategoryQuery
  }

  async execute(query: FindAllIngredientCategoryQuery) {
    const ingredientCategories = await this.findAllIngredientCategory.run()
    return IngredientCategoryListResponse.fromDomain(ingredientCategories)
  }
}
