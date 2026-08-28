import { EntityManager, Repository } from 'typeorm'

import { TypeOrmZoneRepository } from '@contexts/restaurant/zone/infrastructure/persistence/typeorm/typeorm-zone.repository'
import { ZoneEntity } from '@contexts/restaurant/zone/infrastructure/persistence/typeorm/zone.entity'
import { Zone } from '@contexts/restaurant/zone/domain/zone'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmZoneRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<ZoneEntity> => {
    return {
      target: ZoneEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      save: jest.fn()
    } as unknown as Repository<ZoneEntity>
  }

  const buildZone = (): Zone =>
    Zone.fromPrimitives({
      id: UuidMother.random(),
      name: 'Terraza',
      color: '#FFFFFF',
      sortIndex: 1,
      isActive: true
    })

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmZoneRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmZoneRepository(defaultRepository, holder)

    await repository.save(buildZone())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmZoneRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = { save: scopedSave } as unknown as Repository<ZoneEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildZone()))

    expect(getRepository).toHaveBeenCalledWith(ZoneEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
