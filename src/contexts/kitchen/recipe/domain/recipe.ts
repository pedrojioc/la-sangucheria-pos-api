import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { RecipeId } from './recipe-id'
import { RecipeItem } from './recipe-item'
import { RecipeYield } from './recipe-yield'
import { RecipeName } from './recipe-name'
import { RecipeDescription } from './recipe-description'

export interface RecipePrimitives {
  id: string
  name: string
  description: string | null
  items: Array<{ ingredientId: string; quantity: number; unitId: string }>
  recipeYield: { value: number; unitId: string; description: string | null }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class Recipe extends AggregateRoot {
  private constructor(
    public readonly id: RecipeId,
    private name: RecipeName,
    private description: RecipeDescription | null,
    private items: RecipeItem[],
    private recipeYield: RecipeYield,
    private isActive: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super()
    this.ensureHasItems()
  }

  static create(
    id: string,
    name: string,
    items: RecipeItem[],
    recipeYield: RecipeYield,
    description?: string | null
  ): Recipe {
    const recipe = new Recipe(
      new RecipeId(id),
      new RecipeName(name),
      description ? new RecipeDescription(description) : null,
      items,
      recipeYield,
      true,
      new Date(),
      new Date()
    )

    return recipe
  }

  getItems(): RecipeItem[] {
    return [...this.items]
  }

  getYield(): RecipeYield {
    return this.recipeYield
  }

  getName(): string {
    return this.name.value
  }

  scaleByQuantity(quantity: number): RecipeItem[] {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero')
    }
    return this.items.map(item => item.multiplyBy(quantity))
  }

  updateItems(items: RecipeItem[]): void {
    this.ensureHasItemsArray(items)
    this.items = items
    this.updatedAt = new Date()
  }

  updateYield(recipeYield: RecipeYield): void {
    this.recipeYield = recipeYield
    this.updatedAt = new Date()
  }

  updateName(name: string): void {
    this.name = new RecipeName(name)
    this.updatedAt = new Date()
  }

  updateDescription(description: string | null): void {
    this.description = description ? new RecipeDescription(description) : null
    this.updatedAt = new Date()
  }

  activate(): void {
    this.isActive = true
    this.updatedAt = new Date()
  }

  deactivate(): void {
    this.isActive = false
    this.updatedAt = new Date()
  }

  hasIngredient(ingredientId: string): boolean {
    return this.items.some(item => item.ingredientId.value === ingredientId)
  }

  toPrimitives(): RecipePrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      description: this.description?.value ?? null,
      items: this.items.map(item => item.toPrimitives()),
      recipeYield: this.recipeYield.toPrimitives(),
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  static fromPrimitives(primitives: RecipePrimitives): Recipe {
    return new Recipe(
      new RecipeId(primitives.id),
      new RecipeName(primitives.name),
      primitives.description ? new RecipeDescription(primitives.description) : null,
      primitives.items.map(RecipeItem.fromPrimitives),
      RecipeYield.fromPrimitives(primitives.recipeYield),
      primitives.isActive,
      primitives.createdAt,
      primitives.updatedAt
    )
  }

  private ensureHasItems(): void {
    this.ensureHasItemsArray(this.items)
  }

  private ensureHasItemsArray(items: RecipeItem[]): void {
    if (items.length === 0) {
      throw new Error('Recipe must have at least one item')
    }
  }
}
