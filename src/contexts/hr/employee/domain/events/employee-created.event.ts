import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface EmployeeCreatedEventPayload {
  employeeId: string
  firstName: string
  lastName: string
}

export class EmployeeCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'employee.created'
  static readonly VERSION = 1

  constructor(
    payload: EmployeeCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: EmployeeCreatedEvent.EVENT_NAME,
      aggregateId: payload.employeeId,
      version: EmployeeCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): EmployeeCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): EmployeeCreatedEvent {
    return new EmployeeCreatedEvent(
      params.payload as EmployeeCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
