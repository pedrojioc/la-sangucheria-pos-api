import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface StationUpdatedPayload {
  stationId: string
  name: string
  displayOrder: number
  isActive: boolean
  color: string | null
  outputDevice?: string
  printerAddress?: string | null
  connectionType?: string
  usbIdentifier?: string | null
}

export class StationUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'station.updated'
  static readonly VERSION = 1

  constructor(
    payload: StationUpdatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: StationUpdatedEvent.EVENT_NAME,
      aggregateId: payload.stationId,
      version: StationUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): StationUpdatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): StationUpdatedEvent {
    return new StationUpdatedEvent(
      params.payload as StationUpdatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
