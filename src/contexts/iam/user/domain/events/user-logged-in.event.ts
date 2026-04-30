import { DomainEvent } from '@/shared/domain/events/domain-event'

export class UserLoggedInEvent extends DomainEvent {
  static EVENT_NAME = 'user.logged_in'

  constructor(params: { userId: string; loginAt: Date; occurredOn?: Date }) {
    super({
      eventName: UserLoggedInEvent.EVENT_NAME,
      aggregateId: params.userId,
      payload: {
        userId: params.userId,
        loginAt: params.loginAt
      },
      occurredOn: params.occurredOn
    })
  }

  toPrimitives() {
    return {
      userId: this.payload.userId,
      loginAt: this.payload.loginAt.toISOString()
    }
  }
}
