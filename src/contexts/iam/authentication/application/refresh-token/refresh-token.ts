import { UserRepository } from '@/contexts/iam/user/domain/repositories/user.repository'
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'
import { JwtService } from '../../domain/services/jwt.service'
import { EventBus } from '@/shared/domain/events/event-bus'
import { RefreshTokenJti } from '../../domain/refresh-token-jti'
import { UserId } from '@/contexts/iam/user/domain/user-id'
import { RefreshToken } from '../../domain/refresh-token'
import { TokenExpired } from '../../domain/exceptions/token-expired.exception'
import { TokenAlreadyRevoked } from '../../domain/exceptions/token-already-revoked.exception'
import { TokenTheftDetected } from '../../domain/exceptions/token-theft-detected.exception'
import { TokenTheftDetectedEvent } from '../../domain/events/token-theft-detected.event'
import { UserNotFound } from '@/contexts/iam/user/domain/exceptions/user-not-found.exception'
import { UserNotActive } from '@/contexts/iam/user/domain/exceptions/user-not-active.exception'
import { v4 as uuid } from 'uuid'

export interface RefreshTokenResult {
  accessToken: string
  refreshToken: string
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus
  ) {}

  async run(
    refreshToken: string,
    userId: string,
    jti: string,
    ipAddress: string | null,
    userAgent: string | null
  ): Promise<RefreshTokenResult> {
    // 1. Find stored refresh token by JTI
    const storedToken = await this.refreshTokenRepository.search(new RefreshTokenJti(jti))
    if (!storedToken) {
      throw new TokenExpired()
    }

    // 2. TOKEN THEFT DETECTION: If token is already revoked, it means it was already used
    // This indicates a potential token theft scenario
    if (!storedToken.isActive()) {
      // Revoke ALL tokens for this user as a security measure
      await this.refreshTokenRepository.revokeAllForUser(new UserId(userId))

      // Record theft detection event
      await this.eventBus.publish([
        new TokenTheftDetectedEvent({
          userId,
          jti,
          ipAddress,
          userAgent
        })
      ])

      throw new TokenTheftDetected(userId)
    }

    // 3. Verify token hash matches
    const isValidHash = await this.jwtService.verifyTokenHash(
      refreshToken,
      storedToken.getTokenHash()
    )
    if (!isValidHash) {
      throw new TokenExpired()
    }

    // 4. Check if token is expired
    if (storedToken.isExpired()) {
      throw new TokenExpired()
    }

    // 5. Verify user still exists and is active
    const user = await this.userRepository.search(new UserId(userId))
    if (!user) {
      throw new UserNotFound(userId)
    }

    if (!user.isUserActive()) {
      throw new UserNotActive()
    }

    // 6. Generate new tokens (TOKEN ROTATION)
    const newAccessToken = await this.jwtService.generateAccessToken({
      id: user.getId(),
      username: user.getUsername(),
      email: user.getEmail()
    })

    const newRefreshTokenData = await this.jwtService.generateRefreshToken({
      id: user.getId()
    })

    // 7. Create new refresh token
    const newRefreshToken = RefreshToken.create(
      uuid(),
      newRefreshTokenData.jti,
      user.getId(),
      newRefreshTokenData.tokenHash,
      newRefreshTokenData.expiresAt,
      ipAddress,
      userAgent
    )

    // 8. Revoke old token and mark as replaced
    storedToken.markAsReplaced(newRefreshTokenData.jti)

    // 9. Save both tokens
    await this.refreshTokenRepository.save(storedToken)
    await this.refreshTokenRepository.save(newRefreshToken)

    // 10. Publish domain events
    const events = [...storedToken.pullDomainEvents(), ...newRefreshToken.pullDomainEvents()]
    await this.eventBus.publish(events)

    // 11. Return new tokens
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenData.token
    }
  }
}
