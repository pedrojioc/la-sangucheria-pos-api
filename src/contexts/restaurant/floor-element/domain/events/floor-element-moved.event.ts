import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface FloorElementMovedPayload {
  floorElementId: string
  positionX: number
  positionY: number
  rotation: number
}

export class FloorElementMovedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'floor_element.moved'
  static readonly VERSION = 1

  constructor(
    payload: FloorElementMovedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: FloorElementMovedEvent.EVENT_NAME,
      aggregateId: payload.floorElementId,
      version: FloorElementMovedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): FloorElementMovedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): FloorElementMovedEvent {
    return new FloorElementMovedEvent(
      params.payload as FloorElementMovedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
