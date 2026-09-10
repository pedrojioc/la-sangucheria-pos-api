import { StockReservation } from '@contexts/inventory/stock-level/domain/stock-reservation'
import { StockReservationStatus } from '@contexts/inventory/stock-level/domain/stock-reservation-status'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'

describe('StockReservation', () => {
  describe('create', () => {
    it('sets status to ACTIVE', () => {
      // Arrange
      const id = UuidMother.random()
      const orderId = UuidMother.random()
      const itemId = UuidMother.random()
      const ingredientId = UuidMother.random()
      const quantity = NumberMother.positive()
      const unitId = UuidMother.random()

      // Act
      const reservation = StockReservation.create(
        id,
        orderId,
        itemId,
        ingredientId,
        quantity,
        unitId
      )

      // Assert
      expect(reservation.getStatus()).toBe(StockReservationStatus.ACTIVE)
      expect(reservation.isActive()).toBe(true)
    })
  })

  describe('release', () => {
    it('transitions ACTIVE to RELEASED', () => {
      // Arrange
      const reservation = StockReservation.create(
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        NumberMother.positive(),
        UuidMother.random()
      )

      // Act
      reservation.release()

      // Assert
      expect(reservation.getStatus()).toBe(StockReservationStatus.RELEASED)
      expect(reservation.isActive()).toBe(false)
    })

    it('is a no-op when already RELEASED', () => {
      // Arrange
      const reservation = StockReservation.create(
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        NumberMother.positive(),
        UuidMother.random()
      )
      reservation.release()

      // Act
      reservation.release()

      // Assert
      expect(reservation.getStatus()).toBe(StockReservationStatus.RELEASED)
    })

    it('is a no-op when already CONSUMED', () => {
      // Arrange
      const reservation = StockReservation.create(
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        NumberMother.positive(),
        UuidMother.random()
      )
      reservation.consume()

      // Act
      reservation.release()

      // Assert
      expect(reservation.getStatus()).toBe(StockReservationStatus.CONSUMED)
    })
  })

  describe('consume', () => {
    it('transitions ACTIVE to CONSUMED', () => {
      // Arrange
      const reservation = StockReservation.create(
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        NumberMother.positive(),
        UuidMother.random()
      )

      // Act
      reservation.consume()

      // Assert
      expect(reservation.getStatus()).toBe(StockReservationStatus.CONSUMED)
      expect(reservation.isActive()).toBe(false)
    })

    it('is a no-op when already CONSUMED', () => {
      // Arrange
      const reservation = StockReservation.create(
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        NumberMother.positive(),
        UuidMother.random()
      )
      reservation.consume()

      // Act
      reservation.consume()

      // Assert
      expect(reservation.getStatus()).toBe(StockReservationStatus.CONSUMED)
    })

    it('is a no-op when already RELEASED', () => {
      // Arrange
      const reservation = StockReservation.create(
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        NumberMother.positive(),
        UuidMother.random()
      )
      reservation.release()

      // Act
      reservation.consume()

      // Assert
      expect(reservation.getStatus()).toBe(StockReservationStatus.RELEASED)
    })
  })

  describe('fromPrimitives / toPrimitives', () => {
    it('round-trips without data loss', () => {
      // Arrange
      const primitives = {
        id: UuidMother.random(),
        orderId: UuidMother.random(),
        itemId: UuidMother.random(),
        ingredientId: UuidMother.random(),
        quantity: NumberMother.positive(),
        unitId: UuidMother.random(),
        status: StockReservationStatus.ACTIVE
      }

      // Act
      const reservation = StockReservation.fromPrimitives(primitives)

      // Assert
      expect(reservation.toPrimitives()).toEqual(primitives)
    })

    it('round-trips a RELEASED reservation', () => {
      // Arrange
      const primitives = {
        id: UuidMother.random(),
        orderId: UuidMother.random(),
        itemId: UuidMother.random(),
        ingredientId: UuidMother.random(),
        quantity: NumberMother.positive(),
        unitId: UuidMother.random(),
        status: StockReservationStatus.RELEASED
      }

      // Act
      const reservation = StockReservation.fromPrimitives(primitives)

      // Assert
      expect(reservation.toPrimitives()).toEqual(primitives)
    })
  })
})
