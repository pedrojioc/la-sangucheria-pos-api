import { EntityManager, Repository } from 'typeorm'

import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'

class DummyEntity {
  id: string
}

// Throwaway concrete subclass — exercises the base class contract only.
class DummyRepository extends TransactionalRepository<DummyEntity> {
  constructor(defaultRepository: Repository<DummyEntity>, uow: UnitOfWorkContextHolder) {
    super(defaultRepository, uow)
  }

  exposedRepo(): Repository<DummyEntity> {
    return this.repo
  }

  exposedManager(): EntityManager {
    return this.manager
  }
}

describe('TransactionalRepository', () => {
  const buildDefaultRepository = (): Repository<DummyEntity> => {
    return {
      target: DummyEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager
    } as unknown as Repository<DummyEntity>
  }

  it('returns the injected default repository when no ALS context is active', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const dummy = new DummyRepository(defaultRepository, holder)

    expect(dummy.exposedRepo()).toBe(defaultRepository)
  })

  it('returns the default repository manager when no ALS context is active', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const dummy = new DummyRepository(defaultRepository, holder)

    expect(dummy.exposedManager()).toBe(defaultRepository.manager)
  })

  it('returns manager.getRepository(target) when instantiated inside holder.run()', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const dummy = new DummyRepository(defaultRepository, holder)

    const scopedRepository = {} as Repository<DummyEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    holder.run(context, () => {
      expect(dummy.exposedRepo()).toBe(scopedRepository)
      expect(getRepository).toHaveBeenCalledWith(DummyEntity)
    })
  })

  it('mirrors the same fallback logic for the manager getter inside holder.run()', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const dummy = new DummyRepository(defaultRepository, holder)

    const ambientManager = { getRepository: jest.fn() } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    holder.run(context, () => {
      expect(dummy.exposedManager()).toBe(ambientManager)
    })
  })
})
