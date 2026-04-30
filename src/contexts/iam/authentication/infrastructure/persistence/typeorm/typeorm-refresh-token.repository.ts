import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository'
import { RefreshToken } from '../../../domain/refresh-token'
import { RefreshTokenJti } from '../../../domain/refresh-token-jti'
import { UserId } from '@/contexts/iam/user/domain/user-id'
import { RefreshTokenEntity } from './refresh-token.entity'

@Injectable()
export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repository: Repository<RefreshTokenEntity>
  ) {}

  async save(token: RefreshToken): Promise<void> {
    const primitives = token.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async search(jti: RefreshTokenJti): Promise<RefreshToken | null> {
    const entity = await this.repository.findOne({
      where: { jti: jti.value }
    })

    if (!entity) {
      return null
    }

    return RefreshToken.fromPrimitives(entity)
  }

  async revokeAllForUser(userId: UserId): Promise<void> {
    await this.repository.update(
      { userId: userId.value, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'token_theft_detected'
      }
    )
  }
}
