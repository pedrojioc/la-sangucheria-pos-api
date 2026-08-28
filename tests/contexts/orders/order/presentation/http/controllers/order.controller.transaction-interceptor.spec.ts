import { INTERCEPTORS_METADATA } from '@nestjs/common/constants'

import { OrderController } from '@contexts/orders/order/presentation/http/controllers/order.controller'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

/**
 * Slice 6 Group B + 6.7 — proves the 8 Order-controller endpoints carry
 * `@UseInterceptors(TransactionInterceptor)`.
 *
 * 6.7 (`close`) is the last endpoint in Slice 6 (16/16): `CloseOrder`
 * publishes `OrderClosedEvent`, dispatched synchronously (category 1, D5/D8)
 * to THREE subscribers — `ReleaseTableOnOrderClosed`,
 * `UpdateLifetimeValueOnOrderClosed`, `DeductIngredientsOnOrderClosed` (Slice
 * 8). Without this interceptor, all three throw `MissingUnitOfWorkContext`
 * per D5's fail-fast rule the moment `CloseOrder` runs end-to-end. See
 * `close-order.uow-atomicity.spec.ts` for the atomicity/rollback proof.
 *
 * Root cause this closes: `TypeOrmOrderRepository.save()` always issues 2-3
 * non-atomic statements (order upsert + order_items DELETE-diff + item
 * upsert) against `this.manager`, which only resolves to a real transactional
 * EntityManager when an ambient UnitOfWorkContext exists (see design D2/D8
 * and the atomicity coverage in
 * typeorm-order.repository.uow.spec.ts). Without this interceptor, `save()`
 * silently falls back to the default (autocommit) manager and each statement
 * commits independently — a partial failure between them corrupts order
 * totals/status vs. item rows.
 *
 * Reads `@UseInterceptors`' own metadata key (INTERCEPTORS_METADATA) directly
 * off the controller's method function — the same key NestJS's
 * InterceptorsConsumer reads at request time — instead of booting a full Nest
 * application, matching this project's "unit" jest project (no HTTP/DI
 * bootstrap in unit specs).
 */
describe('OrderController — TransactionInterceptor wiring (Slice 6 Group B)', () => {
  const readInterceptors = (methodName: keyof OrderController): unknown[] => {
    const handler = OrderController.prototype[methodName] as unknown as (
      ...args: unknown[]
    ) => unknown
    return (Reflect.getMetadata(INTERCEPTORS_METADATA, handler) as unknown[]) ?? []
  }

  it.each([
    ['addItems', 'POST /orders/:id/items (AddOrderItems)'],
    ['updateItem', 'PATCH /orders/:id/items/:itemId (UpdateOrderItem)'],
    ['removeItem', 'DELETE /orders/:id/items/:itemId (RemoveOrderItem)'],
    ['sendToKitchen', 'POST /orders/:id/kitchen (SendOrderToKitchen)'],
    ['cancelItem', 'POST /orders/:id/items/:itemId/cancel (CancelOrderItem)'],
    ['applyItemDiscountEndpoint', 'PATCH /orders/:id/items/:itemId/discount (ApplyItemDiscount)'],
    [
      'removeItemDiscountEndpoint',
      'DELETE /orders/:id/items/:itemId/discount (RemoveItemDiscount)'
    ],
    [
      'close',
      'POST /orders/:id/close (CloseOrder — Group A, 6.7 — cat-1 ReleaseTableOnOrderClosed, UpdateLifetimeValueOnOrderClosed, DeductIngredientsOnOrderClosed)'
    ]
  ] as const)('%s carries TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).toContain(TransactionInterceptor)
  })

  it.each([
    ['open', 'POST /orders (OpenOrder — out of scope, Group A/B exclusion)'],
    ['findById', 'GET /orders/:id (read-only, no interceptor needed)'],
    ['cancel', 'POST /orders/:id/cancel (CancelOrder — low-risk, out of scope)'],
    [
      'applyOrderDiscountEndpoint',
      'PATCH /orders/:id/discount (ApplyOrderDiscount — low-risk, out of scope)'
    ],
    [
      'removeOrderDiscountEndpoint',
      'DELETE /orders/:id/discount (RemoveOrderDiscount — low-risk, out of scope)'
    ],
    ['search', 'GET /orders (read-only, no interceptor needed)']
  ] as const)('%s does NOT carry TransactionInterceptor yet — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).not.toContain(TransactionInterceptor)
  })
})
