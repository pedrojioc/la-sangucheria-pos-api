import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductRecipe } from '@contexts/menu/product-recipe/domain/product-recipe'
import { ProductRecipeRepository } from '@contexts/menu/product-recipe/domain/repositories/product-recipe.repository'
import { ProductRecipeItem } from '@contexts/menu/product-recipe/domain/product-recipe-item'
import { ProductRecipeEntity } from './product-recipe.entity'
import { ProductRecipeItemEntity } from './product-recipe-item.entity'

@Injectable()
export class TypeOrmProductRecipeRepository implements ProductRecipeRepository {
  constructor(
    @InjectRepository(ProductRecipeEntity)
    private readonly repository: Repository<ProductRecipeEntity>,
    @InjectRepository(ProductRecipeItemEntity)
    private readonly itemRepository: Repository<ProductRecipeItemEntity>
  ) {}

  async save(recipe: ProductRecipe): Promise<void> {
    const primitives = recipe.toPrimitives()

    const entity = this.repository.create({
      id: primitives.id,
      productId: primitives.productId,
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt
    })

    await this.repository.save(entity)
    await this.itemRepository.delete({ productRecipeId: primitives.id })

    const itemEntities = primitives.items.map((item, index) =>
      this.itemRepository.create({
        productRecipeId: primitives.id,
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

  async findByProductId(productId: string): Promise<ProductRecipe | null> {
    const entity = await this.repository.findOne({
      where: { productId },
      relations: ['items']
    })

    if (!entity) return null

    return this.toDomain(entity)
  }

  private toDomain(entity: ProductRecipeEntity): ProductRecipe {
    const items = (entity.items ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(item =>
        ProductRecipeItem.fromPrimitives({
          ingredientId: item.ingredientId,
          quantity: Number(item.quantity),
          unitId: item.unitId
        })
      )

    return ProductRecipe.fromPrimitives({
      id: entity.id,
      productId: entity.productId,
      items: items.map(i => i.toPrimitives()),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    })
  }
}
