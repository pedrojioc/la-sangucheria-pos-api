import { EntityManager, Repository } from 'typeorm'

import { TypeOrmCustomerRepository } from '@contexts/crm/customer/infrastructure/persistence/typeorm/typeorm-customer.repository'
import { CustomerEntity } from '@contexts/crm/customer/infrastructure/persistence/typeorm/customer.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { CustomerMother } from '@test/contexts/crm/customer/__mothers__/customer.mother'

describe('TypeOrmCustomerRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<CustomerEntity> => {
    return {
      target: CustomerEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      save: jest.fn()
    } as unknown as Repository<CustomerEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmCustomerRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmCustomerRepository(defaultRepository, holder)

    await repository.save(CustomerMother.create())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmCustomerRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      save: scopedSave
    } as unknown as Repository<CustomerEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(CustomerMother.create()))

    expect(getRepository).toHaveBeenCalledWith(CustomerEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
