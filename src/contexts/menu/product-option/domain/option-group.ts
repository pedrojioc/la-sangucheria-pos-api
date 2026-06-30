import { AggregateRoot } from '@shared/domain/aggregate-root'
import { OptionGroupId } from './option-group-id'
import { OptionGroupName } from './option-group-name'
import { OptionGroupType, OptionGroupTypeValue } from './option-group-type'
import { OptionItem, OptionItemPrimitives } from './option-item'
import { OptionGroupMustHaveItems } from './exceptions/option-group-must-have-items.exception'
import { SwapItemCannotHaveExtraPrice } from './exceptions/swap-item-cannot-have-extra-price.exception'
import { InvalidSelectionConstraints } from './exceptions/invalid-selection-constraints.exception'
import { OptionGroupCreatedEvent } from './events/option-group-created.event'
import { OptionGroupUpdatedEvent } from './events/option-group-updated.event'
import { OptionGroupDeactivatedEvent } from './events/option-group-deactivated.event'

export interface OptionGroupPrimitives {
  id: string
  name: string
  type: OptionGroupTypeValue
  required: boolean
  minSelections: number
  maxSelections: number
  isActive: boolean
  items: OptionItemPrimitives[]
  createdAt: Date
  updatedAt: Date
}

export class OptionGroup extends AggregateRoot {
  private constructor(
    public readonly id: OptionGroupId,
    private name: OptionGroupName,
    private type: OptionGroupType,
    private required: boolean,
    private minSelections: number,
    private maxSelections: number,
    private items: OptionItem[],
    private isActive: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super()
  }

  static create(
    id: string,
    name: string,
    type: OptionGroupTypeValue,
    required: boolean,
    minSelections: number,
    maxSelections: number,
    items: OptionItem[]
  ): OptionGroup {
    const groupType = new OptionGroupType(type)

    OptionGroup.ensureHasItems(items)
    OptionGroup.ensureValidConstraints(minSelections, maxSelections)
    if (groupType.isSwap()) {
      OptionGroup.ensureSwapItemsHaveNoExtraPrice(items)
    }

    const group = new OptionGroup(
      new OptionGroupId(id),
      new OptionGroupName(name),
      groupType,
      required,
      minSelections,
      maxSelections,
      items,
      true,
      new Date(),
      new Date()
    )

    group.record(
      new OptionGroupCreatedEvent({
        optionGroupId: id,
        name,
        type,
        required,
        itemsCount: items.length
      })
    )

    return group
  }

  update(
    name: string,
    type: OptionGroupTypeValue,
    required: boolean,
    minSelections: number,
    maxSelections: number,
    items: OptionItem[]
  ): void {
    const groupType = new OptionGroupType(type)

    OptionGroup.ensureHasItems(items)
    OptionGroup.ensureValidConstraints(minSelections, maxSelections)
    if (groupType.isSwap()) {
      OptionGroup.ensureSwapItemsHaveNoExtraPrice(items)
    }

    this.name = new OptionGroupName(name)
    this.type = groupType
    this.required = required
    this.minSelections = minSelections
    this.maxSelections = maxSelections
    this.items = items
    this.updatedAt = new Date()

    this.record(
      new OptionGroupUpdatedEvent({
        optionGroupId: this.id.value,
        name,
        type,
        itemsCount: items.length
      })
    )
  }

  deactivate(): void {
    this.isActive = false
    this.updatedAt = new Date()

    this.record(
      new OptionGroupDeactivatedEvent({
        optionGroupId: this.id.value
      })
    )
  }

  getItems(): OptionItem[] {
    return [...this.items]
  }

  getName(): string {
    return this.name.value
  }

  getType(): OptionGroupTypeValue {
    return this.type.value
  }

  isRequired(): boolean {
    return this.required
  }

  getMinSelections(): number {
    return this.minSelections
  }

  getMaxSelections(): number {
    return this.maxSelections
  }

  toPrimitives(): OptionGroupPrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      type: this.type.value,
      required: this.required,
      minSelections: this.minSelections,
      maxSelections: this.maxSelections,
      isActive: this.isActive,
      items: this.items.map(item => item.toPrimitives()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  static fromPrimitives(primitives: OptionGroupPrimitives): OptionGroup {
    return new OptionGroup(
      new OptionGroupId(primitives.id),
      new OptionGroupName(primitives.name),
      new OptionGroupType(primitives.type),
      primitives.required,
      primitives.minSelections,
      primitives.maxSelections,
      primitives.items.map(OptionItem.fromPrimitives),
      primitives.isActive,
      primitives.createdAt,
      primitives.updatedAt
    )
  }

  private static ensureHasItems(items: OptionItem[]): void {
    if (items.length === 0) {
      throw new OptionGroupMustHaveItems()
    }
  }

  private static ensureValidConstraints(min: number, max: number): void {
    if (max < min) {
      throw new InvalidSelectionConstraints(min, max)
    }
  }

  private static ensureSwapItemsHaveNoExtraPrice(items: OptionItem[]): void {
    if (items.some(item => item.hasExtraPrice())) {
      throw new SwapItemCannotHaveExtraPrice()
    }
  }
}
