import { DiscoveredPrinterDevice } from '@contexts/kitchen-operations/printer-discovery/domain/discovered-printer-device'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'
import { DiscoveredPrinterDeviceId } from '@contexts/kitchen-operations/printer-discovery/domain/discovered-printer-device-id'

describe('DiscoveredPrinterDevice', () => {
  const establishmentId = EstablishmentId.random()
  const now = new Date('2026-07-28T10:00:00Z')

  it('creates a NETWORK device with an address, scoped to the establishment, lastSeenAt stamped at ingestion', () => {
    const device = DiscoveredPrinterDevice.create(
      {
        id: DiscoveredPrinterDeviceId.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.50',
        usbIdentifier: null
      },
      now
    )

    const primitives = device.toPrimitives()
    expect(primitives.establishmentId).toBe(establishmentId.value)
    expect(primitives.connectionType).toBe('network')
    expect(primitives.address).toBe('192.168.1.50')
    expect(primitives.usbIdentifier).toBeNull()
    expect(primitives.model).toBeNull()
    expect(primitives.lastSeenAt).toEqual(now)
  })

  it('creates a USB device with a usbIdentifier, scoped to the establishment, lastSeenAt stamped at ingestion', () => {
    const device = DiscoveredPrinterDevice.create(
      {
        id: DiscoveredPrinterDeviceId.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'usb',
        address: null,
        usbIdentifier: 'USB001'
      },
      now
    )

    const primitives = device.toPrimitives()
    expect(primitives.establishmentId).toBe(establishmentId.value)
    expect(primitives.connectionType).toBe('usb')
    expect(primitives.address).toBeNull()
    expect(primitives.usbIdentifier).toBe('USB001')
    expect(primitives.model).toBeNull()
    expect(primitives.lastSeenAt).toEqual(now)
  })

  it('creates a device with a model when the agent reports it', () => {
    const device = DiscoveredPrinterDevice.create(
      {
        id: DiscoveredPrinterDeviceId.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'usb',
        address: null,
        usbIdentifier: 'USB001',
        model: 'EPSON TM-T20'
      },
      now
    )

    expect(device.getModel()).toBe('EPSON TM-T20')
  })

  it('updates lastSeenAt on touch()', () => {
    const device = DiscoveredPrinterDevice.create(
      {
        id: DiscoveredPrinterDeviceId.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.50',
        usbIdentifier: null
      },
      now
    )
    const later = new Date('2026-07-28T10:20:00Z')

    device.touch(undefined, later)

    expect(device.toPrimitives().lastSeenAt).toEqual(later)
  })

  it('updates model on touch() when the agent reports a new model', () => {
    const device = DiscoveredPrinterDevice.create(
      {
        id: DiscoveredPrinterDeviceId.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.50',
        usbIdentifier: null
      },
      now
    )

    device.touch('EPSON TM-T20', new Date('2026-07-28T10:20:00Z'))

    expect(device.getModel()).toBe('EPSON TM-T20')
  })

  it('leaves model unchanged on touch() when the agent omits it', () => {
    const device = DiscoveredPrinterDevice.create(
      {
        id: DiscoveredPrinterDeviceId.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.50',
        usbIdentifier: null,
        model: 'EPSON TM-T20'
      },
      now
    )

    device.touch(undefined, new Date('2026-07-28T10:20:00Z'))

    expect(device.getModel()).toBe('EPSON TM-T20')
  })

  it('defaults status to unknown and statusUpdatedAt to null when not supplied on create()', () => {
    const device = DiscoveredPrinterDevice.create(
      {
        id: DiscoveredPrinterDeviceId.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.50',
        usbIdentifier: null
      },
      now
    )

    const primitives = device.toPrimitives()
    expect(primitives.status).toBe('unknown')
    expect(primitives.statusUpdatedAt).toBeNull()
  })

  it('reportStatus() updates status and statusUpdatedAt together (atomically)', () => {
    const device = DiscoveredPrinterDevice.create(
      {
        id: DiscoveredPrinterDeviceId.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.50',
        usbIdentifier: null
      },
      now
    )
    const statusUpdatedAt = new Date('2026-07-28T10:30:00Z')

    device.reportStatus('offline', statusUpdatedAt)

    const primitives = device.toPrimitives()
    expect(primitives.status).toBe('offline')
    expect(primitives.statusUpdatedAt).toEqual(statusUpdatedAt)
  })

  it('touch() does NOT change status or statusUpdatedAt (independent signals)', () => {
    const device = DiscoveredPrinterDevice.create(
      {
        id: DiscoveredPrinterDeviceId.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.50',
        usbIdentifier: null
      },
      now
    )
    const statusUpdatedAt = new Date('2026-07-28T10:30:00Z')
    device.reportStatus('online', statusUpdatedAt)

    device.touch('EPSON TM-T20', new Date('2026-07-28T10:40:00Z'))

    const primitives = device.toPrimitives()
    expect(primitives.status).toBe('online')
    expect(primitives.statusUpdatedAt).toEqual(statusUpdatedAt)
  })
})
