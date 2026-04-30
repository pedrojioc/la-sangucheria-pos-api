import { DomainEvent } from '@/shared/domain/events/domain-event'

export class UserPasswordChangedEvent extends DomainEvent {
  static EVENT_NAME = 'user.password_changed'

  constructor(params: { userId: string; occurredOn?: Date }) {
    super({
      eventName: UserPasswordChangedEvent.EVENT_NAME,
      aggregateId: params.userId,
      payload: {
        userId: params.userId
      },
      occurredOn: params.occurredOn
    })
  }

  toPrimitives() {
    return {
      userId: this.payload.userId
    }
  }
}
