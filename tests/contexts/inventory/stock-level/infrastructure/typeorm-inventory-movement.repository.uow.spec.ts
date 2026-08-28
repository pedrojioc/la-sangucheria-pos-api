import { EntityManager, Repository } from 'typeorm'

import { TypeOrmInventoryMovementRepository } from '@/contexts/inventory/stock-level/infrastructure/persistence/typeorm/typeorm-inventory-movement.repository'
import { InventoryMovementEntity } from '@/contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-movement.entity'
import { InventoryMovement } from '@/contexts/inventory/stock-level/domain/inventory-movement'
import { MovementType } from '@/contexts/inventory/stock-level/domain/movement-type'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmInventoryMovementRepository (ambient UnitOfWork wiring)', () => {
  const buildMovement = (): InventoryMovement =>
    InventoryMovement.create(
      UuidMother.random(),
      UuidMother.random(),
      MovementType.PURCHASE,
      10,
      UuidMother.random(),
      5,
      'COP',
      UuidMother.random()
    )

  const buildDefaultRepository = (): Repository<InventoryMovementEntity> => {
    return {
      target: InventoryMovementEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<InventoryMovementEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInventoryMovementRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInventoryMovementRepository(defaultRepository, holder)

    await repository.save(buildMovement())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInventoryMovementRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<InventoryMovementEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildMovement()))

    expect(getRepository).toHaveBeenCalledWith(InventoryMovementEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
