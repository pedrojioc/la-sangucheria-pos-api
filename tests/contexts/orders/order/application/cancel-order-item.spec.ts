import { CancelOrderItem } from '@contexts/orders/order/application/cancel-item/cancel-order-item'
import { FindOrder } from '@contexts/orders/order/application/find/find-order'
import { OrderRepository } from '@contexts/orders/order/domain/repositories/order.repository'
import { EventBus } from '@shared/domain/events'
import { KitchenBoardEventEmitter } from '@contexts/kitchen-operations/kitchen-board/application/services/kitchen-board-event-emitter'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderMother } from '../__mothers__/order.mother'
import { OrderItemMother } from '../__mothers__/order-item.mother'

describe('CancelOrderItem', () => {
  let useCase: CancelOrderItem
  let repository: jest.Mocked<OrderRepository>
  let findOrder: FindOrder
  let eventBus: jest.Mocked<EventBus>
  let boardEmitter: jest.Mocked<KitchenBoardEventEmitter>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      nextOrderNumber: jest.fn(),
      searchWithActiveKitchenItems: jest.fn()
    } as jest.Mocked<OrderRepository>

    eventBus = {
      publish: jest.fn(),
      addSubscribers: jest.fn()
    } as unknown as jest.Mocked<EventBus>

    boardEmitter = {
      notifyBoardUpdate: jest.fn(),
      streamForStation: jest.fn()
    } as unknown as jest.Mocked<KitchenBoardEventEmitter>

    findOrder = new FindOrder(repository)
    useCase = new CancelOrderItem(repository, findOrder, eventBus, boardEmitter)
  })

  it("should notify the board with the item's station after save", async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()
    const stationId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [OrderItemMother.sent({ id: itemId, stationId })]
    })

    repository.search.mockResolvedValue(order)

    const callOrder: string[] = []
    repository.save.mockImplementation(() => {
      callOrder.push('save')
      return Promise.resolve()
    })
    boardEmitter.notifyBoardUpdate.mockImplementation(() => {
      callOrder.push('notify')
    })

    await useCase.run(orderId, itemId, 'Out of stock', 'waiter-1')

    expect(boardEmitter.notifyBoardUpdate).toHaveBeenCalledTimes(1)
    expect(boardEmitter.notifyBoardUpdate).toHaveBeenCalledWith(stationId)
    expect(callOrder).toEqual(['save', 'notify'])
  })

  it('should not notify the board when the item is already delivered', async () => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [OrderItemMother.delivered({ id: itemId })]
    })

    repository.search.mockResolvedValue(order)

    await expect(useCase.run(orderId, itemId, 'reason', 'waiter-1')).rejects.toThrow()
    expect(boardEmitter.notifyBoardUpdate).not.toHaveBeenCalled()
  })
})
