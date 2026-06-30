import { EventBus } from '@shared/domain/events'
import { OptionGroupRepository } from '../../domain/repositories/option-group.repository'
import { OptionGroupId } from '../../domain/option-group-id'
import { OptionGroupNotFound } from '../../domain/exceptions/option-group-not-found.exception'
import { OptionGroupAssignedToProducts } from '../../domain/exceptions/option-group-assigned-to-products.exception'

export class DeactivateOptionGroup {
  constructor(
    private readonly repository: OptionGroupRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string): Promise<void> {
    const groupId = new OptionGroupId(id)
    const group = await this.repository.search(groupId)

    if (!group) {
      throw new OptionGroupNotFound(id)
    }

    const isAssigned = await this.repository.isAssignedToAnyProduct(groupId)

    if (isAssigned) {
      throw new OptionGroupAssignedToProducts(id)
    }

    group.deactivate()

    await this.repository.save(group)
    await this.eventBus.publish(group.pullDomainEvents())
  }
}
