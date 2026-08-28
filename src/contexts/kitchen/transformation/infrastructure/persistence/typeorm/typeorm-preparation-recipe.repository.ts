import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PreparationRecipeRepository } from '@contexts/kitchen/transformation/domain/repositories/preparation-recipe.repository'
import { PreparationRecipe } from '@contexts/kitchen/transformation/domain/preparation-recipe'
import { PreparationRecipeId } from '@contexts/kitchen/transformation/domain/preparation-recipe-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { PreparationRecipeEntity } from './preparation-recipe.entity'
import { PreparationRecipeIngredientEntity } from './preparation-recipe-ingredient.entity'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmPreparationRecipeRepository
  extends TransactionalRepository<PreparationRecipeEntity>
  implements PreparationRecipeRepository
{
  constructor(
    @InjectRepository(PreparationRecipeEntity)
    repository: Repository<PreparationRecipeEntity>,
    @InjectRepository(PreparationRecipeIngredientEntity)
    private readonly ingredientRepository: Repository<PreparationRecipeIngredientEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(recipe: PreparationRecipe): Promise<void> {
    const primitives = recipe.toPrimitives()

    await this.repo.save({
      id: primitives.id,
      name: primitives.name,
      description: primitives.description,
      baseIngredientId: primitives.baseIngredientId,
      outputIngredientId: primitives.outputIngredientId,
      yieldPercentage: primitives.yieldPercentage,
      yieldTolerancePercentage: primitives.yieldTolerancePercentage,
      isActive: primitives.isActive
    })

    await this.ingredientRepository.delete({ recipeId: primitives.id })

    if (primitives.additionalIngredients.length > 0) {
      await this.ingredientRepository.save(
        primitives.additionalIngredients.map(ai => ({
          id: ai.id,
          recipeId: primitives.id,
          ingredientId: ai.ingredientId,
          quantityPerUnit: ai.quantityPerUnit
        }))
      )
    }
  }

  async search(id: PreparationRecipeId): Promise<PreparationRecipe | null> {
    const entity = await this.repo.findOne({
      where: { id: id.value },
      relations: { additionalIngredients: { ingredient: true } }
    })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async findByBaseIngredient(ingredientId: IngredientId): Promise<PreparationRecipe | null> {
    const entity = await this.repo.findOne({
      where: { baseIngredientId: ingredientId.value, isActive: true },
      relations: { additionalIngredients: { ingredient: true } }
    })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async findActive(): Promise<PreparationRecipe[]> {
    const entities = await this.repo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
      relations: { additionalIngredients: { ingredient: true } }
    })
    return entities.map(e => this.toDomain(e))
  }

  async searchAll(): Promise<PreparationRecipe[]> {
    const entities = await this.repo.find({
      order: { createdAt: 'DESC' },
      relations: { additionalIngredients: { ingredient: true } }
    })
    return entities.map(e => this.toDomain(e))
  }

  async matching(criteria: Criteria): Promise<PaginatedResult<PreparationRecipe>> {
    const converter = new TypeOrmCriteriaConverter<PreparationRecipeEntity>()
    let qb = this.repo
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.additionalIngredients', 'additionalIngredients')
      .leftJoinAndSelect('additionalIngredients.ingredient', 'ai_ingredient')

    qb = converter.convert(qb, criteria, 'recipe')

    const [items, total] = await qb.getManyAndCount()
    const recipes = items.map(e => this.toDomain(e))

    return PaginatedResult.create(
      recipes,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }

  private toDomain(entity: PreparationRecipeEntity): PreparationRecipe {
    return PreparationRecipe.fromPrimitives({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      baseIngredientId: entity.baseIngredientId,
      outputIngredientId: entity.outputIngredientId,
      yieldPercentage: entity.yieldPercentage,
      yieldTolerancePercentage: entity.yieldTolerancePercentage,
      additionalIngredients: (entity.additionalIngredients ?? []).map(ai => ({
        id: ai.id,
        ingredientId: ai.ingredientId,
        quantityPerUnit: ai.quantityPerUnit,
        unitId: ai.ingredient?.unitId ?? ''
      })),
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    })
  }
}
