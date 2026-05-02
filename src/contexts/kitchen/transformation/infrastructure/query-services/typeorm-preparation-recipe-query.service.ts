import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { PreparationRecipeQueryService } from '../../application/services/preparation-recipe-query.service'
import { PreparationRecipeListItem } from '../../application/dto/preparation-recipe-list-item'
import { PreparationRecipeEntity } from '../persistence/typeorm/preparation-recipe.entity'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

export class TypeOrmPreparationRecipeQueryService implements PreparationRecipeQueryService {
  constructor(
    @InjectRepository(PreparationRecipeEntity)
    private readonly recipeRepository: Repository<PreparationRecipeEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<PreparationRecipeListItem>> {
    const converter = new TypeOrmCriteriaConverter<PreparationRecipeEntity>()

    let queryBuilder = this.recipeRepository.createQueryBuilder('recipe')
    queryBuilder.leftJoinAndSelect('recipe.baseIngredient', 'baseIngredient')
    queryBuilder.leftJoinAndSelect('recipe.outputIngredient', 'outputIngredient')

    queryBuilder = converter.convert(queryBuilder, criteria, 'recipe')

    const [items, total] = await queryBuilder.getManyAndCount()
    const recipes = items.map(
      row =>
        new PreparationRecipeListItem(
          row.id,
          row.name,
          row.description,
          row.baseIngredientId,
          row.baseIngredient?.name ?? '',
          row.outputIngredientId,
          row.outputIngredient?.name ?? '',
          Number(row.yieldPercentage),
          row.additionalIngredients,
          row.isActive,
          row.createdAt,
          row.updatedAt
        )
    )

    return PaginatedResult.create(
      recipes,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }
}
