import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface TableMovedPayload {
  tableId: string
  positionX: number | null
  positionY: number | null
  rotation: number
}

export class TableMovedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'table.moved'
  static readonly VERSION = 1

  constructor(
    payload: TableMovedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: TableMovedEvent.EVENT_NAME,
      aggregateId: payload.tableId,
      version: TableMovedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): TableMovedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): TableMovedEvent {
    return new TableMovedEvent(
      params.payload as TableMovedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
