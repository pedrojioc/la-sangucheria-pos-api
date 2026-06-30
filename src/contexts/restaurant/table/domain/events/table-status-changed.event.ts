import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'
import { TableStatus } from '../table-status'

export interface TableStatusChangedPayload {
  tableId: string
  previousStatus: TableStatus
  newStatus: TableStatus
  orderId?: string
}

export class TableStatusChangedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'table.status_changed'
  static readonly VERSION = 1

  constructor(
    payload: TableStatusChangedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: TableStatusChangedEvent.EVENT_NAME,
      aggregateId: payload.tableId,
      version: TableStatusChangedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): TableStatusChangedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): TableStatusChangedEvent {
    return new TableStatusChangedEvent(
      params.payload as TableStatusChangedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
