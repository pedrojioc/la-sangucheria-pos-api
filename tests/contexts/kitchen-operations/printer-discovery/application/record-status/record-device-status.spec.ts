import { RecordDeviceStatus } from '@contexts/kitchen-operations/printer-discovery/application/record-status/record-device-status'
import { DiscoveredPrinterDeviceRepository } from '@contexts/kitchen-operations/printer-discovery/domain/repositories/discovered-printer-device.repository'
import { DiscoveredPrinterDevice } from '@contexts/kitchen-operations/printer-discovery/domain/discovered-printer-device'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'
import { Uuid } from '@shared/domain/value-objects/uuid'

describe('RecordDeviceStatus', () => {
  let repository: jest.Mocked<DiscoveredPrinterDeviceRepository>
  let useCase: RecordDeviceStatus
  const establishmentId1 = EstablishmentId.random()

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findByEstablishmentAndIdentity: jest.fn(),
      searchAllByEstablishment: jest.fn()
    } as unknown as jest.Mocked<DiscoveredPrinterDeviceRepository>
    useCase = new RecordDeviceStatus(repository)
  })

  it('updates status on the matching NETWORK device', async () => {
    const existing = DiscoveredPrinterDevice.create(
      {
        id: Uuid.random().value,
        establishmentId: establishmentId1.value,
        connectionType: 'network',
        address: '192.168.1.50',
        usbIdentifier: null
      },
      new Date('2026-07-28T09:00:00Z')
    )
    repository.findByEstablishmentAndIdentity.mockResolvedValue(existing)

    await useCase.run({
      establishmentId: establishmentId1.value,
      connectionType: 'network',
      address: '192.168.1.50',
      status: 'offline'
    })

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as DiscoveredPrinterDevice
    const primitives = saved.toPrimitives()
    expect(primitives.status).toBe('offline')
    expect(primitives.statusUpdatedAt).not.toBeNull()
  })

  it('updates status on the matching USB device, resolving identity via usbIdentifier not address', async () => {
    const existing = DiscoveredPrinterDevice.create(
      {
        id: Uuid.random().value,
        establishmentId: establishmentId1.value,
        connectionType: 'usb',
        address: null,
        usbIdentifier: 'LP-1'
      },
      new Date('2026-07-28T09:00:00Z')
    )
    repository.findByEstablishmentAndIdentity.mockResolvedValue(existing)

    await useCase.run({
      establishmentId: establishmentId1.value,
      connectionType: 'usb',
      usbIdentifier: 'LP-1',
      status: 'online'
    })

    expect(repository.findByEstablishmentAndIdentity).toHaveBeenCalledWith(
      establishmentId1.value,
      'usb',
      'LP-1'
    )
    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as DiscoveredPrinterDevice
    expect(saved.toPrimitives().status).toBe('online')
  })

  it('is a no-op (never creates) when no matching device is found', async () => {
    repository.findByEstablishmentAndIdentity.mockResolvedValue(null)

    await useCase.run({
      establishmentId: establishmentId1.value,
      connectionType: 'network',
      address: '10.0.0.9',
      status: 'offline'
    })

    expect(repository.save).toHaveBeenCalledTimes(0)
  })

  it('scopes the lookup by the establishmentId passed to run()', async () => {
    repository.findByEstablishmentAndIdentity.mockResolvedValue(null)

    await useCase.run({
      establishmentId: establishmentId1.value,
      connectionType: 'network',
      address: '192.168.1.50',
      status: 'online'
    })

    expect(repository.findByEstablishmentAndIdentity).toHaveBeenCalledWith(
      establishmentId1.value,
      'network',
      '192.168.1.50'
    )
  })
})
