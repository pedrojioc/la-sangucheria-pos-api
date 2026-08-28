import { EntityManager, Repository } from 'typeorm'

import { TypeOrmRefreshTokenRepository } from '@contexts/iam/authentication/infrastructure/persistence/typeorm/typeorm-refresh-token.repository'
import { RefreshTokenEntity } from '@contexts/iam/authentication/infrastructure/persistence/typeorm/refresh-token.entity'
import { RefreshToken } from '@contexts/iam/authentication/domain/refresh-token'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmRefreshTokenRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<RefreshTokenEntity> => {
    return {
      target: RefreshTokenEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<RefreshTokenEntity>
  }

  const buildRefreshToken = (): RefreshToken =>
    RefreshToken.fromPrimitives({
      id: UuidMother.random(),
      jti: UuidMother.random(),
      userId: UuidMother.random(),
      tokenHash: 'hashed-token-value',
      expiresAt: new Date('2026-12-31T00:00:00.000Z'),
      isRevoked: false,
      revokedAt: null,
      revokedReason: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      ipAddress: null,
      userAgent: null,
      replacedByJti: null
    })

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmRefreshTokenRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmRefreshTokenRepository(defaultRepository, holder)

    await repository.save(buildRefreshToken())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmRefreshTokenRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<RefreshTokenEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildRefreshToken()))

    expect(getRepository).toHaveBeenCalledWith(RefreshTokenEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
