import { RegisterPurchaseOnItemReceived } from '@contexts/inventory/stock-level/application/subscribers/register-purchase-on-item-received'
import { RegisterPurchase } from '@contexts/inventory/batch/application/register-purchase/register-purchase'
import { PurchaseOrderItemReceivedEvent } from '@contexts/procurement/purchase-order/domain/events/purchase-order-item-received.event'
import {
  DISPATCH_CATEGORIES,
  DispatchCategory
} from '@shared/infrastructure/event-bus/dispatch-category.registry'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'

describe('RegisterPurchaseOnItemReceived', () => {
  const buildEvent = (): PurchaseOrderItemReceivedEvent => {
    return new PurchaseOrderItemReceivedEvent({
      purchaseOrderId: UuidMother.random(),
      orderNumber: 'PO-2026-0001',
      itemId: UuidMother.random(),
      ingredientId: UuidMother.random(),
      quantityReceived: NumberMother.random({ min: 1, max: 100 }),
      unitId: UuidMother.random(),
      unitCost: NumberMother.random({ min: 1, max: 100 }),
      currency: 'COP',
      supplierId: UuidMother.random(),
      receivedDate: new Date('2026-01-15T10:00:00.000Z'),
      occurredOn: new Date('2026-01-15T10:00:00.000Z')
    })
  }

  const buildRegisterPurchaseMock = (): jest.Mocked<RegisterPurchase> => {
    return { run: jest.fn() } as unknown as jest.Mocked<RegisterPurchase>
  }

  it('subscribedTo() returns [PurchaseOrderItemReceivedEvent]', () => {
    const subscriber = new RegisterPurchaseOnItemReceived(buildRegisterPurchaseMock())

    expect(subscriber.subscribedTo()).toEqual([PurchaseOrderItemReceivedEvent])
  })

  it('on() maps the event payload onto RegisterPurchase.run() positionally', async () => {
    const registerPurchase = buildRegisterPurchaseMock()
    const subscriber = new RegisterPurchaseOnItemReceived(registerPurchase)
    const event = buildEvent()
    const payload = event.toPrimitives()

    await subscriber.on(event)

    expect(registerPurchase.run).toHaveBeenCalledTimes(1)
    const args = registerPurchase.run.mock.calls[0]

    expect(typeof args[0]).toBe('string')
    expect(args[0]).toHaveLength(36) // batchId — inventory-owned uuid
    expect(args[1]).toBe(payload.ingredientId)
    expect(args[2]).toBe(payload.quantityReceived)
    expect(args[3]).toBe(payload.unitId)
    expect(args[4]).toBe(payload.unitCost)
    expect(args[5]).toBe(payload.currency)
    expect(args[6]).toBe(payload.receivedDate)
    expect(args[7]).toBeNull()
    expect(args[8]).toBe(payload.supplierId) // supplierId -> supplier
    expect(args[9]).toBe(payload.orderNumber) // orderNumber -> referenceCode
  })

  it('on() generates a distinct batchId per invocation', async () => {
    const registerPurchase = buildRegisterPurchaseMock()
    const subscriber = new RegisterPurchaseOnItemReceived(registerPurchase)

    await subscriber.on(buildEvent())
    await subscriber.on(buildEvent())

    const firstBatchId = registerPurchase.run.mock.calls[0][0]
    const secondBatchId = registerPurchase.run.mock.calls[1][0]

    expect(firstBatchId).not.toBe(secondBatchId)
  })

  it('on() passes null expirationDate', async () => {
    const registerPurchase = buildRegisterPurchaseMock()
    const subscriber = new RegisterPurchaseOnItemReceived(registerPurchase)

    await subscriber.on(buildEvent())

    expect(registerPurchase.run.mock.calls[0][7]).toBeNull()
  })

  it('is registered as DispatchCategory.Synchronous in DISPATCH_CATEGORIES', () => {
    expect(DISPATCH_CATEGORIES.get(RegisterPurchaseOnItemReceived)).toBe(
      DispatchCategory.Synchronous
    )
  })
})
