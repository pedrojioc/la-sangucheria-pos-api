import { INTERCEPTORS_METADATA } from '@nestjs/common/constants'

import { IngredientController } from '@contexts/inventory/ingredient/presentation/http/controllers/ingredient.controller'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

/**
 * Slice 6 Group A (6.6) — proves `IngredientController.create` carries
 * `@UseInterceptors(TransactionInterceptor)`.
 *
 * Root cause this closes: `CreateIngredient.run()` saves the Ingredient
 * then publishes `IngredientCreatedEvent`, which the router dispatches
 * synchronously to the category-1 subscriber
 * `CreateInventoryLevelOnIngredientCreated` (design D4). Category-1
 * dispatch REQUIRES an ambient `UnitOfWorkContext` — per D5/D8, the router
 * throws `MissingUnitOfWorkContext` if none exists (see
 * event-bus-router.spec.ts for that fail-fast contract; not duplicated
 * here). Applying the interceptor supplies that ambient context so the
 * Ingredient save and the InventoryLevel creation share one transaction.
 *
 * Reads `@UseInterceptors`' own metadata key (INTERCEPTORS_METADATA)
 * directly off the controller's method function, matching the Slice 6
 * Group A/B pattern — no HTTP/DI bootstrap, matching this project's "unit"
 * jest project convention.
 */
describe('IngredientController — TransactionInterceptor wiring (Slice 6 Group A, 6.6)', () => {
  const readInterceptors = (methodName: keyof IngredientController): unknown[] => {
    const handler = IngredientController.prototype[methodName] as unknown as (
      ...args: unknown[]
    ) => unknown
    return (Reflect.getMetadata(INTERCEPTORS_METADATA, handler) as unknown[]) ?? []
  }

  it('create carries TransactionInterceptor — POST /ingredients (CreateIngredient, cat-1 CreateInventoryLevelOnIngredientCreated)', () => {
    expect(readInterceptors('create')).toContain(TransactionInterceptor)
  })

  it.each([
    ['update', 'PUT /ingredients/:id (single write, no cat-1 dispatch, no interceptor needed)'],
    ['findById', 'GET /ingredients/:id (read-only, no interceptor needed)'],
    ['search', 'GET /ingredients (read-only, no interceptor needed)']
  ] as const)('%s does NOT carry TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).not.toContain(TransactionInterceptor)
  })
})
