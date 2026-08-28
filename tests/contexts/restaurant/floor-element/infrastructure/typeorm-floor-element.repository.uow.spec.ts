import { EntityManager, Repository } from 'typeorm'

import { TypeOrmFloorElementRepository } from '@contexts/restaurant/floor-element/infrastructure/persistence/typeorm/typeorm-floor-element.repository'
import { FloorElementEntity } from '@contexts/restaurant/floor-element/infrastructure/persistence/typeorm/floor-element.entity'
import { FloorElement } from '@contexts/restaurant/floor-element/domain/floor-element'
import { FloorElementType } from '@contexts/restaurant/floor-element/domain/floor-element-type'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmFloorElementRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<FloorElementEntity> => {
    return {
      target: FloorElementEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      save: jest.fn()
    } as unknown as Repository<FloorElementEntity>
  }

  const buildFloorElement = (): FloorElement =>
    FloorElement.fromPrimitives({
      id: UuidMother.random(),
      zoneId: UuidMother.random(),
      type: FloorElementType.BAR,
      label: 'T1',
      positionX: 0,
      positionY: 0,
      width: 1,
      height: 1,
      rotation: 0,
      color: '#FFFFFF',
      isActive: true
    })

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmFloorElementRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmFloorElementRepository(defaultRepository, holder)

    await repository.save(buildFloorElement())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmFloorElementRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = { save: scopedSave } as unknown as Repository<FloorElementEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildFloorElement()))

    expect(getRepository).toHaveBeenCalledWith(FloorElementEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
