import { OptionSelectionValidator } from '@contexts/menu/product-option/domain/services/option-selection-validator'
import { MissingRequiredOptionGroup } from '@contexts/menu/product-option/domain/exceptions/missing-required-option-group.exception'
import { OptionGroupSelectionExceeded } from '@contexts/menu/product-option/domain/exceptions/option-group-selection-exceeded.exception'
import { OptionItemNotValidForProduct } from '@contexts/menu/product-option/domain/exceptions/option-item-not-valid-for-product.exception'
import { OptionGroupMother } from '../__mothers__/option-group.mother'
import { OptionItemMother } from '../__mothers__/option-item.mother'
import { OptionGroup } from '@contexts/menu/product-option/domain/option-group'
import { OptionItem } from '@contexts/menu/product-option/domain/option-item'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('OptionSelectionValidator', () => {
  let validator: OptionSelectionValidator

  beforeEach(() => {
    validator = new OptionSelectionValidator()
  })

  it('should pass validation when required group has exactly minSelections selected', () => {
    const groupId = UuidMother.random()
    const item1 = OptionItemMother.create({ groupId, extraPrice: 0, sortOrder: 0 })
    const item2 = OptionItemMother.create({ groupId, extraPrice: 0, sortOrder: 1 })
    const group = OptionGroup.fromPrimitives({
      id: groupId,
      name: 'Tipo de pan',
      type: 'SWAP',
      required: true,
      minSelections: 1,
      maxSelections: 1,
      isActive: true,
      items: [item1, item2],
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const result = validator.validate([group], [{ itemId: item1.id }])

    expect(result).toHaveLength(0)
  })

  it('should pass validation when optional group has no selections', () => {
    const groupId = UuidMother.random()
    const item = OptionItemMother.create({ groupId, extraPrice: 500 })
    const group = OptionGroup.fromPrimitives({
      id: groupId,
      name: 'Extras',
      type: 'ADD',
      required: false,
      minSelections: 0,
      maxSelections: 3,
      isActive: true,
      items: [item],
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const result = validator.validate([group], [])

    expect(result).toHaveLength(0)
  })

  it('should throw MissingRequiredOptionGroup when required group has no selections', () => {
    const groupId = UuidMother.random()
    const item = OptionItemMother.create({ groupId, extraPrice: 0 })
    const group = OptionGroup.fromPrimitives({
      id: groupId,
      name: 'Tipo de pan',
      type: 'SWAP',
      required: true,
      minSelections: 1,
      maxSelections: 1,
      isActive: true,
      items: [item],
      createdAt: new Date(),
      updatedAt: new Date()
    })

    expect(() => validator.validate([group], [])).toThrow(MissingRequiredOptionGroup)
    expect(() => validator.validate([group], [])).toThrow('Tipo de pan')
  })

  it('should throw OptionGroupSelectionExceeded when too many items selected from a group', () => {
    const groupId = UuidMother.random()
    const item1 = OptionItemMother.create({ groupId, extraPrice: 500, sortOrder: 0 })
    const item2 = OptionItemMother.create({ groupId, extraPrice: 500, sortOrder: 1 })
    const item3 = OptionItemMother.create({ groupId, extraPrice: 500, sortOrder: 2 })
    const group = OptionGroup.fromPrimitives({
      id: groupId,
      name: 'Extras',
      type: 'ADD',
      required: false,
      minSelections: 0,
      maxSelections: 2,
      isActive: true,
      items: [item1, item2, item3],
      createdAt: new Date(),
      updatedAt: new Date()
    })

    expect(() =>
      validator.validate(
        [group],
        [{ itemId: item1.id }, { itemId: item2.id }, { itemId: item3.id }]
      )
    ).toThrow(OptionGroupSelectionExceeded)
  })

  it('should throw OptionItemNotValidForProduct when selected item is not in any assigned group', () => {
    const group = OptionGroupMother.withSwapType()
    const foreignItemId = UuidMother.random()

    expect(() => validator.validate([group], [{ itemId: foreignItemId }])).toThrow(
      OptionItemNotValidForProduct
    )
  })

  it('should throw OptionItemNotValidForProduct when selected item is inactive', () => {
    const groupId = UuidMother.random()
    const inactiveItem = OptionItemMother.inactive()
    const inactiveItemWithGroup = { ...inactiveItem, groupId }
    const group = OptionGroup.fromPrimitives({
      id: groupId,
      name: 'Tipo de pan',
      type: 'SWAP',
      required: false,
      minSelections: 0,
      maxSelections: 1,
      isActive: true,
      items: [inactiveItemWithGroup],
      createdAt: new Date(),
      updatedAt: new Date()
    })

    expect(() => validator.validate([group], [{ itemId: inactiveItemWithGroup.id }])).toThrow(
      OptionItemNotValidForProduct
    )
  })
})
