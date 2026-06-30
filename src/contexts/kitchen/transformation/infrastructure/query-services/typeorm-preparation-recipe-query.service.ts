import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { PreparationRecipeQueryService } from '../../application/services/preparation-recipe-query.service'
import { PreparationRecipeListItem } from '../../application/dto/preparation-recipe-list-item'
import { PreparationRecipeDetail } from '../../application/dto/preparation-recipe-detail'
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
          {
            id: row.baseIngredientId,
            name: row.baseIngredient?.name ?? '',
            unitId: row.baseIngredient?.unitId ?? ''
          },
          {
            id: row.outputIngredientId,
            name: row.outputIngredient?.name ?? '',
            unitId: row.outputIngredient?.unitId ?? ''
          },
          row.yieldPercentage,
          (row.additionalIngredients ?? []).map(ai => ({
            ingredientId: ai.ingredientId,
            quantityPerUnit: ai.quantityPerUnit
          })),
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

  async findById(id: string): Promise<PreparationRecipeDetail | null> {
    const row = await this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.baseIngredient', 'baseIngredient')
      .leftJoinAndSelect('baseIngredient.unit', 'baseUnit')
      .leftJoinAndSelect('recipe.outputIngredient', 'outputIngredient')
      .leftJoinAndSelect('outputIngredient.unit', 'outputUnit')
      .leftJoinAndSelect('recipe.additionalIngredients', 'additionalIngredients')
      .leftJoinAndSelect('additionalIngredients.ingredient', 'ai_ingredient')
      .leftJoinAndSelect('ai_ingredient.unit', 'ai_unit')
      .where('recipe.id = :id', { id })
      .getOne()

    if (!row) return null

    return new PreparationRecipeDetail(
      row.id,
      row.name,
      row.description,
      {
        id: row.baseIngredientId,
        name: row.baseIngredient?.name ?? '',
        unit: {
          id: row.baseIngredient?.unitId ?? '',
          name: row.baseIngredient?.unit?.name ?? '',
          symbol: row.baseIngredient?.unit?.symbol ?? ''
        }
      },
      {
        id: row.outputIngredientId,
        name: row.outputIngredient?.name ?? '',
        unit: {
          id: row.outputIngredient?.unitId ?? '',
          name: row.outputIngredient?.unit?.name ?? '',
          symbol: row.outputIngredient?.unit?.symbol ?? ''
        }
      },
      row.yieldPercentage,
      row.yieldTolerancePercentage,
      (row.additionalIngredients ?? []).map(ai => ({
        id: ai.id,
        ingredientId: ai.ingredientId,
        ingredientName: ai.ingredient?.name ?? '',
        quantityPerUnit: ai.quantityPerUnit,
        unitId: ai.ingredient?.unitId ?? '',
        unitName: ai.ingredient?.unit?.name ?? '',
        unitSymbol: ai.ingredient?.unit?.symbol ?? ''
      })),
      row.isActive,
      row.createdAt,
      row.updatedAt
    )
  }
}
