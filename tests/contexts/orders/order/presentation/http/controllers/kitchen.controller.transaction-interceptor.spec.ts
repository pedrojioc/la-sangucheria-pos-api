import { INTERCEPTORS_METADATA } from '@nestjs/common/constants'

import { KitchenController } from '@contexts/orders/order/presentation/http/controllers/kitchen.controller'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

/**
 * Slice 6 Group B — proves the 2 KitchenController endpoints carry
 * `@UseInterceptors(TransactionInterceptor)`.
 *
 * Both routes were verified directly against controller source per the
 * tasks artifact: MarkOrderItemReady and MarkOrderItemDelivered actually
 * live in KitchenController (not OrderController), and both are PATCH, not
 * POST. Same atomicity root cause as OrderController's Group B endpoints —
 * see order.controller.transaction-interceptor.spec.ts and
 * typeorm-order.repository.uow.spec.ts.
 */
describe('KitchenController — TransactionInterceptor wiring (Slice 6 Group B)', () => {
  const readInterceptors = (methodName: keyof KitchenController): unknown[] => {
    const handler = KitchenController.prototype[methodName] as unknown as (
      ...args: unknown[]
    ) => unknown
    return (Reflect.getMetadata(INTERCEPTORS_METADATA, handler) as unknown[]) ?? []
  }

  it.each([
    ['markReady', 'PATCH /orders/:id/items/:itemId/ready (MarkOrderItemReady)'],
    ['markDelivered', 'PATCH /orders/:id/items/:itemId/delivered (MarkOrderItemDelivered)']
  ] as const)('%s carries TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).toContain(TransactionInterceptor)
  })

  it.each([
    ['getQueue', 'GET /orders/kitchen/queue (read-only, no interceptor needed)'],
    ['streamKitchenQueue', 'SSE /orders/kitchen/stream (read-only, no interceptor needed)']
  ] as const)('%s does NOT carry TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).not.toContain(TransactionInterceptor)
  })
})
