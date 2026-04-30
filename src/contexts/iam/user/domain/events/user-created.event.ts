import { DomainEvent } from '@/shared/domain/events/domain-event'

export class UserCreatedEvent extends DomainEvent {
  static EVENT_NAME = 'user.created'

  constructor(params: { userId: string; username: string; email: string; occurredOn?: Date }) {
    super({
      eventName: UserCreatedEvent.EVENT_NAME,
      aggregateId: params.userId,
      payload: {
        userId: params.userId,
        username: params.username,
        email: params.email
      },
      occurredOn: params.occurredOn
    })
  }

  toPrimitives() {
    return {
      userId: this.payload.userId,
      username: this.payload.username,
      email: this.payload.email
    }
  }
}
