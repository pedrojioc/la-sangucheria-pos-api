import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface UnitDeletedEventPayload {
  unitId: string
  name: string
}

export class UnitDeletedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'unit.deleted'
  static readonly VERSION = 1

  constructor(
    payload: UnitDeletedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: UnitDeletedEvent.EVENT_NAME,
      aggregateId: payload.unitId,
      version: UnitDeletedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): UnitDeletedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): UnitDeletedEvent {
    return new UnitDeletedEvent(
      params.payload as UnitDeletedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
