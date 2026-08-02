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

    it('issues a conditional UPDATE guarded by pending_secret IS NOT NULL', async () => {
      const entity = buildEntity()
      typeOrmRepo.findOne.mockResolvedValue(entity)
      queryBuilder.execute.mockResolvedValue({ affected: 1 })

      await repository.compareAndWipePendingSecret(entity.id, new Date())

      expect(queryBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({ pendingSecret: null })
      )
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('pending_secret IS NOT NULL')
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
