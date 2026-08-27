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
import { OrderItemStationUnresolved } from '@contexts/orders/order/domain/exceptions/order-item-station-unresolved.exception'
import { OrderHasNoPendingItems } from '@contexts/orders/order/domain/exceptions/order-has-no-pending-items.exception'
import { KitchenBoardEventEmitter } from '@contexts/kitchen-operations/kitchen-board/application/services/kitchen-board-event-emitter'
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

    stationRouting = {
      resolveStations: jest.fn()
    } as jest.Mocked<StationRoutingPort>

    tableLabel = {
      findLabelById: jest.fn().mockResolvedValue(null)
    } as jest.Mocked<TableLabelPort>

    boardEmitter = {
      notifyBoardUpdate: jest.fn(),
      streamForStation: jest.fn()
    } as unknown as jest.Mocked<KitchenBoardEventEmitter>

    findOrder = new FindOrder(repository)
    useCase = new SendOrderToKitchen(
      repository,
      findOrder,
      eventBus,
      stationRouting,
      tableLabel,
      boardEmitter
    )
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

  it("should throw OrderItemStationUnresolved when a pending item's productId is absent from stationAssignments", async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId = UuidMother.random()
    const productId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [OrderItemMother.pending({ id: itemId, productId, productName: 'Bebida' })]
    })

    repository.search.mockResolvedValue(order)

    stationRouting.resolveStations.mockResolvedValue(new Map<string, string | null>())

    await expect(useCase.run(orderId, ticketId, [itemId], 'waiter-1')).rejects.toThrow(
      OrderItemStationUnresolved
    )
    expect(repository.save).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })

  it("should throw OrderItemStationUnresolved when a pending item's station resolves to null", async () => {
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

    await expect(useCase.run(orderId, ticketId, [itemId], 'waiter-1')).rejects.toThrow(
      OrderItemStationUnresolved
    )
    expect(repository.save).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })

  it('should only resolve stations for pending items that match itemIds', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const pendingItemId = UuidMother.random()
    const pendingProductId = UuidMother.random()
    const stationId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [
        OrderItemMother.pending({ id: pendingItemId, productId: pendingProductId }),
        OrderItemMother.sent()
      ]
    })

    repository.search.mockResolvedValue(order)

    const stationMap = new Map<string, string | null>([[pendingProductId, stationId]])
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
    const stationId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      tableId,
      items: [OrderItemMother.pending({ id: itemId, productId })]
    })

    repository.search.mockResolvedValue(order)
    stationRouting.resolveStations.mockResolvedValue(
      new Map<string, string | null>([[productId, stationId]])
    )
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
    const stationId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      tableId: null,
      items: [OrderItemMother.pending({ id: itemId, productId })]
    })

    repository.search.mockResolvedValue(order)
    stationRouting.resolveStations.mockResolvedValue(
      new Map<string, string | null>([[productId, stationId]])
    )

    await useCase.run(orderId, ticketId, [itemId], 'waiter-1')

    expect(tableLabel.findLabelById).not.toHaveBeenCalled()

    const publishedEvents = eventBus.publish.mock.calls[0][0]
    const sentEvent = publishedEvents.find((e: any) => e instanceof OrderSentToKitchenEvent)!
    const payload = sentEvent.toPrimitives()
    expect(payload.tableId).toBeNull()
    expect(payload.tableLabel).toBeNull()
  })

  it('should reject the whole batch when only one of several pending items is unresolved', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId1 = UuidMother.random()
    const itemId2 = UuidMother.random()
    const itemId3 = UuidMother.random()
    const productId1 = UuidMother.random()
    const productId2 = UuidMother.random()
    const productId3 = UuidMother.random()
    const stationId1 = UuidMother.random()
    const stationId2 = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [
        OrderItemMother.pending({ id: itemId1, productId: productId1 }),
        OrderItemMother.pending({ id: itemId2, productId: productId2 }),
        OrderItemMother.pending({ id: itemId3, productId: productId3 })
      ]
    })

    repository.search.mockResolvedValue(order)

    const stationMap = new Map<string, string | null>([
      [productId1, stationId1],
      [productId2, stationId2],
      [productId3, null]
    ])
    stationRouting.resolveStations.mockResolvedValue(stationMap)

    await expect(
      useCase.run(orderId, ticketId, [itemId1, itemId2, itemId3], 'waiter-1')
    ).rejects.toThrow(OrderItemStationUnresolved)
    expect(repository.save).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })

  it('should throw OrderHasNoPendingItems, not OrderItemStationUnresolved, when there are zero pending items', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const sentItemId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [OrderItemMother.sent({ id: sentItemId })]
    })

    repository.search.mockResolvedValue(order)
    stationRouting.resolveStations.mockResolvedValue(new Map<string, string | null>())

    await expect(useCase.run(orderId, ticketId, [sentItemId], 'waiter-1')).rejects.toThrow(
      OrderHasNoPendingItems
    )
  })

  it('should succeed unchanged when every pending item in a multi-item batch resolves', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId1 = UuidMother.random()
    const itemId2 = UuidMother.random()
    const productId1 = UuidMother.random()
    const productId2 = UuidMother.random()
    const stationId1 = UuidMother.random()
    const stationId2 = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [
        OrderItemMother.pending({ id: itemId1, productId: productId1 }),
        OrderItemMother.pending({ id: itemId2, productId: productId2 })
      ]
    })

    repository.search.mockResolvedValue(order)

    const stationMap = new Map<string, string | null>([
      [productId1, stationId1],
      [productId2, stationId2]
    ])
    stationRouting.resolveStations.mockResolvedValue(stationMap)

    await expect(
      useCase.run(orderId, ticketId, [itemId1, itemId2], 'waiter-1')
    ).resolves.not.toThrow()

    expect(repository.save).toHaveBeenCalledTimes(1)
    expect(eventBus.publish).toHaveBeenCalledTimes(1)

    const publishedEvents = eventBus.publish.mock.calls[0][0]
    const sentEvent = publishedEvents.find((e: any) => e instanceof OrderSentToKitchenEvent)!
    const payload = sentEvent.toPrimitives()
    expect(payload.items[0].stationId).not.toBeNull()
    expect(payload.items[1].stationId).not.toBeNull()
  })

  it('should log the unresolved productIds server-side via console.error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId = UuidMother.random()
    const productId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [OrderItemMother.pending({ id: itemId, productId })]
    })

    repository.search.mockResolvedValue(order)
    stationRouting.resolveStations.mockResolvedValue(new Map<string, string | null>())

    await expect(useCase.run(orderId, ticketId, [itemId], 'waiter-1')).rejects.toThrow(
      OrderItemStationUnresolved
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ unresolvedProductIds: expect.arrayContaining([productId]) })
    )

    consoleErrorSpy.mockRestore()
  })

  it('should notify the board once per distinct station after save', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId1 = UuidMother.random()
    const itemId2 = UuidMother.random()
    const itemId3 = UuidMother.random()
    const productId1 = UuidMother.random()
    const productId2 = UuidMother.random()
    const productId3 = UuidMother.random()
    const stationId1 = UuidMother.random()
    const stationId2 = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [
        OrderItemMother.pending({ id: itemId1, productId: productId1 }),
        OrderItemMother.pending({ id: itemId2, productId: productId2 }),
        OrderItemMother.pending({ id: itemId3, productId: productId3 })
      ]
    })

    repository.save.mockImplementation(async () => {})
    repository.search.mockResolvedValue(order)

    const stationMap = new Map<string, string | null>([
      [productId1, stationId1],
      [productId2, stationId1],
      [productId3, stationId2]
    ])
    stationRouting.resolveStations.mockResolvedValue(stationMap)

    await useCase.run(orderId, ticketId, [itemId1, itemId2, itemId3], 'waiter-1')

    expect(boardEmitter.notifyBoardUpdate).toHaveBeenCalledTimes(2)
    expect(boardEmitter.notifyBoardUpdate).toHaveBeenCalledWith(stationId1)
    expect(boardEmitter.notifyBoardUpdate).toHaveBeenCalledWith(stationId2)
  })

  it('should notify the board only after repository.save resolves', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId = UuidMother.random()
    const productId = UuidMother.random()
    const stationId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [OrderItemMother.pending({ id: itemId, productId })]
    })

    repository.search.mockResolvedValue(order)
    stationRouting.resolveStations.mockResolvedValue(
      new Map<string, string | null>([[productId, stationId]])
    )

    const callOrder: string[] = []
    repository.save.mockImplementation(() => {
      callOrder.push('save')
      return Promise.resolve()
    })
    boardEmitter.notifyBoardUpdate.mockImplementation(() => {
      callOrder.push('notify')
    })

    await useCase.run(orderId, ticketId, [itemId], 'waiter-1')

    expect(callOrder).toEqual(['save', 'notify'])
  })

  it('should not notify the board when sending fails', async () => {
    const orderId = UuidMother.random()
    const ticketId = UuidMother.random()
    const itemId = UuidMother.random()
    const productId = UuidMother.random()

    const order = OrderMother.create({
      id: orderId,
      items: [OrderItemMother.pending({ id: itemId, productId })]
    })

    repository.search.mockResolvedValue(order)
    stationRouting.resolveStations.mockResolvedValue(new Map<string, string | null>())

    await expect(useCase.run(orderId, ticketId, [itemId], 'waiter-1')).rejects.toThrow(
      OrderItemStationUnresolved
    )

    expect(boardEmitter.notifyBoardUpdate).not.toHaveBeenCalled()
  })
})
