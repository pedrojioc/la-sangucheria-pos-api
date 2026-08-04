import { Repository } from 'typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test, TestingModule } from '@nestjs/testing'

import { TypeOrmPairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/infrastructure/persistence/typeorm/typeorm-pairing-code.repository'
import { PairingCodeEntity } from '@contexts/kitchen-operations/pairing-code/infrastructure/persistence/typeorm/pairing-code.entity'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmPairingCodeRepository', () => {
  let repository: TypeOrmPairingCodeRepository
  let typeOrmRepo: jest.Mocked<Repository<PairingCodeEntity>>
  let queryBuilder: {
    update: jest.Mock
    set: jest.Mock
    where: jest.Mock
    andWhere: jest.Mock
    execute: jest.Mock
  }

  const buildEntity = (overrides: Partial<PairingCodeEntity> = {}): PairingCodeEntity => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    return {
      id: UuidMother.random(),
      code: 'ABC234',
      status: 'issued',
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      credentialId: UuidMother.random(),
      deliveredAt: null,
      createdAt: now,
      updatedAt: now,
      pollTokenHash: 'hash',
      pendingSecret: 'lspa_plaintext',
      pendingSecretExpiresAt: new Date(now.getTime() + 2 * 60 * 1000),
      ...overrides
    } as PairingCodeEntity
  }

  beforeEach(async () => {
    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmPairingCodeRepository,
        {
          provide: getRepositoryToken(PairingCodeEntity),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
          }
        }
      ]
    }).compile()

    repository = module.get(TypeOrmPairingCodeRepository)
    typeOrmRepo = module.get(getRepositoryToken(PairingCodeEntity))
  })

  describe('compareAndWipePendingSecret', () => {
    it('returns null when the row has no pending secret (already absent)', async () => {
      typeOrmRepo.findOne.mockResolvedValue(buildEntity({ pendingSecret: null }))

      const result = await repository.compareAndWipePendingSecret(UuidMother.random(), new Date())

      expect(result).toBeNull()
      expect(queryBuilder.execute).not.toHaveBeenCalled()
    })

    it('returns null when the row does not exist', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null)

      const result = await repository.compareAndWipePendingSecret(UuidMother.random(), new Date())

      expect(result).toBeNull()
    })

    it('issues a conditional UPDATE guarded by pending_secret IS NOT NULL and TTL not expired', async () => {
      const entity = buildEntity()
      typeOrmRepo.findOne.mockResolvedValue(entity)
      queryBuilder.execute.mockResolvedValue({ affected: 1 })
      const now = new Date()

      await repository.compareAndWipePendingSecret(entity.id, now)

      expect(queryBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({ pendingSecret: null })
      )
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('pending_secret IS NOT NULL')
      // TTL-expiry regression (verify-report obs #319 CRITICAL): the WHERE
      // clause must ALSO exclude a pending secret whose TTL has passed, so an
      // expired-but-present secret can never win the atomic wipe. Without
      // this predicate, Postgres would happily UPDATE an expired row (its
      // affected count would be 1), and the domain-level TTL check in
      // retrieveAndWipeSecret() would only discover the problem AFTER the
      // row was already wiped and delivered_at already stamped.
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('pending_secret_expires_at > :now', {
        now
      })
    })

    it('never wins the race for an expired-but-present pending secret (real Postgres WHERE semantics: affected=0)', async () => {
      // The repository's findOne() read happens BEFORE the conditional
      // UPDATE and does not itself filter by TTL — it only checks
      // `pendingSecret !== null`, matching production code. What must close
      // the TTL gap is the UPDATE's WHERE clause, enforced by Postgres at
      // execute time. This test models that DB-level rejection: an entity
      // read with an already-expired pendingSecretExpiresAt must still
      // result in the caller receiving null, because the real WHERE clause
      // (`pending_secret_expires_at > :now`) would make Postgres report
      // affected=0 for this row.
      const now = new Date('2026-01-01T00:05:00.000Z')
      const entity = buildEntity({ pendingSecretExpiresAt: new Date(now.getTime() - 1000) })
      typeOrmRepo.findOne.mockResolvedValue(entity)
      queryBuilder.execute.mockResolvedValue({ affected: 0 })

      const result = await repository.compareAndWipePendingSecret(entity.id, now)

      expect(result).toBeNull()
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('pending_secret_expires_at > :now', {
        now
      })
    })

    it('returns the captured plaintext secret and delivered code when this caller wins the race (affected=1)', async () => {
      const entity = buildEntity()
      typeOrmRepo.findOne.mockResolvedValue(entity)
      queryBuilder.execute.mockResolvedValue({ affected: 1 })
      const now = new Date('2026-01-01T00:01:00.000Z')

      const result = await repository.compareAndWipePendingSecret(entity.id, now)

      expect(result).not.toBeNull()
      expect(result!.getDeliveredAt()).toEqual(now)
      // Domain-level retrieveAndWipeSecret guards on the TTL captured from the
      // read; the plaintext was captured pre-wipe by the repository, so the
      // aggregate returned here still exposes it for the caller (A7) to read.
      expect(result!.retrieveAndWipeSecret(now)).toBe('lspa_plaintext')
    })

    it('returns null when a concurrent poll already wiped the row (affected=0) — TOCTOU close', async () => {
      const entity = buildEntity()
      typeOrmRepo.findOne.mockResolvedValue(entity)
      queryBuilder.execute.mockResolvedValue({ affected: 0 })

      const result = await repository.compareAndWipePendingSecret(entity.id, new Date())

      expect(result).toBeNull()
    })
  })
})
