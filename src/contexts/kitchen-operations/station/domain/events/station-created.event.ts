import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface StationCreatedPayload {
  stationId: string
  name: string
  displayOrder: number
  color: string | null
  outputDevice?: string
  printerAddress?: string | null
}

export class StationCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'station.created'
  static readonly VERSION = 1

  constructor(
    payload: StationCreatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: StationCreatedEvent.EVENT_NAME,
      aggregateId: payload.stationId,
      version: StationCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): StationCreatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): StationCreatedEvent {
    return new StationCreatedEvent(
      params.payload as StationCreatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
