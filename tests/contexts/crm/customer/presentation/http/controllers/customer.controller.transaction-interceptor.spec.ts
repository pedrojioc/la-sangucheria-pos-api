import { INTERCEPTORS_METADATA } from '@nestjs/common/constants'

import { CustomerController } from '@contexts/crm/customer/presentation/http/controllers/customer.controller'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

/**
 * Slice 6 Group A (6.5) — proves `CustomerController.create` carries
 * `@UseInterceptors(TransactionInterceptor)`.
 *
 * Root cause this closes: `CreateCustomer.run()` saves the Customer then
 * publishes `CustomerCreatedEvent`, which the router dispatches
 * synchronously to the category-1 subscriber
 * `CreateLoyaltyAccountOnCustomerCreated` (design D5/D8, wiring fixed in
 * Slice 7). Category-1 dispatch REQUIRES an ambient `UnitOfWorkContext` —
 * per D5/D8, the router throws `MissingUnitOfWorkContext` if none exists
 * (see event-bus-router.spec.ts for that fail-fast contract; not
 * duplicated here). Applying the interceptor supplies that ambient
 * context so the Customer save and the LoyaltyAccount creation share one
 * transaction.
 *
 * Reads `@UseInterceptors`' own metadata key (INTERCEPTORS_METADATA)
 * directly off the controller's method function, matching the Slice 6
 * Group A/B pattern (e.g. ingredient.controller.transaction-interceptor.spec.ts)
 * — no HTTP/DI bootstrap, matching this project's "unit" jest project
 * convention.
 */
describe('CustomerController — TransactionInterceptor wiring (Slice 6 Group A, 6.5)', () => {
  const readInterceptors = (methodName: keyof CustomerController): unknown[] => {
    const handler = CustomerController.prototype[methodName] as unknown as (
      ...args: unknown[]
    ) => unknown
    return (Reflect.getMetadata(INTERCEPTORS_METADATA, handler) as unknown[]) ?? []
  }

  it('create carries TransactionInterceptor — POST /customers (CreateCustomer, cat-1 CreateLoyaltyAccountOnCustomerCreated)', () => {
    expect(readInterceptors('create')).toContain(TransactionInterceptor)
  })

  it.each([
    ['update', 'PUT /customers/:id (single write, no cat-1 dispatch, no interceptor needed)'],
    ['findOne', 'GET /customers/:id (read-only, no interceptor needed)'],
    ['search', 'GET /customers (read-only, no interceptor needed)']
  ] as const)('%s does NOT carry TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).not.toContain(TransactionInterceptor)
  })
})
