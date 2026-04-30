import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'
import { EventBus } from '@/shared/domain/events/event-bus'
import { RefreshTokenJti } from '../../domain/refresh-token-jti'
import { TokenExpired } from '../../domain/exceptions/token-expired.exception'

export class Logout {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(jti: string): Promise<void> {
    // 1. Find the refresh token by JTI
    const refreshToken = await this.refreshTokenRepository.search(new RefreshTokenJti(jti))

    if (!refreshToken) {
      throw new TokenExpired()
    }

    // 2. Revoke the token
    refreshToken.revoke('user_logout')

    // 3. Save the revoked token
    await this.refreshTokenRepository.save(refreshToken)

    // 4. Publish domain events
    const events = refreshToken.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
