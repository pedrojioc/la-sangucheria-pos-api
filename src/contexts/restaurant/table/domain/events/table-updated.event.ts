import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface TableUpdatedPayload {
  tableId: string
  number: string
  capacity: number
  zoneId: string | null
}

export class TableUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'table.updated'
  static readonly VERSION = 1

  constructor(
    payload: TableUpdatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: TableUpdatedEvent.EVENT_NAME,
      aggregateId: payload.tableId,
      version: TableUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): TableUpdatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): TableUpdatedEvent {
    return new TableUpdatedEvent(
      params.payload as TableUpdatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
