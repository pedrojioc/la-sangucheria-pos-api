import { Station } from '@contexts/kitchen-operations/station/domain/station'
import { StationCreatedEvent } from '@contexts/kitchen-operations/station/domain/events/station-created.event'
import { StationUpdatedEvent } from '@contexts/kitchen-operations/station/domain/events/station-updated.event'
import { PrinterStationRequiresDevice } from '@contexts/kitchen-operations/station/domain/exceptions/printer-station-requires-device.exception'
import { StationMother } from '../__mothers__/station.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('Station (aggregate)', () => {
  describe('create()', () => {
    it('should create a station with isActive true and default KDS output device', () => {
      const id = UuidMother.random()
      const station = Station.create({ id, name: 'Grill', displayOrder: 1, color: '#FF5733' })
      const p = station.toPrimitives()

      expect(p.id).toBe(id)
      expect(p.name).toBe('Grill')
      expect(p.displayOrder).toBe(1)
      expect(p.isActive).toBe(true)
      expect(p.color).toBe('#FF5733')
      expect(p.outputDevice).toBe('kds')
      expect(p.discoveredPrinterDeviceId).toBeNull()
    })

    it('should create a station with null color', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Prep',
        displayOrder: 0,
        color: null
      })
      const p = station.toPrimitives()

      expect(p.color).toBeNull()
    })

    it('should record a StationCreatedEvent', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Grill',
        displayOrder: 1,
        color: '#FF5733'
      })
      const events = station.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(StationCreatedEvent)
    })

    it('should include correct payload in StationCreatedEvent', () => {
      const id = UuidMother.random()
      const station = Station.create({ id, name: 'Grill', displayOrder: 1, color: '#FF5733' })
      const event = station.pullDomainEvents()[0] as StationCreatedEvent
      const payload = event.toPrimitives()

      expect(payload.stationId).toBe(id)
      expect(payload.name).toBe('Grill')
      expect(payload.displayOrder).toBe(1)
      expect(payload.color).toBe('#FF5733')
      expect(payload.outputDevice).toBe('kds')
      expect(payload.discoveredPrinterDeviceId).toBeNull()
    })

    it('should throw if name is empty', () => {
      expect(() =>
        Station.create({ id: UuidMother.random(), name: '   ', displayOrder: 0, color: null })
      ).toThrow()
    })

    it('should throw if name exceeds 50 chars', () => {
      expect(() =>
        Station.create({
          id: UuidMother.random(),
          name: 'A'.repeat(51),
          displayOrder: 0,
          color: null
        })
      ).toThrow()
    })

    it('should throw if displayOrder is negative', () => {
      expect(() =>
        Station.create({ id: UuidMother.random(), name: 'Grill', displayOrder: -1, color: null })
      ).toThrow()
    })

    it('should throw if displayOrder is not an integer', () => {
      expect(() =>
        Station.create({ id: UuidMother.random(), name: 'Grill', displayOrder: 1.5, color: null })
      ).toThrow()
    })

    it('should throw if color is not a valid hex (#RRGGBB)', () => {
      expect(() =>
        Station.create({ id: UuidMother.random(), name: 'Grill', displayOrder: 0, color: 'red' })
      ).toThrow()
    })

    it('should throw if color is a 4-char hex shorthand', () => {
      expect(() =>
        Station.create({ id: UuidMother.random(), name: 'Grill', displayOrder: 0, color: '#FFF' })
      ).toThrow()
    })

    it('should create a station with PRINTER output device and a discoveredPrinterDeviceId', () => {
      const deviceId = UuidMother.random()
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Receipt',
        displayOrder: 0,
        color: null,
        outputDevice: 'printer',
        discoveredPrinterDeviceId: deviceId
      })
      const p = station.toPrimitives()

      expect(p.outputDevice).toBe('printer')
      expect(p.discoveredPrinterDeviceId).toBe(deviceId)
    })

    it('should throw PrinterStationRequiresDevice when PRINTER without discoveredPrinterDeviceId', () => {
      expect(() =>
        Station.create({
          id: UuidMother.random(),
          name: 'Receipt',
          displayOrder: 0,
          color: null,
          outputDevice: 'printer'
        })
      ).toThrow(PrinterStationRequiresDevice)
    })

    it('should create a station with KDS output device and no discoveredPrinterDeviceId', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Grill',
        displayOrder: 0,
        color: null,
        outputDevice: 'kds'
      })
      const p = station.toPrimitives()

      expect(p.outputDevice).toBe('kds')
      expect(p.discoveredPrinterDeviceId).toBeNull()
    })

    it('should create a station with NONE output device and no discoveredPrinterDeviceId', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Archive',
        displayOrder: 0,
        color: null,
        outputDevice: 'none'
      })
      const p = station.toPrimitives()

      expect(p.outputDevice).toBe('none')
      expect(p.discoveredPrinterDeviceId).toBeNull()
    })
  })

  describe('update()', () => {
    it('should return updated station and record StationUpdatedEvent', () => {
      const station = StationMother.grill()
      const updated = station.update({
        name: 'Parrilla',
        displayOrder: 2,
        isActive: false,
        color: '#00FF00'
      })
      const p = updated.toPrimitives()

      expect(p.name).toBe('Parrilla')
      expect(p.displayOrder).toBe(2)
      expect(p.isActive).toBe(false)
      expect(p.color).toBe('#00FF00')

      const events = updated.pullDomainEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(StationUpdatedEvent)
    })

    it('should include correct payload in StationUpdatedEvent', () => {
      const station = StationMother.grill()
      const updated = station.update({
        name: 'Parrilla',
        displayOrder: 2,
        isActive: false,
        color: null
      })
      const event = updated.pullDomainEvents()[0] as StationUpdatedEvent
      const payload = event.toPrimitives()

      expect(payload.stationId).toBe(station.id.value)
      expect(payload.name).toBe('Parrilla')
      expect(payload.displayOrder).toBe(2)
      expect(payload.isActive).toBe(false)
      expect(payload.color).toBeNull()
      expect(payload.discoveredPrinterDeviceId).toBeNull()
    })

    it('should allow updating color to null', () => {
      const station = StationMother.grill()
      const updated = station.update({
        name: 'Grill',
        displayOrder: 1,
        isActive: true,
        color: null
      })

      expect(updated.toPrimitives().color).toBeNull()
    })

    it('should allow switching to PRINTER with a discoveredPrinterDeviceId', () => {
      const deviceId = UuidMother.random()
      const station = StationMother.grill()
      const updated = station.update({
        name: 'Grill',
        displayOrder: 1,
        isActive: true,
        color: '#FF5733',
        outputDevice: 'printer',
        discoveredPrinterDeviceId: deviceId
      })
      const p = updated.toPrimitives()

      expect(p.outputDevice).toBe('printer')
      expect(p.discoveredPrinterDeviceId).toBe(deviceId)
    })

    it('should throw PrinterStationRequiresDevice when switching to PRINTER without discoveredPrinterDeviceId', () => {
      const station = StationMother.grill()

      expect(() =>
        station.update({
          name: 'Grill',
          displayOrder: 1,
          isActive: true,
          color: '#FF5733',
          outputDevice: 'printer'
        })
      ).toThrow(PrinterStationRequiresDevice)
    })

    it('should allow switching from PRINTER to KDS without a discoveredPrinterDeviceId', () => {
      const station = StationMother.withPrinter()
      const updated = station.update({
        name: station.getName(),
        displayOrder: 1,
        isActive: true,
        color: null,
        outputDevice: 'kds'
      })
      const p = updated.toPrimitives()

      expect(p.outputDevice).toBe('kds')
      expect(p.discoveredPrinterDeviceId).toBeNull()
    })

    it('should preserve existing outputDevice and discoveredPrinterDeviceId when not provided in update', () => {
      const deviceId = UuidMother.random()
      const station = StationMother.withPrinter(deviceId)
      const updated = station.update({
        name: station.getName(),
        displayOrder: 1,
        isActive: true,
        color: null
      })
      const p = updated.toPrimitives()

      expect(p.outputDevice).toBe('printer')
      expect(p.discoveredPrinterDeviceId).toBe(deviceId)
    })

    it('should throw when discoveredPrinterDeviceId is an invalid UUID', () => {
      const station = StationMother.grill()

      expect(() =>
        station.update({
          name: 'Grill',
          displayOrder: 1,
          isActive: true,
          color: '#FF5733',
          outputDevice: 'printer',
          discoveredPrinterDeviceId: 'not-a-uuid'
        })
      ).toThrow()
    })
  })

  describe('fromPrimitives() / toPrimitives()', () => {
    it('should round-trip primitives', () => {
      const original = StationMother.random()
      const primitives = original.toPrimitives()
      const restored = Station.fromPrimitives(primitives)

      expect(restored.toPrimitives()).toEqual(primitives)
    })

    it('should round-trip primitives with printer output device', () => {
      const original = StationMother.withPrinter()
      const primitives = original.toPrimitives()
      const restored = Station.fromPrimitives(primitives)

      expect(restored.toPrimitives()).toEqual(primitives)
    })

    it('should not expose printerAddress, usbIdentifier or connectionType on primitives', () => {
      const station = StationMother.withPrinter()
      const primitives = station.toPrimitives() as unknown as Record<string, unknown>

      expect(primitives.printerAddress).toBeUndefined()
      expect(primitives.usbIdentifier).toBeUndefined()
      expect(primitives.connectionType).toBeUndefined()
      expect(primitives.discoveredPrinterDeviceId).toBeDefined()
    })
  })

  describe('getName()', () => {
    it('should return the station name value', () => {
      const station = StationMother.grill()
      expect(station.getName()).toBe('Grill')
    })
  })
})
