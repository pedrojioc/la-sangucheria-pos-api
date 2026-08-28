import { EntityManager, Repository } from 'typeorm'

import { TypeOrmBillingConfigRepository } from '@contexts/billing/billing-config/infrastructure/persistence/typeorm/typeorm-billing-config.repository'
import { BillingConfigEntity } from '@contexts/billing/billing-config/infrastructure/persistence/typeorm/billing-config.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { BillingConfigMother } from '@test/contexts/billing/billing-config/__mothers__/billing-config.mother'

describe('TypeOrmBillingConfigRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<BillingConfigEntity> => {
    return {
      target: BillingConfigEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<BillingConfigEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmBillingConfigRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmBillingConfigRepository(defaultRepository, holder)

    await repository.save(BillingConfigMother.create())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmBillingConfigRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<BillingConfigEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(BillingConfigMother.create()))

    expect(getRepository).toHaveBeenCalledWith(BillingConfigEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
