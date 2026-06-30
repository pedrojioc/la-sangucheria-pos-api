import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface EmployeeAccessGrantedEventPayload {
  employeeId: string
  userId: string
}

export class EmployeeAccessGrantedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'employee.access_granted'
  static readonly VERSION = 1

  constructor(
    payload: EmployeeAccessGrantedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: EmployeeAccessGrantedEvent.EVENT_NAME,
      aggregateId: payload.employeeId,
      version: EmployeeAccessGrantedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): EmployeeAccessGrantedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): EmployeeAccessGrantedEvent {
    return new EmployeeAccessGrantedEvent(
      params.payload as EmployeeAccessGrantedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
