import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { SearchAllRecipesQuery } from './search-all-recipes.query'
import { SearchAllRecipes } from './search-all-recipes'
import { Recipe } from '@contexts/kitchen/recipe/domain/recipe'

@QueryHandler(SearchAllRecipesQuery)
export class SearchAllRecipesHandler implements IQueryHandler<SearchAllRecipesQuery> {
  constructor(private readonly useCase: SearchAllRecipes) {}

  async execute(_query: SearchAllRecipesQuery): Promise<Recipe[]> {
    return this.useCase.run()
  }
}
