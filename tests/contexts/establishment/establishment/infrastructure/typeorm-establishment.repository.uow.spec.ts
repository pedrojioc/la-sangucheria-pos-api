import { EntityManager, Repository } from 'typeorm'

import { TypeOrmEstablishmentRepository } from '@contexts/establishment/establishment/infrastructure/persistence/typeorm/typeorm-establishment.repository'
import { EstablishmentEntity } from '@contexts/establishment/establishment/infrastructure/persistence/typeorm/establishment.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { EstablishmentMother } from '@test/contexts/establishment/establishment/__mothers__/establishment.mother'

describe('TypeOrmEstablishmentRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<EstablishmentEntity> => {
    return {
      target: EstablishmentEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<EstablishmentEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmEstablishmentRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmEstablishmentRepository(defaultRepository, holder)

    await repository.save(EstablishmentMother.create())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmEstablishmentRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<EstablishmentEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(EstablishmentMother.create()))

    expect(getRepository).toHaveBeenCalledWith(EstablishmentEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
