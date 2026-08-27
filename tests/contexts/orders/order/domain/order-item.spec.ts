import { OrderItem } from '@contexts/orders/order/domain/order-item'
import { OrderItemStatus } from '@contexts/orders/order/domain/order-item-status'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderItemMother } from './../__mothers__/order-item.mother'

describe('OrderItem', () => {
  describe('create', () => {
    it('should default stationId to null', () => {
      const item = OrderItem.create(
        UuidMother.random(),
        UuidMother.random(),
        'Choripan',
        15000,
        'COP',
        1,
        [],
        null
      )

      expect(item.toPrimitives().stationId).toBeNull()
    })
  })

  describe('markSent', () => {
    it('should persist the given stationId in primitives', () => {
      const stationId = UuidMother.random()
      const item = OrderItem.create(
        UuidMother.random(),
        UuidMother.random(),
        'Choripan',
        15000,
        'COP',
        1,
        [],
        null
      )

      item.markSent(stationId)

      const primitives = item.toPrimitives()
      expect(primitives.stationId).toBe(stationId)
      expect(primitives.status).toBe(OrderItemStatus.SENT)
      expect(primitives.sentAt).not.toBeNull()
    })

    it('should persist null stationId when the item has no station assigned', () => {
      const item = OrderItem.create(
        UuidMother.random(),
        UuidMother.random(),
        'Choripan',
        15000,
        'COP',
        1,
        [],
        null
      )

      item.markSent(null)

      expect(item.toPrimitives().stationId).toBeNull()
    })
  })

  describe('fromPrimitives / toPrimitives round trip', () => {
    it('should round-trip stationId when set', () => {
      const stationId = UuidMother.random()
      const primitives = OrderItemMother.sent({ stationId })

      const item = OrderItem.fromPrimitives(primitives)

      expect(item.toPrimitives().stationId).toBe(stationId)
    })

    it('should round-trip stationId when null', () => {
      const primitives = OrderItemMother.pending({ stationId: null })

      const item = OrderItem.fromPrimitives(primitives)

      expect(item.toPrimitives().stationId).toBeNull()
    })
  })
})
