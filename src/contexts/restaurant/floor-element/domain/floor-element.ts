import { AggregateRoot } from '@shared/domain/aggregate-root'
import { FloorElementId } from './floor-element-id'
import { FloorElementType } from './floor-element-type'
import { FloorElementPosition } from './floor-element-position'
import { FloorElementSize } from './floor-element-size'
import { FloorElementRotation } from './floor-element-rotation'
import { FloorElementCreatedEvent } from './events/floor-element-created.event'
import { FloorElementUpdatedEvent } from './events/floor-element-updated.event'
import { FloorElementMovedEvent } from './events/floor-element-moved.event'

export interface FloorElementPrimitives {
  id: string
  zoneId: string
  type: FloorElementType
  label: string | null
  positionX: number
  positionY: number
  width: number
  height: number
  rotation: number
  color: string | null
  isActive: boolean
}

export class FloorElement extends AggregateRoot {
  private constructor(
    public readonly id: FloorElementId,
    private zoneId: string,
    private type: FloorElementType,
    private label: string | null,
    private positionX: FloorElementPosition,
    private positionY: FloorElementPosition,
    private width: FloorElementSize,
    private height: FloorElementSize,
    private rotation: FloorElementRotation,
    private color: string | null,
    private isActive: boolean
  ) {
    super()
  }

  static create(
    id: string,
    zoneId: string,
    type: FloorElementType,
    label: string | null,
    positionX: number,
    positionY: number,
    width: number,
    height: number,
    rotation: number,
    color: string | null
  ): FloorElement {
    const element = FloorElement.fromPrimitives({
      id,
      zoneId,
      type,
      label,
      positionX,
      positionY,
      width,
      height,
      rotation,
      color,
      isActive: true
    })

    element.record(new FloorElementCreatedEvent({ floorElementId: id, zoneId, type }))

    return element
  }

  update(
    type: FloorElementType,
    label: string | null,
    positionX: number,
    positionY: number,
    width: number,
    height: number,
    rotation: number,
    color: string | null,
    isActive: boolean
  ): FloorElement {
    const updated = FloorElement.fromPrimitives({
      id: this.id.value,
      zoneId: this.zoneId,
      type,
      label,
      positionX,
      positionY,
      width,
      height,
      rotation,
      color,
      isActive
    })

    updated.record(
      new FloorElementUpdatedEvent({ floorElementId: this.id.value, type, label, isActive })
    )

    return updated
  }

  move(positionX: number, positionY: number, rotation?: number): void {
    this.positionX = new FloorElementPosition(positionX)
    this.positionY = new FloorElementPosition(positionY)
    if (rotation !== undefined) {
      this.rotation = new FloorElementRotation(rotation)
    }

    this.record(
      new FloorElementMovedEvent({
        floorElementId: this.id.value,
        positionX,
        positionY,
        rotation: this.rotation.value
      })
    )
  }

  static fromPrimitives(primitives: FloorElementPrimitives): FloorElement {
    return new FloorElement(
      new FloorElementId(primitives.id),
      primitives.zoneId,
      primitives.type,
      primitives.label,
      new FloorElementPosition(primitives.positionX),
      new FloorElementPosition(primitives.positionY),
      new FloorElementSize(primitives.width),
      new FloorElementSize(primitives.height),
      new FloorElementRotation(primitives.rotation),
      primitives.color,
      primitives.isActive
    )
  }

  toPrimitives(): FloorElementPrimitives {
    return {
      id: this.id.value,
      zoneId: this.zoneId,
      type: this.type,
      label: this.label,
      positionX: this.positionX.value,
      positionY: this.positionY.value,
      width: this.width.value,
      height: this.height.value,
      rotation: this.rotation.value,
      color: this.color,
      isActive: this.isActive
    }
  }
}
