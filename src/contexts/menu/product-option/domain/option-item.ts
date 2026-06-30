import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@shared/domain/value-objects/quantity'
import { OptionItemId } from './option-item-id'
import { OptionGroupId } from './option-group-id'
import { OptionItemLabel } from './option-item-label'
import { OptionItemExtraPrice } from './option-item-extra-price'

export interface OptionItemPrimitives {
  id: string
  groupId: string
  label: string
  ingredientId: string
  quantity: number
  unitId: string
  extraPrice: number
  sortOrder: number
  isActive: boolean
}

export class OptionItem {
  constructor(
    public readonly id: OptionItemId,
    public readonly groupId: OptionGroupId,
    public readonly label: OptionItemLabel,
    public readonly ingredientId: IngredientId,
    public readonly quantity: Quantity,
    public readonly extraPrice: OptionItemExtraPrice,
    public readonly sortOrder: number,
    public readonly isActive: boolean
  ) {}

  static create(
    id: string,
    groupId: string,
    label: string,
    ingredientId: string,
    quantity: number,
    unitId: string,
    extraPrice: number,
    sortOrder: number,
    isActive = true
  ): OptionItem {
    return new OptionItem(
      new OptionItemId(id),
      new OptionGroupId(groupId),
      new OptionItemLabel(label),
      new IngredientId(ingredientId),
      new Quantity(quantity, unitId),
      new OptionItemExtraPrice(extraPrice),
      sortOrder,
      isActive
    )
  }

  hasExtraPrice(): boolean {
    return !this.extraPrice.isZero()
  }

  toPrimitives(): OptionItemPrimitives {
    return {
      id: this.id.value,
      groupId: this.groupId.value,
      label: this.label.value,
      ingredientId: this.ingredientId.value,
      quantity: this.quantity.value,
      unitId: this.quantity.unitId,
      extraPrice: this.extraPrice.value,
      sortOrder: this.sortOrder,
      isActive: this.isActive
    }
  }

  static fromPrimitives(primitives: OptionItemPrimitives): OptionItem {
    return new OptionItem(
      new OptionItemId(primitives.id),
      new OptionGroupId(primitives.groupId),
      new OptionItemLabel(primitives.label),
      new IngredientId(primitives.ingredientId),
      new Quantity(primitives.quantity, primitives.unitId),
      new OptionItemExtraPrice(primitives.extraPrice),
      primitives.sortOrder,
      primitives.isActive
    )
  }
}
