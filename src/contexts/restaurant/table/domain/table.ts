import { AggregateRoot } from '@shared/domain/aggregate-root'
import { TableId } from './table-id'
import { TableNumber } from './table-number'
import { TableCapacity } from './table-capacity'
import { TableStatus } from './table-status'
import { TablePosition } from './table-position'
import { TableCreatedEvent } from './events/table-created.event'
import { TableUpdatedEvent } from './events/table-updated.event'
import { TableMovedEvent } from './events/table-moved.event'
import { TableStatusChangedEvent } from './events/table-status-changed.event'
import { TableOccupied } from './exceptions/table-occupied.exception'
import { TableInactive } from './exceptions/table-inactive.exception'
import { TableShape } from './table-shape'
import { TableRotation } from './table-rotation'

export interface TablePrimitives {
  id: string
  number: string
  capacity: number
  status: TableStatus
  shape: TableShape
  currentOrderId: string | null
  zoneId: string | null
  positionX: number | null
  positionY: number | null
  rotation: number
}

export class Table extends AggregateRoot {
  private constructor(
    public readonly id: TableId,
    private number: TableNumber,
    private capacity: TableCapacity,
    private status: TableStatus,
    private shape: TableShape,
    private currentOrderId: string | null,
    private zoneId: string | null,
    private positionX: TablePosition | null,
    private positionY: TablePosition | null,
    private rotation: TableRotation
  ) {
    super()
  }

  static create(
    id: string,
    number: string,
    capacity: number,
    shape: TableShape,
    zoneId?: string | null,
    positionX?: number | null,
    positionY?: number | null,
    rotation?: number
  ): Table {
    const table = Table.fromPrimitives({
      id,
      number,
      capacity,
      status: TableStatus.AVAILABLE,
      shape,
      currentOrderId: null,
      zoneId: zoneId ?? null,
      positionX: positionX ?? null,
      positionY: positionY ?? null,
      rotation: rotation ?? 0
    })

    table.record(new TableCreatedEvent({ tableId: id, number, capacity, zoneId: zoneId ?? null }))

    return table
  }

  update(
    number: string,
    capacity: number,
    shape: TableShape,
    zoneId?: string | null,
    positionX?: number | null,
    positionY?: number | null,
    rotation?: number
  ): Table {
    const updated = Table.fromPrimitives({
      id: this.id.value,
      number,
      capacity,
      status: this.status,
      shape,
      currentOrderId: this.currentOrderId,
      zoneId: zoneId ?? null,
      positionX: positionX ?? null,
      positionY: positionY ?? null,
      rotation: rotation ?? this.rotation.value
    })

    updated.record(
      new TableUpdatedEvent({ tableId: this.id.value, number, capacity, zoneId: zoneId ?? null })
    )

    return updated
  }

  move(positionX: number | null, positionY: number | null, rotation?: number): void {
    this.positionX = positionX !== null ? new TablePosition(positionX) : null
    this.positionY = positionY !== null ? new TablePosition(positionY) : null
    if (rotation !== undefined) {
      this.rotation = new TableRotation(rotation)
    }

    this.record(
      new TableMovedEvent({
        tableId: this.id.value,
        positionX,
        positionY,
        rotation: this.rotation.value
      })
    )
  }

  changeStatus(newStatus: TableStatus): void {
    if (this.status === TableStatus.OCCUPIED && newStatus === TableStatus.INACTIVE) {
      throw new TableOccupied(this.id.value)
    }

    const previousStatus = this.status
    this.status = newStatus

    this.record(
      new TableStatusChangedEvent({
        tableId: this.id.value,
        previousStatus,
        newStatus,
        orderId: this.currentOrderId ?? undefined
      })
    )
  }

  setCurrentOrder(orderId: string): void {
    this.currentOrderId = orderId
    this.status = TableStatus.OCCUPIED
  }

  clearCurrentOrder(): void {
    this.currentOrderId = null
    this.status = TableStatus.AVAILABLE
  }

  ensureIsAvailable(): void {
    if (this.status === TableStatus.INACTIVE) {
      throw new TableInactive(this.id.value)
    }
    if (this.status === TableStatus.OCCUPIED) {
      throw new TableOccupied(this.id.value)
    }
  }

  getStatus(): TableStatus {
    return this.status
  }

  getNumber(): string {
    return this.number.value
  }

  static fromPrimitives(primitives: TablePrimitives): Table {
    return new Table(
      new TableId(primitives.id),
      new TableNumber(primitives.number),
      new TableCapacity(primitives.capacity),
      primitives.status,
      primitives.shape,
      primitives.currentOrderId,
      primitives.zoneId,
      primitives.positionX !== null ? new TablePosition(primitives.positionX) : null,
      primitives.positionY !== null ? new TablePosition(primitives.positionY) : null,
      new TableRotation(primitives.rotation)
    )
  }

  toPrimitives(): TablePrimitives {
    return {
      id: this.id.value,
      number: this.number.value,
      capacity: this.capacity.value,
      status: this.status,
      shape: this.shape,
      currentOrderId: this.currentOrderId,
      zoneId: this.zoneId,
      positionX: this.positionX?.value ?? null,
      positionY: this.positionY?.value ?? null,
      rotation: this.rotation.value
    }
  }
}
