import { KitchenBoardProjector } from '@contexts/kitchen-operations/kitchen-board/application/subscribers/kitchen-board-projector'
import {
  KitchenBoardItemRepository,
  KitchenBoardItemData
} from '@contexts/kitchen-operations/kitchen-board/domain/kitchen-board-item.repository'
import { KitchenBoardEventEmitter } from '@contexts/kitchen-operations/kitchen-board/application/services/kitchen-board-event-emitter'
import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { OrderItemReadyEvent } from '@contexts/orders/order/domain/events/order-item-ready.event'
import { OrderItemDeliveredEvent } from '@contexts/orders/order/domain/events/order-item-delivered.event'
import { OrderItemCancelledEvent } from '@contexts/orders/order/domain/events/order-item-cancelled.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('KitchenBoardProjector', () => {
  let projector: KitchenBoardProjector
  let mockRepository: jest.Mocked<KitchenBoardItemRepository>
  let mockEmitter: jest.Mocked<KitchenBoardEventEmitter>

  beforeEach(() => {
    mockRepository = {
      upsert: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      existsByItemId: jest.fn().mockResolvedValue(true),
      findStationIdByItemId: jest.fn().mockResolvedValue('station-1')
    } as any

    mockEmitter = {
      notifyBoardUpdate: jest.fn()
    } as any

    projector = new KitchenBoardProjector(mockRepository, mockEmitter)
  })

  describe('subscribedTo()', () => {
    it('should subscribe to all four order events', () => {
      const events = projector.subscribedTo()
      expect(events).toHaveLength(4)
      expect(events).toContain(OrderSentToKitchenEvent)
      expect(events).toContain(OrderItemReadyEvent)
      expect(events).toContain(OrderItemDeliveredEvent)
      expect(events).toContain(OrderItemCancelledEvent)
    })
  })

  describe('on OrderSentToKitchenEvent', () => {
    it('should upsert one row per item with correct data', async () => {
      const orderId = UuidMother.random()
      const itemId1 = UuidMother.random()
      const itemId2 = UuidMother.random()
      const stationId = UuidMother.random()
      const sentAt = new Date()

      const event = new OrderSentToKitchenEvent({
        orderId,
        orderNumber: '#001',
        ticketId: UuidMother.random(),
        ticketNumber: 1,
        items: [
          {
            itemId: itemId1,
            stationId,
            productName: 'Burger',
            quantity: 2,
            notes: 'No onion',
            modifiers: []
          },
          {
            itemId: itemId2,
            stationId: null,
            productName: 'Fries',
            quantity: 1,
            notes: null,
            modifiers: []
          }
        ],
        sentBy: 'user-1',
        sentAt,
        tableId: null,
        tableLabel: null
      })

      await projector.on(event)

      expect(mockRepository.upsert).toHaveBeenCalledTimes(2)

      const firstCall = mockRepository.upsert.mock.calls[0][0] as KitchenBoardItemData
      expect(firstCall.orderId).toBe(orderId)
      expect(firstCall.itemId).toBe(itemId1)
      expect(firstCall.itemName).toBe('Burger')
      expect(firstCall.stationId).toBe(stationId)
      expect(firstCall.status).toBe('SENT')
      expect(firstCall.quantity).toBe(2)
      expect(firstCall.notes).toBe('No onion')

      const secondCall = mockRepository.upsert.mock.calls[1][0] as KitchenBoardItemData
      expect(secondCall.itemId).toBe(itemId2)
      expect(secondCall.stationId).toBeNull()
    })

    it('should notify board update for each unique stationId', async () => {
      const stationId = UuidMother.random()
      const event = new OrderSentToKitchenEvent({
        orderId: UuidMother.random(),
        orderNumber: '#002',
        ticketId: UuidMother.random(),
        ticketNumber: 1,
        items: [
          {
            itemId: UuidMother.random(),
            stationId,
            productName: 'A',
            quantity: 1,
            notes: null,
            modifiers: []
          },
          {
            itemId: UuidMother.random(),
            stationId,
            productName: 'B',
            quantity: 1,
            notes: null,
            modifiers: []
          },
          {
            itemId: UuidMother.random(),
            stationId: null,
            productName: 'C',
            quantity: 1,
            notes: null,
            modifiers: []
          }
        ],
        sentBy: 'user-1',
        sentAt: new Date(),
        tableId: null,
        tableLabel: null
      })

      await projector.on(event)

      expect(mockEmitter.notifyBoardUpdate).toHaveBeenCalledTimes(2)
      expect(mockEmitter.notifyBoardUpdate).toHaveBeenCalledWith(stationId)
      expect(mockEmitter.notifyBoardUpdate).toHaveBeenCalledWith(null)
    })
  })

  describe('on OrderItemReadyEvent', () => {
    it('should update status to READY with readyAt timestamp', async () => {
      const itemId = UuidMother.random()
      const event = new OrderItemReadyEvent({
        orderId: UuidMother.random(),
        itemId,
        readyAt: new Date()
      })

      await projector.on(event)

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        itemId,
        'READY',
        expect.objectContaining({ readyAt: expect.any(Date) })
      )
      expect(mockRepository.findStationIdByItemId).toHaveBeenCalledWith(itemId)
      expect(mockEmitter.notifyBoardUpdate).toHaveBeenCalledWith('station-1')
    })

    it('should skip update if item does not exist in read model (idempotency)', async () => {
      mockRepository.existsByItemId.mockResolvedValue(false)

      const event = new OrderItemReadyEvent({
        orderId: UuidMother.random(),
        itemId: UuidMother.random(),
        readyAt: new Date()
      })

      await projector.on(event)

      expect(mockRepository.updateStatus).not.toHaveBeenCalled()
    })
  })

  describe('on OrderItemDeliveredEvent', () => {
    it('should update status to DELIVERED with deliveredAt timestamp', async () => {
      const itemId = UuidMother.random()
      const event = new OrderItemDeliveredEvent({
        orderId: UuidMother.random(),
        itemId,
        deliveredBy: 'waiter-1',
        deliveredAt: new Date(),
        orderAutoCompleted: false
      })

      await projector.on(event)

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        itemId,
        'DELIVERED',
        expect.objectContaining({ deliveredAt: expect.any(Date) })
      )
    })
  })

  describe('on OrderItemCancelledEvent', () => {
    it('should update status to CANCELLED with cancelledAt timestamp', async () => {
      const itemId = UuidMother.random()
      const event = new OrderItemCancelledEvent({
        orderId: UuidMother.random(),
        itemId,
        reason: 'out of stock',
        cancelledBy: 'manager-1',
        cancelledAt: new Date()
      })

      await projector.on(event)

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        itemId,
        'CANCELLED',
        expect.objectContaining({ cancelledAt: expect.any(Date) })
      )
    })

    it('should skip if item does not exist in read model', async () => {
      mockRepository.existsByItemId.mockResolvedValue(false)

      const event = new OrderItemCancelledEvent({
        orderId: UuidMother.random(),
        itemId: UuidMother.random(),
        reason: 'test',
        cancelledBy: 'admin',
        cancelledAt: new Date()
      })

      await projector.on(event)

      expect(mockRepository.updateStatus).not.toHaveBeenCalled()
    })
  })
})
