import { Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'

import { Query } from '@/shared/application/bus/query'
import { FindAllIngredientQuery } from './find-all-ingredient.query'
import { FindAllIngredients } from './find-all-ingredient'
import { IngredientListResponse } from '../dto/ingredient-list.response'

@Injectable()
@QueryHandler(FindAllIngredientQuery)
export class FindAllIngredientHandler implements IQueryHandler<FindAllIngredientQuery> {
  constructor(private readonly findAllIngredient: FindAllIngredients) {}

  subscribedTo(): Query {
    return FindAllIngredientQuery
  }

  async execute(query: FindAllIngredientQuery) {
    const ingredients = await this.findAllIngredient.run()
    return IngredientListResponse.fromDomain(ingredients)
  }
}
