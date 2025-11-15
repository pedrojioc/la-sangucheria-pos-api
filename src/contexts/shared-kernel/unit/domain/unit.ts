import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { UnitId } from './unit-id'
import { UnitName } from './unit-name'
import { UnitSymbol } from './unit-symbol'
import { UnitType, UnitTypeEnum } from './unit-type'
import { UnitIsActive } from './unit-is-active'
import { UnitCreatedEvent } from './events/unit-created.event'
import { UnitUpdatedEvent } from './events/unit-updated.event'
import { UnitDeletedEvent } from './events/unit-deleted.event'

export interface UnitPrimitives {
  id: string
  name: string
  symbol: string
  type: UnitTypeEnum
  isActive: boolean
}

export class Unit extends AggregateRoot {
  private constructor(
    public readonly id: UnitId,
    private name: UnitName,
    private symbol: UnitSymbol,
    private type: UnitType,
    private isActive: UnitIsActive
  ) {
    super()
  }

  static create(
    id: string,
    name: string,
    symbol: string,
    type: UnitTypeEnum,
    isActive: boolean
  ): Unit {
    const unit = Unit.fromPrimitives({
      id,
      name,
      symbol,
      type,
      isActive
    })

    unit.record(
      new UnitCreatedEvent({
        unitId: id,
        name,
        symbol,
        type
      })
    )

    return unit
  }

  static fromPrimitives(primitives: UnitPrimitives): Unit {
    return new Unit(
      new UnitId(primitives.id),
      new UnitName(primitives.name),
      new UnitSymbol(primitives.symbol),
      new UnitType(primitives.type),
      new UnitIsActive(primitives.isActive)
    )
  }

  update(name: string, symbol: string, type: UnitTypeEnum, isActive: boolean): void {
    this.name = new UnitName(name)
    this.symbol = new UnitSymbol(symbol)
    this.type = new UnitType(type)
    this.isActive = new UnitIsActive(isActive)

    this.record(
      new UnitUpdatedEvent({
        unitId: this.id.value,
        name,
        symbol,
        type
      })
    )
  }

  delete(): void {
    this.record(
      new UnitDeletedEvent({
        unitId: this.id.value,
        name: this.name.value
      })
    )
  }

  toPrimitives(): UnitPrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      symbol: this.symbol.value,
      type: this.type.value,
      isActive: this.isActive.value
    }
  }
}
