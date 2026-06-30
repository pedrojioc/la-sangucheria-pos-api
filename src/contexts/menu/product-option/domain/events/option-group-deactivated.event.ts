import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OptionGroupDeactivatedPayload {
  optionGroupId: string
}

export class OptionGroupDeactivatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'option_group.deactivated'
  static readonly VERSION = 1

  constructor(
    payload: OptionGroupDeactivatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OptionGroupDeactivatedEvent.EVENT_NAME,
      aggregateId: payload.optionGroupId,
      version: OptionGroupDeactivatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OptionGroupDeactivatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OptionGroupDeactivatedEvent {
    return new OptionGroupDeactivatedEvent(
      params.payload as OptionGroupDeactivatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
