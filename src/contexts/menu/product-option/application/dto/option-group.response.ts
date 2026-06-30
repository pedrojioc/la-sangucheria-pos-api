import { OptionGroup } from '../../domain/option-group'
import { OptionItemResponse } from './option-item.response'

export class OptionGroupResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: 'SWAP' | 'ADD',
    public readonly required: boolean,
    public readonly minSelections: number,
    public readonly maxSelections: number,
    public readonly isActive: boolean,
    public readonly items: OptionItemResponse[]
  ) {}

  static fromDomain(group: OptionGroup): OptionGroupResponse {
    const primitives = group.toPrimitives()
    return new OptionGroupResponse(
      primitives.id,
      primitives.name,
      primitives.type,
      primitives.required,
      primitives.minSelections,
      primitives.maxSelections,
      primitives.isActive,
      primitives.items.map(item => OptionItemResponse.fromPrimitives(item))
    )
  }
}
