import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'
import { FloorElementType } from '../floor-element-type'

export interface FloorElementUpdatedPayload {
  floorElementId: string
  type: FloorElementType
  label: string | null
  isActive: boolean
}

export class FloorElementUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'floor_element.updated'
  static readonly VERSION = 1

  constructor(
    payload: FloorElementUpdatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: FloorElementUpdatedEvent.EVENT_NAME,
      aggregateId: payload.floorElementId,
      version: FloorElementUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): FloorElementUpdatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): FloorElementUpdatedEvent {
    return new FloorElementUpdatedEvent(
      params.payload as FloorElementUpdatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
