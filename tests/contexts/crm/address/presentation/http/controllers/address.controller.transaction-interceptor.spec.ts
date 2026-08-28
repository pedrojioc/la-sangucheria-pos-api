import { INTERCEPTORS_METADATA } from '@nestjs/common/constants'

import { AddressController } from '@contexts/crm/address/presentation/http/controllers/address.controller'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

/**
 * Slice 6 Group A — proves `AddressController.add` and `.remove` carry
 * `@UseInterceptors(TransactionInterceptor)`.
 *
 * Root cause this closes: `AddAddress.run()` saves the new Address and then
 * CONDITIONALLY saves the Customer (setDefaultAddress) when it is the
 * customer's first address; `RemoveAddress.run()` deletes the Address and
 * then CONDITIONALLY saves the Customer (clear defaultAddressId) when the
 * removed address was the default. Both are two-write flows across two
 * different `TransactionalRepository` instances (Address, Customer). Without
 * an ambient transaction, a failure partway leaves the Customer's
 * defaultAddressId pointing at a nonexistent or stale Address.
 *
 * Same Reflect.getMetadata pattern as Slice 6 Group B — no HTTP/DI bootstrap.
 */
describe('AddressController — TransactionInterceptor wiring (Slice 6 Group A)', () => {
  const readInterceptors = (methodName: keyof AddressController): unknown[] => {
    const handler = AddressController.prototype[methodName] as unknown as (
      ...args: unknown[]
    ) => unknown
    return (Reflect.getMetadata(INTERCEPTORS_METADATA, handler) as unknown[]) ?? []
  }

  it.each([
    ['add', 'POST /customers/:customerId/addresses (AddAddress)'],
    ['remove', 'DELETE /customers/:customerId/addresses/:id (RemoveAddress)']
  ] as const)('%s carries TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).toContain(TransactionInterceptor)
  })

  it.each([
    ['findAll', 'GET /customers/:customerId/addresses (read-only, no interceptor needed)'],
    ['update', 'PUT /customers/:customerId/addresses/:id (single write, no interceptor needed)'],
    [
      'setDefault',
      'POST /customers/:customerId/addresses/:id/set-default (single write via SetDefaultAddress use case, out of scope for this batch)'
    ]
  ] as const)('%s does NOT carry TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).not.toContain(TransactionInterceptor)
  })
})
