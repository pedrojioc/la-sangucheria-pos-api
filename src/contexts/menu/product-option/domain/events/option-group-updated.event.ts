import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OptionGroupUpdatedPayload {
  optionGroupId: string
  name: string
  type: 'SWAP' | 'ADD'
  itemsCount: number
}

export class OptionGroupUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'option_group.updated'
  static readonly VERSION = 1

  constructor(
    payload: OptionGroupUpdatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OptionGroupUpdatedEvent.EVENT_NAME,
      aggregateId: payload.optionGroupId,
      version: OptionGroupUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OptionGroupUpdatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OptionGroupUpdatedEvent {
    return new OptionGroupUpdatedEvent(
      params.payload as OptionGroupUpdatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
