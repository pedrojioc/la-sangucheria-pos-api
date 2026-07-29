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
    expect(primitives.lastSeenAt).toEqual(now)
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

    device.touch(later)

    expect(device.toPrimitives().lastSeenAt).toEqual(later)
  })
})
