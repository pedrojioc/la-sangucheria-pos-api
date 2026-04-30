import { RefreshToken } from '../refresh-token'
import { RefreshTokenJti } from '../refresh-token-jti'
import { UserId } from '@/contexts/iam/user/domain/user-id'

export abstract class RefreshTokenRepository {
  abstract save(token: RefreshToken): Promise<void>
  abstract search(jti: RefreshTokenJti): Promise<RefreshToken | null>
  abstract revokeAllForUser(userId: UserId): Promise<void>
}
