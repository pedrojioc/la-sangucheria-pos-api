export interface OptionItemListData {
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

export class OptionGroupListItem {
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
}
