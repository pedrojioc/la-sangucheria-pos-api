import { EntityManager, Repository } from 'typeorm'

import { TypeOrmIngredientTransformationRepository } from '@contexts/kitchen/transformation/infrastructure/persistence/typeorm/typeorm-ingredient-transformation.repository'
import { IngredientTransformationEntity } from '@contexts/kitchen/transformation/infrastructure/persistence/typeorm/ingredient-transformation.entity'
import { IngredientTransformation } from '@contexts/kitchen/transformation/domain/ingredient-transformation'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmIngredientTransformationRepository (ambient UnitOfWork wiring)', () => {
  const buildTransformation = (): IngredientTransformation =>
    IngredientTransformation.create(
      UuidMother.random(),
      UuidMother.random(),
      UuidMother.random(),
      UuidMother.random(),
      10,
      UuidMother.random(),
      8,
      UuidMother.random(),
      2,
      100,
      0,
      'COP'
    )

  const buildDefaultRepository = (): Repository<IngredientTransformationEntity> => {
    return {
      target: IngredientTransformationEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<IngredientTransformationEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmIngredientTransformationRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmIngredientTransformationRepository(defaultRepository, holder)

    await repository.save(buildTransformation())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmIngredientTransformationRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<IngredientTransformationEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildTransformation()))

    expect(getRepository).toHaveBeenCalledWith(IngredientTransformationEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
