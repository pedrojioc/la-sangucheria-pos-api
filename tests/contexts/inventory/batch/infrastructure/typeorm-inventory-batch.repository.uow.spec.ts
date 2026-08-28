import { EntityManager, Repository } from 'typeorm'

import { TypeOrmInventoryBatchRepository } from '@/contexts/inventory/batch/infrastructure/persistence/typeorm/typeorm-inventory-batch.repository'
import { InventoryBatchEntity } from '@/contexts/inventory/batch/infrastructure/persistence/typeorm/inventory-batch.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { InventoryBatchMother } from '../__mothers__/inventory-batch.mother'

describe('TypeOrmInventoryBatchRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<InventoryBatchEntity> => {
    return {
      target: InventoryBatchEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<InventoryBatchEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInventoryBatchRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInventoryBatchRepository(defaultRepository, holder)

    await repository.save(InventoryBatchMother.random())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInventoryBatchRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<InventoryBatchEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(InventoryBatchMother.random()))

    expect(getRepository).toHaveBeenCalledWith(InventoryBatchEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
