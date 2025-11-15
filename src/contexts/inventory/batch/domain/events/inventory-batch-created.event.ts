import {
  DomainEvent,
  DomainEventFromPrimitivesParams,
  DomainEventMetadata
} from '@/shared/domain/events'

interface InventoryBatchCreatedEventPayload {
  batchId: string
  ingredientId: string
  quantity: number
  unitId: string
  unitCost: number
  currency: string
  purchaseDate: Date
  expirationDate: Date | null
  supplierId: string | null
  referenceCode: string | null
}

export class InventoryBatchCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'inventory.batch.created'
  static readonly VERSION = 1

  constructor(
    payload: InventoryBatchCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: InventoryBatchCreatedEvent.EVENT_NAME,
      aggregateId: payload.batchId,
      version: InventoryBatchCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): InventoryBatchCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): InventoryBatchCreatedEvent {
    return new InventoryBatchCreatedEvent(
      params.payload as InventoryBatchCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
