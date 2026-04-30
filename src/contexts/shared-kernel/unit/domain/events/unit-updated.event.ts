import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface UnitUpdatedEventPayload {
  unitId: string
  name: string
  symbol: string
  type: string
}

export class UnitUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'unit.updated'
  static readonly VERSION = 1

  constructor(
    payload: UnitUpdatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: UnitUpdatedEvent.EVENT_NAME,
      aggregateId: payload.unitId,
      version: UnitUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): UnitUpdatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): UnitUpdatedEvent {
    return new UnitUpdatedEvent(
      params.payload as UnitUpdatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
