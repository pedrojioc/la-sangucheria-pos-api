import { AggregateRoot } from '@shared/domain/aggregate-root'
import { ZoneId } from './zone-id'
import { ZoneName } from './zone-name'
import { ZoneColor } from './zone-color'
import { ZoneSortIndex } from './zone-sort-index'
import { ZoneIsActive } from './zone-is-active'
import { ZoneCreatedEvent } from './events/zone-created.event'
import { ZoneUpdatedEvent } from './events/zone-updated.event'

export interface ZonePrimitives {
  id: string
  name: string
  color: string
  sortIndex: number
  isActive: boolean
}

export class Zone extends AggregateRoot {
  private constructor(
    public readonly id: ZoneId,
    private name: ZoneName,
    private color: ZoneColor,
    private sortIndex: ZoneSortIndex,
    private isActive: ZoneIsActive
  ) {
    super()
  }

  static create(id: string, name: string, color: string, sortIndex: number): Zone {
    const zone = Zone.fromPrimitives({ id, name, color, sortIndex, isActive: true })
    zone.record(new ZoneCreatedEvent({ zoneId: id, name, color, sortIndex }))
    return zone
  }

  update(name: string, color: string, sortIndex: number, isActive: boolean): Zone {
    const updated = Zone.fromPrimitives({
      id: this.id.value,
      name,
      color,
      sortIndex,
      isActive
    })
    updated.record(
      new ZoneUpdatedEvent({ zoneId: this.id.value, name, color, sortIndex, isActive })
    )
    return updated
  }

  getName(): string {
    return this.name.value
  }

  static fromPrimitives(primitives: ZonePrimitives): Zone {
    return new Zone(
      new ZoneId(primitives.id),
      new ZoneName(primitives.name),
      new ZoneColor(primitives.color),
      new ZoneSortIndex(primitives.sortIndex),
      new ZoneIsActive(primitives.isActive)
    )
  }

  toPrimitives(): ZonePrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      color: this.color.value,
      sortIndex: this.sortIndex.value,
      isActive: this.isActive.value
    }
  }
}
