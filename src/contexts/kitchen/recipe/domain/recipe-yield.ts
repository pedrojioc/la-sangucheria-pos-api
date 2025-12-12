import { Quantity } from '@/shared/domain/value-objects/quantity'
import { InvalidRecipeYield } from './exceptions/invalid-recipe-yield.exception'

export class RecipeYield {
  constructor(
    public readonly quantity: Quantity,
    public readonly description: string | null = null
  ) {
    this.ensureQuantityIsValid(quantity)
  }

  static create(value: number, unitId: string, description?: string): RecipeYield {
    return new RecipeYield(new Quantity(value, unitId), description ?? null)
  }

  equals(other: unknown): boolean {
    if (!(other instanceof RecipeYield)) {
      return false
    }
    return this.quantity.equals(other.quantity)
  }

  toPrimitives(): {
    value: number
    unitId: string
    description: string | null
  } {
    return {
      value: this.quantity.value,
      unitId: this.quantity.unitId,
      description: this.description
    }
  }

  static fromPrimitives(data: {
    value: number
    unitId: string
    description?: string | null
  }): RecipeYield {
    return new RecipeYield(new Quantity(data.value, data.unitId), data.description ?? null)
  }

  private ensureQuantityIsValid(quantity: Quantity): void {
    if (quantity.value <= 0) {
      throw new InvalidRecipeYield()
    }
  }
}
