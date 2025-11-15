import { UnitTypeEnum } from '../../domain/unit-type'

export class CreateUnitCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly symbol: string,
    public readonly type: UnitTypeEnum,
    public readonly isActive: boolean
  ) {}
}
