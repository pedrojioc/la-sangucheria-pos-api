import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface TableCreatedPayload {
  tableId: string
  number: string
  capacity: number
  zoneId: string | null
}

export class TableCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'table.created'
  static readonly VERSION = 1

  constructor(
    payload: TableCreatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: TableCreatedEvent.EVENT_NAME,
      aggregateId: payload.tableId,
      version: TableCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): TableCreatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): TableCreatedEvent {
    return new TableCreatedEvent(
      params.payload as TableCreatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
