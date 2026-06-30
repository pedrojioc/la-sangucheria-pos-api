import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'
import { FloorElementType } from '../floor-element-type'

export interface FloorElementCreatedPayload {
  floorElementId: string
  zoneId: string
  type: FloorElementType
}

export class FloorElementCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'floor_element.created'
  static readonly VERSION = 1

  constructor(
    payload: FloorElementCreatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: FloorElementCreatedEvent.EVENT_NAME,
      aggregateId: payload.floorElementId,
      version: FloorElementCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): FloorElementCreatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): FloorElementCreatedEvent {
    return new FloorElementCreatedEvent(
      params.payload as FloorElementCreatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
