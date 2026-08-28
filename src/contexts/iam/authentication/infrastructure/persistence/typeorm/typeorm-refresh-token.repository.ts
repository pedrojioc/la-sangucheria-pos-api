import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository'
import { RefreshToken } from '../../../domain/refresh-token'
import { RefreshTokenJti } from '../../../domain/refresh-token-jti'
import { UserId } from '@/contexts/iam/user/domain/user-id'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { RefreshTokenEntity } from './refresh-token.entity'

@Injectable()
export class TypeOrmRefreshTokenRepository
  extends TransactionalRepository<RefreshTokenEntity>
  implements RefreshTokenRepository
{
  constructor(
    @InjectRepository(RefreshTokenEntity)
    repository: Repository<RefreshTokenEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(token: RefreshToken): Promise<void> {
    const primitives = token.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(jti: RefreshTokenJti): Promise<RefreshToken | null> {
    const entity = await this.repo.findOne({
      where: { jti: jti.value }
    })

    if (!entity) {
      return null
    }

    return RefreshToken.fromPrimitives(entity)
  }

  async revokeAllForUser(userId: UserId): Promise<void> {
    await this.repo.update(
      { userId: userId.value, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'token_theft_detected'
      }
    )
  }
}
