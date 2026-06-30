import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { ProductRecipeId } from './product-recipe-id'
import { ProductRecipeItem, ProductRecipeItemPrimitives } from './product-recipe-item'
import { ProductRecipeMustHaveItems } from './exceptions/product-recipe-must-have-items.exception'
import { ProductRecipeSavedEvent } from './events/product-recipe-saved.event'

export interface ProductRecipePrimitives {
  id: string
  productId: string
  items: ProductRecipeItemPrimitives[]
  createdAt: Date
  updatedAt: Date
}

export class ProductRecipe extends AggregateRoot {
  private constructor(
    public readonly id: ProductRecipeId,
    public readonly productId: string,
    private items: ProductRecipeItem[],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super()
  }

  static create(id: string, productId: string, items: ProductRecipeItem[]): ProductRecipe {
    if (items.length === 0) throw new ProductRecipeMustHaveItems()

    const recipe = new ProductRecipe(
      new ProductRecipeId(id),
      productId,
      items,
      new Date(),
      new Date()
    )

    recipe.record(
      new ProductRecipeSavedEvent({ recipeId: id, productId, itemsCount: items.length })
    )

    return recipe
  }

  update(items: ProductRecipeItem[]): void {
    if (items.length === 0) throw new ProductRecipeMustHaveItems()

    this.items = items
    this.updatedAt = new Date()

    this.record(
      new ProductRecipeSavedEvent({
        recipeId: this.id.value,
        productId: this.productId,
        itemsCount: items.length
      })
    )
  }

  getItems(): ProductRecipeItem[] {
    return [...this.items]
  }

  toPrimitives(): ProductRecipePrimitives {
    return {
      id: this.id.value,
      productId: this.productId,
      items: this.items.map(i => i.toPrimitives()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  static fromPrimitives(primitives: ProductRecipePrimitives): ProductRecipe {
    return new ProductRecipe(
      new ProductRecipeId(primitives.id),
      primitives.productId,
      primitives.items.map(ProductRecipeItem.fromPrimitives),
      primitives.createdAt,
      primitives.updatedAt
    )
  }
}
