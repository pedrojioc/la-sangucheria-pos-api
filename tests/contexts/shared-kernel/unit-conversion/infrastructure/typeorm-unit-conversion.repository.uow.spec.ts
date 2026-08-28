import { EntityManager, Repository } from 'typeorm'

import { TypeOrmUnitConversionRepository } from '@/contexts/shared-kernel/unit-conversion/infrastructure/persistence/typeorm/typeorm-unit-conversion.repository'
import { UnitConversionEntity } from '@/contexts/shared-kernel/unit-conversion/infrastructure/persistence/typeorm/unit-conversion.entity'
import { UnitConversion } from '@/contexts/shared-kernel/unit-conversion/domain/unit-conversion'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmUnitConversionRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<UnitConversionEntity> => {
    return {
      target: UnitConversionEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<UnitConversionEntity>
  }

  const buildConversion = (): UnitConversion =>
    UnitConversion.fromPrimitives({
      id: UuidMother.random(),
      fromUnitId: UuidMother.random(),
      toUnitId: UuidMother.random(),
      factor: 1000,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmUnitConversionRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmUnitConversionRepository(defaultRepository, holder)

    await repository.save(buildConversion())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmUnitConversionRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<UnitConversionEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildConversion()))

    expect(getRepository).toHaveBeenCalledWith(UnitConversionEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
