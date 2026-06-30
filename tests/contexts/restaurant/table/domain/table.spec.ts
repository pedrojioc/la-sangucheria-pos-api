import { Table } from '@contexts/restaurant/table/domain/table'
import { TableStatus } from '@contexts/restaurant/table/domain/table-status'
import { TableShape } from '@contexts/restaurant/table/domain/table-shape'
import { TableCreatedEvent } from '@contexts/restaurant/table/domain/events/table-created.event'
import { TableUpdatedEvent } from '@contexts/restaurant/table/domain/events/table-updated.event'
import { TableStatusChangedEvent } from '@contexts/restaurant/table/domain/events/table-status-changed.event'
import { TableOccupied } from '@contexts/restaurant/table/domain/exceptions/table-occupied.exception'
import { TableInactive } from '@contexts/restaurant/table/domain/exceptions/table-inactive.exception'
import { TableMother } from '../__mothers__/table.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('Table (aggregate)', () => {
  describe('create()', () => {
    it('should create a table with AVAILABLE status and no currentOrderId', () => {
      const id = UuidMother.random()
      const table = Table.create(id, '5', 4, TableShape.SQUARE)
      const p = table.toPrimitives()

      expect(p.id).toBe(id)
      expect(p.number).toBe('5')
      expect(p.capacity).toBe(4)
      expect(p.status).toBe(TableStatus.AVAILABLE)
      expect(p.currentOrderId).toBeNull()
    })

    it('should record a TableCreatedEvent', () => {
      const table = Table.create(UuidMother.random(), '1', 2, TableShape.SQUARE)
      const events = table.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(TableCreatedEvent)
    })

    it('should throw if number exceeds 20 chars', () => {
      expect(() =>
        Table.create(UuidMother.random(), 'A'.repeat(21), 4, TableShape.SQUARE)
      ).toThrow()
    })

    it('should throw if number is empty', () => {
      expect(() => Table.create(UuidMother.random(), '   ', 4, TableShape.SQUARE)).toThrow()
    })

    it('should throw if capacity < 1', () => {
      expect(() => Table.create(UuidMother.random(), '1', 0, TableShape.SQUARE)).toThrow()
    })

    it('should throw if capacity is not integer', () => {
      expect(() => Table.create(UuidMother.random(), '1', 1.5, TableShape.SQUARE)).toThrow()
    })
  })

  describe('update()', () => {
    it('should return updated table and record TableUpdatedEvent', () => {
      const table = TableMother.mesa1()
      const updated = table.update('1A', 6, TableShape.SQUARE)
      const p = updated.toPrimitives()

      expect(p.number).toBe('1A')
      expect(p.capacity).toBe(6)

      const events = updated.pullDomainEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(TableUpdatedEvent)
    })

    it('should preserve status and currentOrderId after update', () => {
      const orderId = UuidMother.random()
      const table = TableMother.create({ status: TableStatus.OCCUPIED, currentOrderId: orderId })
      const updated = table.update('2', 4, TableShape.SQUARE)
      const p = updated.toPrimitives()

      expect(p.status).toBe(TableStatus.OCCUPIED)
      expect(p.currentOrderId).toBe(orderId)
    })
  })

  describe('changeStatus()', () => {
    it('should change status and record TableStatusChangedEvent', () => {
      const table = TableMother.available()
      table.changeStatus(TableStatus.RESERVED)

      expect(table.toPrimitives().status).toBe(TableStatus.RESERVED)

      const events = table.pullDomainEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(TableStatusChangedEvent)
    })

    it('should throw TableOccupied when trying to set INACTIVE on an OCCUPIED table', () => {
      const table = TableMother.occupied()
      expect(() => table.changeStatus(TableStatus.INACTIVE)).toThrow(TableOccupied)
    })

    it('should include previousStatus and newStatus in the event', () => {
      const table = TableMother.available()
      table.changeStatus(TableStatus.RESERVED)

      const event = table.pullDomainEvents()[0] as TableStatusChangedEvent
      const payload = event.toPrimitives()

      expect(payload.previousStatus).toBe(TableStatus.AVAILABLE)
      expect(payload.newStatus).toBe(TableStatus.RESERVED)
    })
  })

  describe('setCurrentOrder() / clearCurrentOrder()', () => {
    it('setCurrentOrder should mark table as OCCUPIED with the given orderId', () => {
      const table = TableMother.available()
      const orderId = UuidMother.random()
      table.setCurrentOrder(orderId)
      const p = table.toPrimitives()

      expect(p.status).toBe(TableStatus.OCCUPIED)
      expect(p.currentOrderId).toBe(orderId)
    })

    it('clearCurrentOrder should mark table as AVAILABLE with null currentOrderId', () => {
      const table = TableMother.occupied()
      table.clearCurrentOrder()
      const p = table.toPrimitives()

      expect(p.status).toBe(TableStatus.AVAILABLE)
      expect(p.currentOrderId).toBeNull()
    })
  })

  describe('ensureIsAvailable()', () => {
    it('should throw TableOccupied when table is OCCUPIED', () => {
      const table = TableMother.occupied()
      expect(() => table.ensureIsAvailable()).toThrow(TableOccupied)
    })

    it('should throw TableInactive when table is INACTIVE', () => {
      const table = TableMother.inactive()
      expect(() => table.ensureIsAvailable()).toThrow(TableInactive)
    })

    it('should not throw when table is AVAILABLE', () => {
      const table = TableMother.available()
      expect(() => table.ensureIsAvailable()).not.toThrow()
    })
  })
})
