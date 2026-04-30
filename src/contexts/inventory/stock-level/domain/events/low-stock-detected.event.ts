import {
  DomainEvent,
  DomainEventFromPrimitivesParams,
  DomainEventMetadata
} from '@/shared/domain/events'

interface LowStockDetectedEventPayload {
  ingredientId: string
  currentQuantity: number
  minimumQuantity: number
  unitId: string
  detectedAt: Date
}

export class LowStockDetectedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'inventory.stock.low'
  static readonly VERSION = 1

  constructor(
    payload: LowStockDetectedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: LowStockDetectedEvent.EVENT_NAME,
      aggregateId: payload.ingredientId,
      version: LowStockDetectedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): LowStockDetectedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): LowStockDetectedEvent {
    return new LowStockDetectedEvent(
      params.payload as LowStockDetectedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
