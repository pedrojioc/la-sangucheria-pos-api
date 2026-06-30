import { CreateOptionGroup } from '@contexts/menu/product-option/application/create/create-option-group'
import { OptionGroupRepository } from '@contexts/menu/product-option/domain/repositories/option-group.repository'
import { EventBus } from '@shared/domain/events'
import { OptionGroup } from '@contexts/menu/product-option/domain/option-group'
import { OptionGroupCreatedEvent } from '@contexts/menu/product-option/domain/events/option-group-created.event'
import { OptionGroupMustHaveItems } from '@contexts/menu/product-option/domain/exceptions/option-group-must-have-items.exception'
import { SwapItemCannotHaveExtraPrice } from '@contexts/menu/product-option/domain/exceptions/swap-item-cannot-have-extra-price.exception'
import { InvalidSelectionConstraints } from '@contexts/menu/product-option/domain/exceptions/invalid-selection-constraints.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OptionItemMother } from '../__mothers__/option-item.mother'

describe('CreateOptionGroup', () => {
  let useCase: CreateOptionGroup
  let repository: jest.Mocked<OptionGroupRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = { save: jest.fn() } as any
    eventBus = { publish: jest.fn() } as any
    useCase = new CreateOptionGroup(repository, eventBus)
  })

  it('should create a valid SWAP group and save it', async () => {
    const id = UuidMother.random()
    const item1 = OptionItemMother.create({ groupId: id, extraPrice: 0, sortOrder: 0 })
    const item2 = OptionItemMother.create({ groupId: id, extraPrice: 0, sortOrder: 1 })
    const item3 = OptionItemMother.create({ groupId: id, extraPrice: 0, sortOrder: 2 })

    await useCase.run(id, 'Tipo de pan', 'SWAP', true, 1, 1, [item1, item2, item3])

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as OptionGroup
    const p = saved.toPrimitives()
    expect(p.id).toBe(id)
    expect(p.type).toBe('SWAP')
    expect(p.required).toBe(true)
    expect(p.items).toHaveLength(3)
  })

  it('should create a valid ADD group with extra prices', async () => {
    const id = UuidMother.random()
    const item = OptionItemMother.create({ groupId: id, extraPrice: 2000, sortOrder: 0 })

    await useCase.run(id, 'Extras', 'ADD', false, 0, 3, [item])

    const saved = repository.save.mock.calls[0][0] as OptionGroup
    const p = saved.toPrimitives()
    expect(p.type).toBe('ADD')
    expect(p.required).toBe(false)
    expect(p.items[0].extraPrice).toBe(2000)
  })

  it('should publish OptionGroupCreatedEvent', async () => {
    const id = UuidMother.random()
    const item = OptionItemMother.create({ groupId: id, extraPrice: 0 })

    await useCase.run(id, 'Tipo de pan', 'SWAP', true, 1, 1, [item])

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events).toHaveLength(1)
    expect(events[0]).toBeInstanceOf(OptionGroupCreatedEvent)
    expect(events[0].eventName).toBe('option_group.created')
  })

  it('should throw OptionGroupMustHaveItems when items array is empty', async () => {
    await expect(
      useCase.run(UuidMother.random(), 'Sin items', 'ADD', false, 0, 1, [])
    ).rejects.toThrow(OptionGroupMustHaveItems)

    expect(repository.save).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })

  it('should throw SwapItemCannotHaveExtraPrice when SWAP item has extraPrice > 0', async () => {
    const id = UuidMother.random()
    const item = OptionItemMother.withExtraPrice(500)

    await expect(useCase.run(id, 'Tipo de pan', 'SWAP', true, 1, 1, [item])).rejects.toThrow(
      SwapItemCannotHaveExtraPrice
    )

    expect(repository.save).not.toHaveBeenCalled()
  })

  it('should throw InvalidSelectionConstraints when maxSelections < minSelections', async () => {
    const id = UuidMother.random()
    const item = OptionItemMother.create({ groupId: id, extraPrice: 0 })

    await expect(useCase.run(id, 'Grupo', 'ADD', true, 3, 1, [item])).rejects.toThrow(
      InvalidSelectionConstraints
    )

    expect(repository.save).not.toHaveBeenCalled()
  })
})
