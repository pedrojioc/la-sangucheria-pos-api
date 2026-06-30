import { faker } from '@faker-js/faker'
import {
  OptionGroup,
  OptionGroupPrimitives
} from '@contexts/menu/product-option/domain/option-group'
import { OptionItem } from '@contexts/menu/product-option/domain/option-item'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OptionItemMother } from './option-item.mother'

export class OptionGroupMother {
  static create(params: Partial<OptionGroupPrimitives> = {}): OptionGroup {
    const id = params.id ?? UuidMother.random()
    const type = params.type ?? 'ADD'
    const items = params.items
      ? params.items.map(i => OptionItem.fromPrimitives(i))
      : [
          OptionItem.fromPrimitives(
            OptionItemMother.create({ groupId: id, extraPrice: type === 'SWAP' ? 0 : 0 })
          ),
          OptionItem.fromPrimitives(
            OptionItemMother.create({
              groupId: id,
              sortOrder: 1,
              extraPrice: type === 'SWAP' ? 0 : 500
            })
          )
        ]

    return OptionGroup.fromPrimitives({
      id,
      name: params.name ?? faker.commerce.department(),
      type,
      required: params.required ?? false,
      minSelections: params.minSelections ?? 0,
      maxSelections: params.maxSelections ?? 3,
      isActive: params.isActive ?? true,
      items: items.map(i => i.toPrimitives()),
      createdAt: params.createdAt ?? new Date(),
      updatedAt: params.updatedAt ?? new Date()
    })
  }

  static random(): OptionGroup {
    return this.create()
  }

  static withSwapType(): OptionGroup {
    const id = UuidMother.random()
    return this.create({
      id,
      type: 'SWAP',
      required: true,
      minSelections: 1,
      maxSelections: 1,
      items: [
        OptionItemMother.create({ groupId: id, extraPrice: 0, sortOrder: 0 }),
        OptionItemMother.create({ groupId: id, extraPrice: 0, sortOrder: 1 }),
        OptionItemMother.create({ groupId: id, extraPrice: 0, sortOrder: 2 })
      ]
    })
  }

  static withAddType(): OptionGroup {
    return this.create({ type: 'ADD', required: false, minSelections: 0, maxSelections: 3 })
  }

  static required(): OptionGroup {
    return this.create({ required: true, minSelections: 1, maxSelections: 1 })
  }

  static inactive(): OptionGroup {
    return this.create({ isActive: false })
  }
}
