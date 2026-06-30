import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OptionGroupCreatedPayload {
  optionGroupId: string
  name: string
  type: 'SWAP' | 'ADD'
  required: boolean
  itemsCount: number
}

export class OptionGroupCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'option_group.created'
  static readonly VERSION = 1

  constructor(
    payload: OptionGroupCreatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OptionGroupCreatedEvent.EVENT_NAME,
      aggregateId: payload.optionGroupId,
      version: OptionGroupCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OptionGroupCreatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OptionGroupCreatedEvent {
    return new OptionGroupCreatedEvent(
      params.payload as OptionGroupCreatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
