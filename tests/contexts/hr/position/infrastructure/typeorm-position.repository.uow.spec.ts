import { EntityManager, Repository } from 'typeorm'

import { TypeOrmPositionRepository } from '@contexts/hr/position/infrastructure/persistence/typeorm/typeorm-position.repository'
import { PositionEntity } from '@contexts/hr/position/infrastructure/persistence/typeorm/position.entity'
import { Position } from '@contexts/hr/position/domain/position'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmPositionRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<PositionEntity> => {
    return {
      target: PositionEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<PositionEntity>
  }

  const buildPosition = (): Position =>
    Position.fromPrimitives({
      id: UuidMother.random(),
      name: 'Cocinero',
      description: null,
      color: null,
      icon: null
    })

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPositionRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPositionRepository(defaultRepository, holder)

    await repository.save(buildPosition())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPositionRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<PositionEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildPosition()))

    expect(getRepository).toHaveBeenCalledWith(PositionEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
