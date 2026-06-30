import { DeactivateOptionGroup } from '@contexts/menu/product-option/application/deactivate/deactivate-option-group'
import { OptionGroupRepository } from '@contexts/menu/product-option/domain/repositories/option-group.repository'
import { EventBus } from '@shared/domain/events'
import { OptionGroupNotFound } from '@contexts/menu/product-option/domain/exceptions/option-group-not-found.exception'
import { OptionGroupAssignedToProducts } from '@contexts/menu/product-option/domain/exceptions/option-group-assigned-to-products.exception'
import { OptionGroupDeactivatedEvent } from '@contexts/menu/product-option/domain/events/option-group-deactivated.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OptionGroupMother } from '../__mothers__/option-group.mother'

describe('DeactivateOptionGroup', () => {
  let useCase: DeactivateOptionGroup
  let repository: jest.Mocked<OptionGroupRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchAll: jest.fn(),
      findByIds: jest.fn(),
      delete: jest.fn(),
      isAssignedToAnyProduct: jest.fn().mockResolvedValue(false)
    } as any
    eventBus = { publish: jest.fn() } as any
    useCase = new DeactivateOptionGroup(repository, eventBus)
  })

  it('should deactivate an existing group', async () => {
    const group = OptionGroupMother.random()
    repository.search.mockResolvedValue(group)

    await useCase.run(group.id.value)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0]
    expect(saved.toPrimitives().isActive).toBe(false)
  })

  it('should publish OptionGroupDeactivatedEvent', async () => {
    const group = OptionGroupMother.random()
    repository.search.mockResolvedValue(group)

    await useCase.run(group.id.value)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events[0]).toBeInstanceOf(OptionGroupDeactivatedEvent)
    expect(events[0].eventName).toBe('option_group.deactivated')
  })

  it('should throw OptionGroupNotFound when group does not exist', async () => {
    repository.search.mockResolvedValue(null)

    await expect(useCase.run(UuidMother.random())).rejects.toThrow(OptionGroupNotFound)

    expect(repository.save).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })

  it('should throw OptionGroupAssignedToProducts when group is still assigned', async () => {
    const group = OptionGroupMother.random()
    repository.search.mockResolvedValue(group)
    repository.isAssignedToAnyProduct.mockResolvedValue(true)

    await expect(useCase.run(group.id.value)).rejects.toThrow(OptionGroupAssignedToProducts)

    expect(repository.save).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })
})
