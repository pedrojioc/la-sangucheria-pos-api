import { Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'

import { Query } from '@/shared/application/bus/query'
import { FindIngredientQuery } from './find-ingredient.query'
import { FindIngredient } from './find-ingredient'
import { IngredientResponse } from '../dto/ingredient.response'

@Injectable()
@QueryHandler(FindIngredientQuery)
export class FindIngredientHandler implements IQueryHandler<FindIngredientQuery> {
  constructor(private readonly findIngredient: FindIngredient) {}

  subscribedTo(): Query {
    return FindIngredientQuery
  }

  async execute(query: FindIngredientQuery) {
    const ingredient = await this.findIngredient.run(query.id)
    return IngredientResponse.fromDomain(ingredient)
  }
}
