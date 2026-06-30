import { UnitListItem } from '../../../application/dto/unit-list-item'

export class UnitListItemResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly symbol: string,
    public readonly type: string,
    public readonly isActive: boolean
  ) {}

  static fromReadModel(item: UnitListItem): UnitListItemResponse {
    return new UnitListItemResponse(item.id, item.name, item.symbol, item.type, item.isActive)
  }
}
