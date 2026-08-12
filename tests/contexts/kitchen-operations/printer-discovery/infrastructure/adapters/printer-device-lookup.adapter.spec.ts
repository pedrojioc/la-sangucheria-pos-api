import { PrinterDeviceLookupAdapter } from '@contexts/kitchen-operations/printer-discovery/infrastructure/adapters/printer-device-lookup.adapter'
import { DiscoveredPrinterDeviceRepository } from '@contexts/kitchen-operations/printer-discovery/domain/repositories/discovered-printer-device.repository'
import { DiscoveredPrinterDevice } from '@contexts/kitchen-operations/printer-discovery/domain/discovered-printer-device'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'
import { Uuid } from '@shared/domain/value-objects/uuid'

describe('PrinterDeviceLookupAdapter', () => {
  let repository: jest.Mocked<DiscoveredPrinterDeviceRepository>
  let adapter: PrinterDeviceLookupAdapter

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEstablishmentAndIdentity: jest.fn(),
      searchAllByEstablishment: jest.fn()
    } as unknown as jest.Mocked<DiscoveredPrinterDeviceRepository>
    adapter = new PrinterDeviceLookupAdapter(repository)
  })

  it('maps a found DiscoveredPrinterDevice to a PrinterDeviceLookupResult DTO, without leaking the aggregate', async () => {
    const lastSeenAt = new Date('2026-08-09T20:00:00Z')
    const device = DiscoveredPrinterDevice.create(
      {
        id: Uuid.random().value,
        establishmentId: EstablishmentId.random().value,
        connectionType: 'usb',
        address: null,
        usbIdentifier: 'USB001',
        model: 'TM-T88'
      },
      lastSeenAt
    )
    repository.findById.mockResolvedValue(device)

    const result = await adapter.findById(device.id.value)

    expect(repository.findById).toHaveBeenCalledWith(device.id.value)
    expect(result).toEqual({
      connectionType: 'usb',
      address: null,
      usbIdentifier: 'USB001',
      model: 'TM-T88',
      lastSeenAt
    })
    expect(result).not.toBeInstanceOf(DiscoveredPrinterDevice)
  })

  it('returns null when the repository finds no matching device', async () => {
    repository.findById.mockResolvedValue(null)

    const result = await adapter.findById(Uuid.random().value)

    expect(result).toBeNull()
  })
})
