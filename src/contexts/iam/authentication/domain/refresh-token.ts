import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { RefreshTokenId } from './refresh-token-id'
import { RefreshTokenJti } from './refresh-token-jti'
import { RefreshTokenHash } from './refresh-token-hash'
import { UserId } from '@/contexts/iam/user/domain/user-id'
import { RefreshTokenRevokedEvent } from './events/refresh-token-revoked.event'
import { TokenAlreadyRevoked } from './exceptions/token-already-revoked.exception'

export interface RefreshTokenPrimitives {
  id: string
  jti: string
  userId: string
  tokenHash: string
  expiresAt: Date
  isRevoked: boolean
  revokedAt: Date | null
  revokedReason: string | null
  createdAt: Date
  ipAddress: string | null
  userAgent: string | null
  replacedByJti: string | null
}

export class RefreshToken extends AggregateRoot {
  private constructor(
    public readonly id: RefreshTokenId,
    public readonly jti: RefreshTokenJti,
    public readonly userId: UserId,
    private readonly tokenHash: RefreshTokenHash,
    private readonly expiresAt: Date,
    private isRevoked: boolean,
    private revokedAt: Date | null,
    private revokedReason: string | null,
    private readonly createdAt: Date,
    private readonly ipAddress: string | null,
    private readonly userAgent: string | null,
    private replacedByJti: string | null
  ) {
    super()
  }

  static create(
    id: string,
    jti: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    ipAddress: string | null,
    userAgent: string | null
  ): RefreshToken {
    return new RefreshToken(
      new RefreshTokenId(id),
      new RefreshTokenJti(jti),
      new UserId(userId),
      new RefreshTokenHash(tokenHash),
      expiresAt,
      false,
      null,
      null,
      new Date(),
      ipAddress,
      userAgent,
      null
    )
  }

  static fromPrimitives(primitives: RefreshTokenPrimitives): RefreshToken {
    return new RefreshToken(
      new RefreshTokenId(primitives.id),
      new RefreshTokenJti(primitives.jti),
      new UserId(primitives.userId),
      new RefreshTokenHash(primitives.tokenHash),
      primitives.expiresAt,
      primitives.isRevoked,
      primitives.revokedAt,
      primitives.revokedReason,
      primitives.createdAt,
      primitives.ipAddress,
      primitives.userAgent,
      primitives.replacedByJti
    )
  }

  revoke(reason: string | null = null): void {
    if (this.isRevoked) {
      throw new TokenAlreadyRevoked()
    }

    this.isRevoked = true
    this.revokedAt = new Date()
    this.revokedReason = reason

    this.record(
      new RefreshTokenRevokedEvent({
        tokenId: this.id.value,
        userId: this.userId.value,
        jti: this.jti.value,
        reason
      })
    )
  }

  markAsReplaced(newJti: string): void {
    this.replacedByJti = newJti
    this.revoke('replaced_by_rotation')
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  isActive(): boolean {
    return !this.isRevoked && !this.isExpired()
  }

  getTokenHash(): string {
    return this.tokenHash.value
  }

  toPrimitives(): RefreshTokenPrimitives {
    return {
      id: this.id.value,
      jti: this.jti.value,
      userId: this.userId.value,
      tokenHash: this.tokenHash.value,
      expiresAt: this.expiresAt,
      isRevoked: this.isRevoked,
      revokedAt: this.revokedAt,
      revokedReason: this.revokedReason,
      createdAt: this.createdAt,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      replacedByJti: this.replacedByJti
    }
  }
}
