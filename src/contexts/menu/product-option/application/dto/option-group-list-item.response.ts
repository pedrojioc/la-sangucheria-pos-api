import { OptionGroupListItem, OptionItemListData } from './option-group-list-item'

export interface OptionItemListItemData {
  id: string
  groupId: string
  label: string
  ingredientId: string
  quantity: number
  unitId: string
  extraPrice: number
  sortOrder: number
  isActive: boolean
}

export class OptionGroupListItemResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: 'SWAP' | 'ADD',
    public readonly required: boolean,
    public readonly minSelections: number,
    public readonly maxSelections: number,
    public readonly isActive: boolean,
    public readonly items: OptionItemListData[]
  ) {}

  static fromReadModel(item: OptionGroupListItem): OptionGroupListItemResponse {
    return new OptionGroupListItemResponse(
      item.id,
      item.name,
      item.type,
      item.required,
      item.minSelections,
      item.maxSelections,
      item.isActive,
      item.items
    )
  }
}
