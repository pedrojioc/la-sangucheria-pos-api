import { RecordDiscoveredDevice } from '@contexts/kitchen-operations/printer-discovery/application/record/record-discovered-device'
import { DiscoveredPrinterDeviceRepository } from '@contexts/kitchen-operations/printer-discovery/domain/repositories/discovered-printer-device.repository'
import { DiscoveredPrinterDevice } from '@contexts/kitchen-operations/printer-discovery/domain/discovered-printer-device'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'
import { Uuid } from '@shared/domain/value-objects/uuid'

describe('RecordDiscoveredDevice', () => {
  let repository: jest.Mocked<DiscoveredPrinterDeviceRepository>
  let useCase: RecordDiscoveredDevice
  const establishmentId1 = EstablishmentId.random()
  const establishmentId2 = EstablishmentId.random()

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findByEstablishmentAndIdentity: jest.fn(),
      searchAllByEstablishment: jest.fn()
    } as unknown as jest.Mocked<DiscoveredPrinterDeviceRepository>
    useCase = new RecordDiscoveredDevice(repository)
  })

  it('creates a new record on first report (NETWORK)', async () => {
    repository.findByEstablishmentAndIdentity.mockResolvedValue(null)

    await useCase.run({
      establishmentId: establishmentId1.value,
      connectionType: 'network',
      address: '192.168.1.50',
      usbIdentifier: undefined,
      model: 'EPSON TM-T20'
    })

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as DiscoveredPrinterDevice
    expect(saved.getEstablishmentId()).toBe(establishmentId1.value)
    expect(saved.getConnectionType()).toBe('network')
    expect(saved.getAddress()).toBe('192.168.1.50')
    expect(saved.getModel()).toBe('EPSON TM-T20')
  })

  it('creates a new record on first report (USB)', async () => {
    repository.findByEstablishmentAndIdentity.mockResolvedValue(null)

    await useCase.run({
      establishmentId: establishmentId1.value,
      connectionType: 'usb',
      address: undefined,
      usbIdentifier: 'USB001'
    })

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as DiscoveredPrinterDevice
    expect(saved.getConnectionType()).toBe('usb')
    expect(saved.getUsbIdentifier()).toBe('USB001')
  })

  it('re-reporting the same establishment+identity upserts lastSeenAt only, no duplicate', async () => {
    const existingId = Uuid.random().value
    const existing = DiscoveredPrinterDevice.create(
      {
        id: existingId,
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
      usbIdentifier: undefined
    })

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as DiscoveredPrinterDevice
    expect(saved.id.value).toBe(existingId)
  })

  it('re-reporting with a model updates the model on the existing record', async () => {
    const existingId = Uuid.random().value
    const existing = DiscoveredPrinterDevice.create(
      {
        id: existingId,
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
      usbIdentifier: undefined,
      model: 'EPSON TM-T20'
    })

    const saved = repository.save.mock.calls[0][0] as DiscoveredPrinterDevice
    expect(saved.getModel()).toBe('EPSON TM-T20')
  })

  it('the same address under a different establishment creates a distinct record', async () => {
    repository.findByEstablishmentAndIdentity.mockResolvedValue(null)

    await useCase.run({
      establishmentId: establishmentId2.value,
      connectionType: 'network',
      address: '192.168.1.50',
      usbIdentifier: undefined
    })

    expect(repository.findByEstablishmentAndIdentity).toHaveBeenCalledWith(
      establishmentId2.value,
      'network',
      '192.168.1.50'
    )
    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as DiscoveredPrinterDevice
    expect(saved.getEstablishmentId()).toBe(establishmentId2.value)
  })
})
