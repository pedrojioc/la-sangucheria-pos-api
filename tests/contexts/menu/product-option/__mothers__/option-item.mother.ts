import { faker } from '@faker-js/faker'
import { OptionItemPrimitives } from '@contexts/menu/product-option/domain/option-item'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class OptionItemMother {
  static create(params: Partial<OptionItemPrimitives> = {}): OptionItemPrimitives {
    return {
      id: params.id ?? UuidMother.random(),
      groupId: params.groupId ?? UuidMother.random(),
      label: params.label ?? faker.commerce.productName(),
      ingredientId: params.ingredientId ?? UuidMother.random(),
      quantity: params.quantity ?? faker.number.float({ min: 0.01, max: 500, fractionDigits: 2 }),
      unitId: params.unitId ?? UuidMother.random(),
      extraPrice: params.extraPrice ?? 0,
      sortOrder: params.sortOrder ?? 0,
      isActive: params.isActive ?? true
    }
  }

  static withExtraPrice(extraPrice: number): OptionItemPrimitives {
    return this.create({ extraPrice })
  }

  static withNoExtraPrice(): OptionItemPrimitives {
    return this.create({ extraPrice: 0 })
  }

  static forGroup(groupId: string): OptionItemPrimitives {
    return this.create({ groupId })
  }

  static inactive(): OptionItemPrimitives {
    return this.create({ isActive: false })
  }
}
