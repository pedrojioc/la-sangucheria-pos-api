import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface ZoneUpdatedPayload {
  zoneId: string
  name: string
  color: string
  sortIndex: number
  isActive: boolean
}

export class ZoneUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'zone.updated'
  static readonly VERSION = 1

  constructor(
    payload: ZoneUpdatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ZoneUpdatedEvent.EVENT_NAME,
      aggregateId: payload.zoneId,
      version: ZoneUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): ZoneUpdatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): ZoneUpdatedEvent {
    return new ZoneUpdatedEvent(
      params.payload as ZoneUpdatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
