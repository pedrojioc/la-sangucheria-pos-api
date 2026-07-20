import { Station } from '@contexts/kitchen-operations/station/domain/station'
import { StationCreatedEvent } from '@contexts/kitchen-operations/station/domain/events/station-created.event'
import { StationUpdatedEvent } from '@contexts/kitchen-operations/station/domain/events/station-updated.event'
import { PrinterAddressRequired } from '@contexts/kitchen-operations/station/domain/exceptions/printer-address-required.exception'
import { UsbIdentifierRequired } from '@contexts/kitchen-operations/station/domain/exceptions/usb-identifier-required.exception'
import { StationConnectionTypeEnum } from '@contexts/kitchen-operations/station/domain/station-connection-type'
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
      expect(p.printerAddress).toBeNull()
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
      expect(payload.printerAddress).toBeNull()
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

    it('should create a station with PRINTER output device and address', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Receipt',
        displayOrder: 0,
        color: null,
        outputDevice: 'printer',
        printerAddress: '192.168.1.50'
      })
      const p = station.toPrimitives()

      expect(p.outputDevice).toBe('printer')
      expect(p.printerAddress).toBe('192.168.1.50:9100')
    })

    it('should throw PrinterAddressRequired when PRINTER without address', () => {
      expect(() =>
        Station.create({
          id: UuidMother.random(),
          name: 'Receipt',
          displayOrder: 0,
          color: null,
          outputDevice: 'printer'
        })
      ).toThrow(PrinterAddressRequired)
    })

    it('should silently null printerAddress when output device is KDS', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Grill',
        displayOrder: 0,
        color: null,
        outputDevice: 'kds',
        printerAddress: '192.168.1.50:9100'
      })
      const p = station.toPrimitives()

      expect(p.outputDevice).toBe('kds')
      expect(p.printerAddress).toBeNull()
    })

    it('should silently null printerAddress when output device is NONE', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Archive',
        displayOrder: 0,
        color: null,
        outputDevice: 'none',
        printerAddress: '192.168.1.50:9100'
      })
      const p = station.toPrimitives()

      expect(p.outputDevice).toBe('none')
      expect(p.printerAddress).toBeNull()
    })

    it('should default connectionType to NETWORK when omitted', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Grill',
        displayOrder: 0,
        color: null
      })
      const p = station.toPrimitives()

      expect(p.connectionType).toBe(StationConnectionTypeEnum.NETWORK)
    })

    it('should throw PrinterAddressRequired for PRINTER + NETWORK without printerAddress', () => {
      expect(() =>
        Station.create({
          id: UuidMother.random(),
          name: 'Receipt',
          displayOrder: 0,
          color: null,
          outputDevice: 'printer',
          connectionType: 'network'
        })
      ).toThrow(PrinterAddressRequired)
    })

    it('should throw UsbIdentifierRequired for PRINTER + USB without usbIdentifier', () => {
      expect(() =>
        Station.create({
          id: UuidMother.random(),
          name: 'Receipt',
          displayOrder: 0,
          color: null,
          outputDevice: 'printer',
          connectionType: 'usb'
        })
      ).toThrow(UsbIdentifierRequired)
    })

    it('should create PRINTER + USB with a valid identifier and null printerAddress', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Receipt',
        displayOrder: 0,
        color: null,
        outputDevice: 'printer',
        connectionType: 'usb',
        usbIdentifier: 'USB001'
      })
      const p = station.toPrimitives()

      expect(p.outputDevice).toBe('printer')
      expect(p.connectionType).toBe(StationConnectionTypeEnum.USB)
      expect(p.usbIdentifier).toBe('USB001')
      expect(p.printerAddress).toBeNull()
    })

    it('should throw PrinterAddressRequired for PRINTER + NETWORK even when a usbIdentifier is supplied', () => {
      expect(() =>
        Station.create({
          id: UuidMother.random(),
          name: 'Receipt',
          displayOrder: 0,
          color: null,
          outputDevice: 'printer',
          connectionType: 'network',
          usbIdentifier: 'USB001'
        })
      ).toThrow(PrinterAddressRequired)
    })

    it('should silently null both printerAddress and usbIdentifier for KDS with USB connectionType', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Grill',
        displayOrder: 0,
        color: null,
        outputDevice: 'kds',
        connectionType: 'usb',
        usbIdentifier: 'USB001'
      })
      const p = station.toPrimitives()

      expect(p.outputDevice).toBe('kds')
      expect(p.printerAddress).toBeNull()
      expect(p.usbIdentifier).toBeNull()
    })

    it('should silently null both printerAddress and usbIdentifier for NONE with USB connectionType', () => {
      const station = Station.create({
        id: UuidMother.random(),
        name: 'Archive',
        displayOrder: 0,
        color: null,
        outputDevice: 'none',
        connectionType: 'usb',
        usbIdentifier: 'USB001'
      })
      const p = station.toPrimitives()

      expect(p.outputDevice).toBe('none')
      expect(p.printerAddress).toBeNull()
      expect(p.usbIdentifier).toBeNull()
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

    it('should allow switching to PRINTER with address', () => {
      const station = StationMother.grill()
      const updated = station.update({
        name: 'Grill',
        displayOrder: 1,
        isActive: true,
        color: '#FF5733',
        outputDevice: 'printer',
        printerAddress: '10.0.0.5:9100'
      })
      const p = updated.toPrimitives()

      expect(p.outputDevice).toBe('printer')
      expect(p.printerAddress).toBe('10.0.0.5:9100')
    })

    it('should throw PrinterAddressRequired when switching to PRINTER without address', () => {
      const station = StationMother.grill()

      expect(() =>
        station.update({
          name: 'Grill',
          displayOrder: 1,
          isActive: true,
          color: '#FF5733',
          outputDevice: 'printer'
        })
      ).toThrow(PrinterAddressRequired)
    })

    it('should silently null printerAddress when switching from PRINTER to KDS', () => {
      const station = StationMother.withPrinter()
      const updated = station.update({
        name: station.getName(),
        displayOrder: 1,
        isActive: true,
        color: null,
        outputDevice: 'kds',
        printerAddress: '192.168.1.50:9100'
      })
      const p = updated.toPrimitives()

      expect(p.outputDevice).toBe('kds')
      expect(p.printerAddress).toBeNull()
    })

    it('should preserve existing outputDevice when not provided in update', () => {
      const station = StationMother.withPrinter('10.0.0.1:9100')
      const updated = station.update({
        name: station.getName(),
        displayOrder: 1,
        isActive: true,
        color: null,
        printerAddress: '10.0.0.1:9100'
      })
      const p = updated.toPrimitives()

      expect(p.outputDevice).toBe('printer')
      expect(p.printerAddress).toBe('10.0.0.1:9100')
    })

    it('should throw UsbIdentifierRequired when switching connectionType to USB without a usbIdentifier', () => {
      const station = StationMother.withPrinter('10.0.0.1:9100')

      expect(() =>
        station.update({
          name: station.getName(),
          displayOrder: 1,
          isActive: true,
          color: null,
          outputDevice: 'printer',
          connectionType: 'usb',
          printerAddress: '10.0.0.1:9100'
        })
      ).toThrow(UsbIdentifierRequired)
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
  })

  describe('getName()', () => {
    it('should return the station name value', () => {
      const station = StationMother.grill()
      expect(station.getName()).toBe('Grill')
    })
  })
})
