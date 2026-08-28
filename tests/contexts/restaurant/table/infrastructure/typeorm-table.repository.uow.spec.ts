import { EntityManager, Repository } from 'typeorm'

import { TypeOrmTableRepository } from '@contexts/restaurant/table/infrastructure/persistence/typeorm/typeorm-table.repository'
import { TableEntity } from '@contexts/restaurant/table/infrastructure/persistence/typeorm/table.entity'
import { Table } from '@contexts/restaurant/table/domain/table'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { TableMother } from '@test/contexts/restaurant/table/__mothers__/table.mother'

describe('TypeOrmTableRepository (ambient UnitOfWork wiring)', () => {
  const buildTable = (): Table => TableMother.random()

  const buildDefaultRepository = (): Repository<TableEntity> => {
    return {
      target: TableEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      save: jest.fn()
    } as unknown as Repository<TableEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmTableRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmTableRepository(defaultRepository, holder)

    await repository.save(buildTable())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmTableRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      save: scopedSave
    } as unknown as Repository<TableEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildTable()))

    expect(getRepository).toHaveBeenCalledWith(TableEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
