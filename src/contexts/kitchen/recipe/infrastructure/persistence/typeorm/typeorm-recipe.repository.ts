import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Recipe } from '@contexts/kitchen/recipe/domain/recipe'
import { RecipeId } from '@contexts/kitchen/recipe/domain/recipe-id'
import { RecipeRepository } from '@contexts/kitchen/recipe/domain/repositories/recipe.repository'
import { RecipeEntity } from './recipe.entity'
import { RecipeItemEntity } from './recipe-item.entity'
import { RecipeItem } from '@contexts/kitchen/recipe/domain/recipe-item'
import { RecipeYield } from '@contexts/kitchen/recipe/domain/recipe-yield'

@Injectable()
export class TypeOrmRecipeRepository implements RecipeRepository {
  constructor(
    @InjectRepository(RecipeEntity)
    private readonly repository: Repository<RecipeEntity>,
    @InjectRepository(RecipeItemEntity)
    private readonly itemRepository: Repository<RecipeItemEntity>
  ) {}

  async save(recipe: Recipe): Promise<void> {
    const primitives = recipe.toPrimitives()

    // Save recipe
    const entity = this.repository.create({
      id: primitives.id,
      name: primitives.name,
      description: primitives.description,
      yieldQuantity: primitives.recipeYield.value,
      yieldUnitId: primitives.recipeYield.unitId,
      yieldDescription: primitives.recipeYield.description,
      isActive: primitives.isActive,
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt
    })

    await this.repository.save(entity)

    // Delete existing items
    await this.itemRepository.delete({ recipeId: primitives.id })

    // Save new items
    const itemEntities = primitives.items.map((item, index) =>
      this.itemRepository.create({
        recipeId: primitives.id,
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unitId: item.unitId,
        sortOrder: index
      })
    )

    if (itemEntities.length > 0) {
      await this.itemRepository.save(itemEntities)
    }
  }

  async search(id: RecipeId): Promise<Recipe | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value },
      relations: ['items']
    })

    if (!entity) {
      return null
    }

    return this.toDomain(entity)
  }

  async searchAll(): Promise<Recipe[]> {
    const entities = await this.repository.find({
      relations: ['items'],
      where: { isActive: true },
      order: { createdAt: 'DESC' }
    })

    return entities.map(entity => this.toDomain(entity))
  }

  async delete(id: RecipeId): Promise<void> {
    await this.repository.delete({ id: id.value })
  }

  private toDomain(entity: RecipeEntity): Recipe {
    const items = (entity.items || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(item =>
        RecipeItem.fromPrimitives({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unitId: item.unitId
        })
      )

    const recipeYield = RecipeYield.fromPrimitives({
      value: entity.yieldQuantity,
      unitId: entity.yieldUnitId,
      description: entity.yieldDescription
    })

    return Recipe.fromPrimitives({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      items: items.map(item => item.toPrimitives()),
      recipeYield: recipeYield.toPrimitives(),
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    })
  }
}
