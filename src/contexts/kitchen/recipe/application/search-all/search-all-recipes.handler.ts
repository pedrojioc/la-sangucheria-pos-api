import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { SearchAllRecipesQuery } from './search-all-recipes.query'
import { SearchAllRecipes } from './search-all-recipes'
import { RecipeResponse } from '@contexts/kitchen/recipe/application/dto/recipe.response'

@QueryHandler(SearchAllRecipesQuery)
export class SearchAllRecipesHandler implements IQueryHandler<SearchAllRecipesQuery> {
  constructor(private readonly useCase: SearchAllRecipes) {}

  async execute(_query: SearchAllRecipesQuery): Promise<RecipeResponse[]> {
    const recipes = await this.useCase.run()
    return recipes.map(recipe => RecipeResponse.fromDomain(recipe))
  }
}
