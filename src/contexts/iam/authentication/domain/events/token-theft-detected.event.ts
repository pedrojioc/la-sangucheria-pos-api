import { DomainEvent } from '@/shared/domain/events/domain-event'

export class TokenTheftDetectedEvent extends DomainEvent {
  static EVENT_NAME = 'token_theft.detected'

  constructor(params: {
    userId: string
    jti: string
    ipAddress: string | null
    userAgent: string | null
    occurredOn?: Date
  }) {
    super({
      eventName: TokenTheftDetectedEvent.EVENT_NAME,
      aggregateId: params.userId,
      payload: {
        userId: params.userId,
        jti: params.jti,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      },
      occurredOn: params.occurredOn
    })
  }

  toPrimitives() {
    return {
      userId: this.payload.userId,
      jti: this.payload.jti,
      ipAddress: this.payload.ipAddress,
      userAgent: this.payload.userAgent
    }
  }
}
