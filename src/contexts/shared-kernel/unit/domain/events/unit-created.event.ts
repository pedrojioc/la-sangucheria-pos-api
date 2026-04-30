import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface UnitCreatedEventPayload {
  unitId: string
  name: string
  symbol: string
  type: string
}

export class UnitCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'unit.created'
  static readonly VERSION = 1

  constructor(
    payload: UnitCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: UnitCreatedEvent.EVENT_NAME,
      aggregateId: payload.unitId,
      version: UnitCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): UnitCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): UnitCreatedEvent {
    return new UnitCreatedEvent(
      params.payload as UnitCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
