import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PreparationRecipeRepository } from '@contexts/kitchen/transformation/domain/repositories/preparation-recipe.repository'
import { PreparationRecipe } from '@contexts/kitchen/transformation/domain/preparation-recipe'
import { PreparationRecipeId } from '@contexts/kitchen/transformation/domain/preparation-recipe-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { PreparationRecipeEntity } from './preparation-recipe.entity'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

@Injectable()
export class TypeOrmPreparationRecipeRepository extends PreparationRecipeRepository {
  constructor(
    @InjectRepository(PreparationRecipeEntity)
    private readonly repository: Repository<PreparationRecipeEntity>
  ) {
    super()
  }

  async save(recipe: PreparationRecipe): Promise<void> {
    const primitives = recipe.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async search(id: PreparationRecipeId): Promise<PreparationRecipe | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    if (!entity) return null
    return PreparationRecipe.fromPrimitives(entity)
  }

  async findByBaseIngredient(ingredientId: IngredientId): Promise<PreparationRecipe | null> {
    const entity = await this.repository.findOne({
      where: {
        baseIngredientId: ingredientId.value,
        isActive: true
      }
    })

    if (!entity) return null
    return PreparationRecipe.fromPrimitives(entity)
  }

  async findActive(): Promise<PreparationRecipe[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    })

    return entities.map(entity => PreparationRecipe.fromPrimitives(entity))
  }

  async searchAll(): Promise<PreparationRecipe[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC' }
    })

    return entities.map(entity => PreparationRecipe.fromPrimitives(entity))
  }

  async matching(criteria: Criteria): Promise<PaginatedResult<PreparationRecipe>> {
    const converter = new TypeOrmCriteriaConverter<PreparationRecipeEntity>()
    let qb = this.repository.createQueryBuilder('recipe')

    qb = converter.convert(qb, criteria, 'recipe')

    const [items, total] = await qb.getManyAndCount()

    const recipes = items.map(entity => PreparationRecipe.fromPrimitives(entity))

    return PaginatedResult.create(
      recipes,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }
}
