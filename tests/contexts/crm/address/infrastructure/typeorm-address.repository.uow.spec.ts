import { EntityManager, Repository } from 'typeorm'

import { TypeOrmAddressRepository } from '@contexts/crm/address/infrastructure/persistence/typeorm/typeorm-address.repository'
import { AddressEntity } from '@contexts/crm/address/infrastructure/persistence/typeorm/address.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { AddressMother } from '@test/contexts/crm/address/__mothers__/address.mother'

describe('TypeOrmAddressRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<AddressEntity> => {
    return {
      target: AddressEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      save: jest.fn()
    } as unknown as Repository<AddressEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmAddressRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmAddressRepository(defaultRepository, holder)

    await repository.save(AddressMother.create())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmAddressRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      save: scopedSave
    } as unknown as Repository<AddressEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(AddressMother.create()))

    expect(getRepository).toHaveBeenCalledWith(AddressEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
