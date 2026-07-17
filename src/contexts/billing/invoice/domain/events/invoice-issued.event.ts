import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'
import { DocumentType } from '../document-type'

export interface InvoiceIssuedPayload {
  invoiceId: string
  orderId: string
  cufeCude: string
  documentNumber: string
  documentType: DocumentType
  issuedAt: Date
}

export class InvoiceIssuedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'billing.invoice.issued'
  static readonly VERSION = 1

  constructor(
    payload: InvoiceIssuedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: InvoiceIssuedEvent.EVENT_NAME,
      aggregateId: payload.invoiceId,
      version: InvoiceIssuedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): InvoiceIssuedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): InvoiceIssuedEvent {
    return new InvoiceIssuedEvent(
      params.payload as InvoiceIssuedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
