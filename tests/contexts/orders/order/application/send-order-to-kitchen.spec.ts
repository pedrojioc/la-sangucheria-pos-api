import { SendOrderToKitchen } from '@contexts/orders/order/application/send-to-kitchen/send-order-to-kitchen'
import { FindOrder } from '@contexts/orders/order/application/find/find-order'
import { OrderRepository } from '@contexts/orders/order/domain/repositories/order.repository'
import {
  StationRoutingPort,
  RoutableItem
} from '@contexts/orders/order/application/ports/station-routing.port'
import { TableLabelPort } from '@contexts/orders/order/application/ports/table-label.port'
import { EventBus } from '@shared/domain/events'
import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderMother } from '../__mothers__/order.mother'
import { OrderItemMother } from '../__mothers__/order-item.mother'

describe('SendOrderToKitchen', () => {
  let useCase: SendOrderToKitchen
  let repository: jest.Mocked<OrderRepository>
  let findOrder: FindOrder
  let eventBus: jest.Mocked<EventBus>
  let stationRouting: jest.Mocked<StationRoutingPort>
  let tableLabel: jest.Mocked<TableLabelPort>

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

    stationRouting = {
      resolveStations: jest.fn()
    } as jest.Mocked<StationRoutingPort>

    tableLabel = {
      findLabelById: jest.fn().mockResolvedValue(null)
    } as jest.Mocked<TableLabelPort>

    findOrder = new FindOrder(repository)
    useCase = new SendOrderToKitchen(repository, findOrder, eventBus, stationRouting, tableLabel)
  })

  it('should resolve stations before sending to kitchen', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId = UuidMother.random()
    const productId = UuidMother.random()
    const stationId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [OrderItemMother.pending({ id: itemId, productId, productName: 'Choripan' })]
    })

    repository.search.mockResolvedValue(order)

    const stationMap = new Map<string, string | null>([[productId, stationId]])
    stationRouting.resolveStations.mockResolvedValue(stationMap)

    await useCase.run(orderId, ticketId, [itemId], 'waiter-1')

    expect(stationRouting.resolveStations).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ productId })])
    )
    expect(repository.save).toHaveBeenCalledTimes(1)
    expect(eventBus.publish).toHaveBeenCalledTimes(1)
  })

  it('should include station assignments in the published event', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId = UuidMother.random()
    const productId = UuidMother.random()
    const stationId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [OrderItemMother.pending({ id: itemId, productId, productName: 'Milanesa' })]
    })

    repository.search.mockResolvedValue(order)

    const stationMap = new Map<string, string | null>([[productId, stationId]])
    stationRouting.resolveStations.mockResolvedValue(stationMap)

    await useCase.run(orderId, ticketId, [itemId], 'waiter-1')

    const publishedEvents = eventBus.publish.mock.calls[0][0]
    const sentEvent = publishedEvents.find((e: any) => e instanceof OrderSentToKitchenEvent)!

    const payload = sentEvent.toPrimitives()
    expect(payload.items[0].stationId).toBe(stationId)
    expect(payload.items[0].productName).toBe('Milanesa')
  })

  it('should handle items with null station assignment (UNASSIGNED)', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId = UuidMother.random()
    const productId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [OrderItemMother.pending({ id: itemId, productId, productName: 'Bebida' })]
    })

    repository.search.mockResolvedValue(order)

    const stationMap = new Map<string, string | null>([[productId, null]])
    stationRouting.resolveStations.mockResolvedValue(stationMap)

    await useCase.run(orderId, ticketId, [itemId], 'waiter-1')

    const publishedEvents = eventBus.publish.mock.calls[0][0]
    const sentEvent = publishedEvents.find((e: any) => e instanceof OrderSentToKitchenEvent)!

    const payload = sentEvent.toPrimitives()
    expect(payload.items[0].stationId).toBeNull()
  })

  it('should only resolve stations for pending items that match itemIds', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const pendingItemId = UuidMother.random()
    const pendingProductId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [
        OrderItemMother.pending({ id: pendingItemId, productId: pendingProductId }),
        OrderItemMother.sent()
      ]
    })

    repository.search.mockResolvedValue(order)

    const stationMap = new Map<string, string | null>([[pendingProductId, null]])
    stationRouting.resolveStations.mockResolvedValue(stationMap)

    await useCase.run(orderId, ticketId, [pendingItemId], 'waiter-1')

    const resolvedItems = stationRouting.resolveStations.mock.calls[0][0] as RoutableItem[]
    expect(resolvedItems).toHaveLength(1)
    expect(resolvedItems[0].productId).toBe(pendingProductId)
  })

  it('should resolve tableLabel via port and include it in the published event', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId = UuidMother.random()
    const productId = UuidMother.random()
    const tableId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      tableId,
      items: [OrderItemMother.pending({ id: itemId, productId })]
    })

    repository.search.mockResolvedValue(order)
    stationRouting.resolveStations.mockResolvedValue(new Map([[productId, null]]))
    tableLabel.findLabelById.mockResolvedValue('Mesa 5')

    await useCase.run(orderId, ticketId, [itemId], 'waiter-1')

    expect(tableLabel.findLabelById).toHaveBeenCalledWith(tableId)

    const publishedEvents = eventBus.publish.mock.calls[0][0]
    const sentEvent = publishedEvents.find((e: any) => e instanceof OrderSentToKitchenEvent)!
    const payload = sentEvent.toPrimitives()
    expect(payload.tableId).toBe(tableId)
    expect(payload.tableLabel).toBe('Mesa 5')
  })

  it('should not call tableLabelPort and set tableLabel to null for takeaway orders', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId = UuidMother.random()
    const productId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      tableId: null,
      items: [OrderItemMother.pending({ id: itemId, productId })]
    })

    repository.search.mockResolvedValue(order)
    stationRouting.resolveStations.mockResolvedValue(new Map([[productId, null]]))

    await useCase.run(orderId, ticketId, [itemId], 'waiter-1')

    expect(tableLabel.findLabelById).not.toHaveBeenCalled()

    const publishedEvents = eventBus.publish.mock.calls[0][0]
    const sentEvent = publishedEvents.find((e: any) => e instanceof OrderSentToKitchenEvent)!
    const payload = sentEvent.toPrimitives()
    expect(payload.tableId).toBeNull()
    expect(payload.tableLabel).toBeNull()
  })
})
