import { EventBus } from '@shared/domain/events'
import { OptionGroup } from '../../domain/option-group'
import { OptionItem } from '../../domain/option-item'
import { OptionGroupRepository } from '../../domain/repositories/option-group.repository'

export interface CreateOptionGroupItem {
  id: string
  label: string
  ingredientId: string
  quantity: number
  unitId: string
  extraPrice: number
  sortOrder: number
  isActive?: boolean
}

export class CreateOptionGroup {
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

    const group = OptionGroup.create(
      id,
      name,
      type,
      required,
      minSelections,
      maxSelections,
      optionItems
    )

    await this.repository.save(group)
    await this.eventBus.publish(group.pullDomainEvents())
  }
}
