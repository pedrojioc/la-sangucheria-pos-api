import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@shared/domain/events'

export interface InvoiceFailedPayload {
  invoiceId: string
  orderId: string
  reason: string
  attempts: number
  failedAt: Date
}

export class InvoiceFailedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'billing.invoice.failed'
  static readonly VERSION = 1

  constructor(
    payload: InvoiceFailedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: InvoiceFailedEvent.EVENT_NAME,
      aggregateId: payload.invoiceId,
      version: InvoiceFailedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): InvoiceFailedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): InvoiceFailedEvent {
    return new InvoiceFailedEvent(
      params.payload as InvoiceFailedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
