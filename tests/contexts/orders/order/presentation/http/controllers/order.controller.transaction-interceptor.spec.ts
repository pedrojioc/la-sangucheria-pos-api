import { INTERCEPTORS_METADATA } from '@nestjs/common/constants'

import { OrderController } from '@contexts/orders/order/presentation/http/controllers/order.controller'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

/**
 * Slice 6 Group B + 6.7, plus a post-hoc fix — proves the 10
 * Order-controller endpoints that need it carry
 * `@UseInterceptors(TransactionInterceptor)`.
 *
 * 6.7 (`close`) is the last endpoint of Slice 6's original 16: `CloseOrder`
 * publishes `OrderClosedEvent`, dispatched synchronously (category 1, D5/D8)
 * to THREE subscribers — `ReleaseTableOnOrderClosed`,
 * `UpdateLifetimeValueOnOrderClosed`, `DeductIngredientsOnOrderClosed` (Slice
 * 8). Without this interceptor, all three throw `MissingUnitOfWorkContext`
 * per D5's fail-fast rule the moment `CloseOrder` runs end-to-end. See
 * `close-order.uow-atomicity.spec.ts` for the atomicity/rollback proof.
 *
 * `open` and `cancel` were fixed AFTER Slice 6 shipped: the original audit
 * classified endpoints by "does the use case make multiple writes", which
 * missed that `OpenOrder` and `CancelOrder` each publish an event with a
 * category-1 subscriber (`SetTableOccupiedOnOrderOpened`,
 * `ReleaseTableOnOrderCancelled`) even though the use case itself is
 * single-write. ANY endpoint whose use case triggers a category-1
 * subscriber needs this interceptor — the subscriber has no transaction to
 * run inside otherwise, and the router fails loudly
 * (`MissingUnitOfWorkContext`) rather than degrading silently, which is
 * exactly what surfaced this gap in manual e2e testing: `POST /orders`
 * committed the order row, then threw trying to run
 * `SetTableOccupiedOnOrderOpened` with no ambient context, leaving the order
 * created but its table never marked occupied.
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
    ['open', 'POST /orders (OpenOrder — cat-1 SetTableOccupiedOnOrderOpened)'],
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
    ['cancel', 'POST /orders/:id/cancel (CancelOrder — cat-1 ReleaseTableOnOrderCancelled)'],
    [
      'close',
      'POST /orders/:id/close (CloseOrder — Group A, 6.7 — cat-1 ReleaseTableOnOrderClosed, UpdateLifetimeValueOnOrderClosed, DeductIngredientsOnOrderClosed)'
    ]
  ] as const)('%s carries TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).toContain(TransactionInterceptor)
  })

  it.each([
    ['findById', 'GET /orders/:id (read-only, no interceptor needed)'],
    [
      'applyOrderDiscountEndpoint',
      'PATCH /orders/:id/discount (ApplyOrderDiscount — order-level field only, no cat-1 subscriber)'
    ],
    [
      'removeOrderDiscountEndpoint',
      'DELETE /orders/:id/discount (RemoveOrderDiscount — order-level field only, no cat-1 subscriber)'
    ],
    ['search', 'GET /orders (read-only, no interceptor needed)']
  ] as const)('%s does NOT carry TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).not.toContain(TransactionInterceptor)
  })
})
