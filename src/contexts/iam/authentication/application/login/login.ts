import { UserRepository } from '@/contexts/iam/user/domain/repositories/user.repository'
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'
import { PasswordHasher } from '@/contexts/iam/user/domain/services/password-hasher'
import { JwtService } from '../../domain/services/jwt.service'
import { EventBus } from '@/shared/domain/events/event-bus'
import { InvalidCredentials } from '../../domain/exceptions/invalid-credentials.exception'
import { UserNotActive } from '@/contexts/iam/user/domain/exceptions/user-not-active.exception'
import { RefreshToken } from '../../domain/refresh-token'
import { Username } from '@/contexts/iam/user/domain/username'
import { v4 as uuid } from 'uuid'

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    username: string
    email: string
  }
}

export class Login {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus
  ) {}

  async run(
    username: string,
    password: string,
    ipAddress: string | null,
    userAgent: string | null
  ): Promise<LoginResult> {
    // 1. Find user by username
    const user = await this.userRepository.searchByUsername(new Username(username))
    if (!user) {
      throw new InvalidCredentials()
    }

    // 2. Check if user is active
    if (!user.isUserActive()) {
      throw new UserNotActive()
    }

    // 3. Verify password
    const isPasswordValid = await this.passwordHasher.verify(password, user.getPasswordHash())
    if (!isPasswordValid) {
      throw new InvalidCredentials()
    }

    // 4. Record login in user aggregate
    user.recordLogin()

    // 5. Generate tokens
    const accessToken = await this.jwtService.generateAccessToken({
      id: user.getId(),
      username: user.getUsername(),
      email: user.getEmail()
    })

    const refreshTokenData = await this.jwtService.generateRefreshToken({
      id: user.getId()
    })

    // 6. Store refresh token
    const refreshToken = RefreshToken.create(
      uuid(),
      refreshTokenData.jti,
      user.getId(),
      refreshTokenData.tokenHash,
      refreshTokenData.expiresAt,
      ipAddress,
      userAgent
    )

    await this.refreshTokenRepository.save(refreshToken)

    // 7. Persist user (to update lastLoginAt)
    await this.userRepository.save(user)

    // 8. Publish domain events
    const userEvents = user.pullDomainEvents()
    const tokenEvents = refreshToken.pullDomainEvents()
    await this.eventBus.publish([...userEvents, ...tokenEvents])

    // 9. Return result
    return {
      accessToken,
      refreshToken: refreshTokenData.token,
      user: {
        id: user.getId(),
        username: user.getUsername(),
        email: user.getEmail()
      }
    }
  }
}
