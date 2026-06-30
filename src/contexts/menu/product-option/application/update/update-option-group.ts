import { EventBus } from '@shared/domain/events'
import { OptionItem } from '../../domain/option-item'
import { OptionGroupRepository } from '../../domain/repositories/option-group.repository'
import { OptionGroupId } from '../../domain/option-group-id'
import { OptionGroupNotFound } from '../../domain/exceptions/option-group-not-found.exception'
import { CreateOptionGroupItem } from '../create/create-option-group'

export class UpdateOptionGroup {
  constructor(
    private readonly repository: OptionGroupRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    type: 'SWAP' | 'ADD',
    required: boolean,
    minSelections: number,
    maxSelections: number,
    items: CreateOptionGroupItem[]
  ): Promise<void> {
    const group = await this.repository.search(new OptionGroupId(id))

    if (!group) {
      throw new OptionGroupNotFound(id)
    }

    const optionItems = items.map(item =>
      OptionItem.create(
        item.id,
        id,
        item.label,
        item.ingredientId,
        item.quantity,
        item.unitId,
        item.extraPrice,
        item.sortOrder,
        item.isActive ?? true
      )
    )

    group.update(name, type, required, minSelections, maxSelections, optionItems)

    await this.repository.save(group)
    await this.eventBus.publish(group.pullDomainEvents())
  }
}
