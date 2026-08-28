import { EntityManager, Repository } from 'typeorm'

import { TypeOrmKitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/infrastructure/persistence/typeorm/typeorm-kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJobEntity } from '@contexts/kitchen-operations/kitchen-printer/infrastructure/persistence/typeorm/kitchen-ticket-print-job.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { KitchenTicketPrintJobMother } from '../__mothers__/kitchen-ticket-print-job.mother'

describe('TypeOrmKitchenTicketPrintJobRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<KitchenTicketPrintJobEntity> => {
    return {
      target: KitchenTicketPrintJobEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<KitchenTicketPrintJobEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmKitchenTicketPrintJobRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmKitchenTicketPrintJobRepository(defaultRepository, holder)

    await repository.save(KitchenTicketPrintJobMother.create())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmKitchenTicketPrintJobRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<KitchenTicketPrintJobEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(KitchenTicketPrintJobMother.create()))

    expect(getRepository).toHaveBeenCalledWith(KitchenTicketPrintJobEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
