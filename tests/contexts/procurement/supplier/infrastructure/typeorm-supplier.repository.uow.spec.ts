import { EntityManager, Repository } from 'typeorm'

import { TypeOrmSupplierRepository } from '@contexts/procurement/supplier/infrastructure/persistence/typeorm/typeorm-supplier.repository'
import { SupplierEntity } from '@contexts/procurement/supplier/infrastructure/persistence/typeorm/supplier.entity'
import { Supplier } from '@contexts/procurement/supplier/domain/supplier'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmSupplierRepository (ambient UnitOfWork wiring)', () => {
  const buildSupplier = (): Supplier =>
    Supplier.create(
      UuidMother.random(),
      'Distribuidora El Sanguche',
      'Juan Perez',
      'contacto@elsanguche.com',
      '+57 300 1234567',
      null,
      null,
      null,
      null,
      null,
      null,
      true
    )

  const buildDefaultRepository = (): Repository<SupplierEntity> => {
    return {
      target: SupplierEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<SupplierEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmSupplierRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmSupplierRepository(defaultRepository, holder)

    await repository.save(buildSupplier())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmSupplierRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<SupplierEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildSupplier()))

    expect(getRepository).toHaveBeenCalledWith(SupplierEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
