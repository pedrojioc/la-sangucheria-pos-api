import { OnOrderSentPrintKitchenTicket } from '@contexts/kitchen-operations/kitchen-printer/application/subscribers/on-order-sent-print-kitchen-ticket'
import { KitchenPrinterDispatcher } from '@contexts/kitchen-operations/kitchen-printer/application/kitchen-printer-dispatcher'
import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { OrderType } from '@contexts/orders/order/domain/order-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('OnOrderSentPrintKitchenTicket', () => {
  let dispatcher: jest.Mocked<KitchenPrinterDispatcher>
  let subscriber: OnOrderSentPrintKitchenTicket

  beforeEach(() => {
    dispatcher = {
      run: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<KitchenPrinterDispatcher>

    subscriber = new OnOrderSentPrintKitchenTicket(dispatcher)
  })

  it('is subscribed to OrderSentToKitchenEvent', () => {
    expect(subscriber.subscribedTo()).toEqual([OrderSentToKitchenEvent])
  })

  it('delegates to the dispatcher when handling the event', async () => {
    const event = new OrderSentToKitchenEvent({
      orderId: UuidMother.random(),
      orderNumber: '#001',
      ticketId: UuidMother.random(),
      ticketNumber: 1,
      items: [],
      sentBy: 'waiter-1',
      sentAt: new Date(),
      tableId: null,
      tableLabel: null,
      orderType: OrderType.DINE_IN
    })

    await subscriber.on(event)

    expect(dispatcher.run).toHaveBeenCalledTimes(1)
    expect(dispatcher.run).toHaveBeenCalledWith(event)
  })
})
