import {
  DomainEvent,
  DomainEventFromPrimitivesParams,
  DomainEventMetadata
} from '@/shared/domain/events'
import { MovementType } from '../movement-type'

interface InventoryMovementCreatedEventPayload {
  movementId: string
  ingredientId: string
  batchId: string | null
  type: MovementType
  quantity: number
  unitId: string
  unitCost: number
  currency: string
  totalCost: number
  reason: string | null
  referenceId: string | null
  performedBy: string | null
  performedAt: Date
}

export class InventoryMovementCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'inventory.movement.created'
  static readonly VERSION = 1

  constructor(
    payload: InventoryMovementCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: InventoryMovementCreatedEvent.EVENT_NAME,
      aggregateId: payload.movementId,
      version: InventoryMovementCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): InventoryMovementCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): InventoryMovementCreatedEvent {
    return new InventoryMovementCreatedEvent(
      params.payload as InventoryMovementCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
