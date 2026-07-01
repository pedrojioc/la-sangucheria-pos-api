import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface EstablishmentSettingsUpdatedPayload {
  id: string
  name: string
}

export class EstablishmentSettingsUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'establishment.settings.updated'
  static readonly VERSION = 1

  constructor(
    payload: EstablishmentSettingsUpdatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: EstablishmentSettingsUpdatedEvent.EVENT_NAME,
      aggregateId: payload.id,
      version: EstablishmentSettingsUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): EstablishmentSettingsUpdatedPayload {
    return this.payload
  }

  static fromPrimitives(
    params: DomainEventFromPrimitivesParams
  ): EstablishmentSettingsUpdatedEvent {
    return new EstablishmentSettingsUpdatedEvent(
      params.payload as EstablishmentSettingsUpdatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
