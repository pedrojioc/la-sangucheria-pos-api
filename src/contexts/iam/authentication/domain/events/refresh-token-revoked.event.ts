import { DomainEvent } from '@/shared/domain/events/domain-event'

export class RefreshTokenRevokedEvent extends DomainEvent {
  static EVENT_NAME = 'refresh_token.revoked'

  constructor(params: {
    tokenId: string
    userId: string
    jti: string
    reason: string | null
    occurredOn?: Date
  }) {
    super({
      eventName: RefreshTokenRevokedEvent.EVENT_NAME,
      aggregateId: params.tokenId,
      payload: {
        tokenId: params.tokenId,
        userId: params.userId,
        jti: params.jti,
        reason: params.reason
      },
      occurredOn: params.occurredOn
    })
  }

  toPrimitives() {
    return {
      tokenId: this.payload.tokenId,
      userId: this.payload.userId,
      jti: this.payload.jti,
      reason: this.payload.reason
    }
  }
}
