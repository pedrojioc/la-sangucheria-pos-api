import {
  DomainEvent,
  DomainEventFromPrimitivesParams,
  DomainEventMetadata
} from '@/shared/domain/events'

interface OutOfStockEventPayload {
  ingredientId: string
  unitId: string
  detectedAt: Date
}

export class OutOfStockEvent extends DomainEvent {
  static readonly EVENT_NAME = 'inventory.stock.out'
  static readonly VERSION = 1

  constructor(
    payload: OutOfStockEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OutOfStockEvent.EVENT_NAME,
      aggregateId: payload.ingredientId,
      version: OutOfStockEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OutOfStockEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OutOfStockEvent {
    return new OutOfStockEvent(
      params.payload as OutOfStockEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
