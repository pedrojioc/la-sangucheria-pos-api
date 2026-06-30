import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface ZoneCreatedPayload {
  zoneId: string
  name: string
  color: string
  sortIndex: number
}

export class ZoneCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'zone.created'
  static readonly VERSION = 1

  constructor(
    payload: ZoneCreatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ZoneCreatedEvent.EVENT_NAME,
      aggregateId: payload.zoneId,
      version: ZoneCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): ZoneCreatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): ZoneCreatedEvent {
    return new ZoneCreatedEvent(
      params.payload as ZoneCreatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
