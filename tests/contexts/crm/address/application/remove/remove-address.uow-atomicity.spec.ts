import { EntityManager, Repository } from 'typeorm'

import { TypeOrmAddressRepository } from '@contexts/crm/address/infrastructure/persistence/typeorm/typeorm-address.repository'
import { AddressEntity } from '@contexts/crm/address/infrastructure/persistence/typeorm/address.entity'
import { TypeOrmCustomerRepository } from '@contexts/crm/customer/infrastructure/persistence/typeorm/typeorm-customer.repository'
import { CustomerEntity } from '@contexts/crm/customer/infrastructure/persistence/typeorm/customer.entity'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { AddressMother } from '@test/contexts/crm/address/__mothers__/address.mother'
import { CustomerMother } from '@test/contexts/crm/customer/__mothers__/customer.mother'

/**
 * Slice 6 Group A — proves RemoveAddress's writes (Address delete, then the
 * CONDITIONAL Customer save when the removed address was the default) share
 * ONE ambient EntityManager when a UnitOfWorkContext is active — the
 * atomicity guarantee `@UseInterceptors(TransactionInterceptor)` provides
 * for `DELETE /customers/:customerId/addresses/:id`.
 *
 * Without an ambient transaction, a failure on the conditional Customer save
 * leaves the Address deleted while the Customer's defaultAddressId still
 * points at the now-deleted row — a dangling foreign key at the domain
 * level (no DB FK enforces it; TypeOrmCustomerRepository upserts blindly).
 */
describe('RemoveAddress atomicity (Slice 6 Group A): Address delete + conditional Customer save share one ambient manager', () => {
  const buildDefaultAddressRepository = (): Repository<AddressEntity> =>
    ({
      target: AddressEntity,
      manager: { name: 'default-address-manager' } as unknown as EntityManager,
      delete: jest.fn()
    }) as unknown as Repository<AddressEntity>

  const buildDefaultCustomerRepository = (): Repository<CustomerEntity> =>
    ({
      target: CustomerEntity,
      manager: { name: 'default-customer-manager' } as unknown as EntityManager,
      save: jest.fn()
    }) as unknown as Repository<CustomerEntity>

  it('resolves both Address and Customer repositories from the same ambient manager inside one UnitOfWorkContext', async () => {
    const holder = new UnitOfWorkContextHolder()

    const defaultAddressRepository = buildDefaultAddressRepository()
    const addressRepository = new TypeOrmAddressRepository(defaultAddressRepository, holder)

    const defaultCustomerRepository = buildDefaultCustomerRepository()
    const customerRepository = new TypeOrmCustomerRepository(defaultCustomerRepository, holder)

    const scopedAddressDelete = jest.fn()
    const scopedAddressRepo = {
      delete: scopedAddressDelete
    } as unknown as Repository<AddressEntity>
    const scopedCustomerSave = jest.fn()
    const scopedCustomerRepo = {
      save: scopedCustomerSave
    } as unknown as Repository<CustomerEntity>

    const getRepository = jest.fn().mockImplementation((target: unknown) => {
      if (target === AddressEntity) return scopedAddressRepo
      if (target === CustomerEntity) return scopedCustomerRepo
      throw new Error(`Unexpected target: ${String(target)}`)
    })
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    const address = AddressMother.create()

    await holder.run(context, async () => {
      // Mirrors RemoveAddress.run()'s write order: Address deleted first,
      // then Customer saved second only when the removed address was the
      // customer's default and no other address remains.
      await addressRepository.delete(address.id)
      await customerRepository.save(CustomerMother.create())
    })

    expect(getRepository).toHaveBeenCalledWith(AddressEntity)
    expect(getRepository).toHaveBeenCalledWith(CustomerEntity)
    expect(scopedAddressDelete).toHaveBeenCalledTimes(1)
    expect(scopedCustomerSave).toHaveBeenCalledTimes(1)
    expect(defaultAddressRepository.delete).not.toHaveBeenCalled()
    expect(defaultCustomerRepository.save).not.toHaveBeenCalled()
  })

  it('without an ambient context, Address delete and Customer save fall back to their own independent default repositories (the bug this endpoint has today without the interceptor)', async () => {
    const holder = new UnitOfWorkContextHolder()

    const defaultAddressRepository = buildDefaultAddressRepository()
    const addressRepository = new TypeOrmAddressRepository(defaultAddressRepository, holder)

    const defaultCustomerRepository = buildDefaultCustomerRepository()
    const customerRepository = new TypeOrmCustomerRepository(defaultCustomerRepository, holder)

    const address = AddressMother.create()

    await addressRepository.delete(address.id)
    await customerRepository.save(CustomerMother.create())

    expect(defaultAddressRepository.delete).toHaveBeenCalledTimes(1)
    expect(defaultCustomerRepository.save).toHaveBeenCalledTimes(1)
  })
})
