import { FindDiscoveredDevices } from '@contexts/kitchen-operations/printer-discovery/application/find-all/find-discovered-devices'
import { DiscoveredPrinterDeviceRepository } from '@contexts/kitchen-operations/printer-discovery/domain/repositories/discovered-printer-device.repository'
import { DiscoveredPrinterDevice } from '@contexts/kitchen-operations/printer-discovery/domain/discovered-printer-device'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'
import { Uuid } from '@shared/domain/value-objects/uuid'

describe('FindDiscoveredDevices', () => {
  let repository: jest.Mocked<DiscoveredPrinterDeviceRepository>
  let useCase: FindDiscoveredDevices
  const establishmentId = EstablishmentId.random()
  const now = new Date('2026-07-28T10:00:00Z')

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findByEstablishmentAndIdentity: jest.fn(),
      searchAllByEstablishment: jest.fn()
    } as unknown as jest.Mocked<DiscoveredPrinterDeviceRepository>
    useCase = new FindDiscoveredDevices(repository)
  })

  it('returns stale=false for a fresh device (lastSeenAt within the TTL)', async () => {
    const fresh = DiscoveredPrinterDevice.create(
      {
        id: Uuid.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.50',
        usbIdentifier: null
      },
      new Date(now.getTime() - 5 * 60 * 1000) // 5 min ago, within 15-min TTL
    )
    repository.searchAllByEstablishment.mockResolvedValue([fresh])

    const result = await useCase.run(establishmentId.value, now)

    expect(result).toHaveLength(1)
    expect(result[0].stale).toBe(false)
  })

  it('returns stale=true for a device whose lastSeenAt is older than the TTL, still included', async () => {
    const stale = DiscoveredPrinterDevice.create(
      {
        id: Uuid.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.51',
        usbIdentifier: null
      },
      new Date(now.getTime() - 20 * 60 * 1000) // 20 min ago, older than 15-min TTL
    )
    repository.searchAllByEstablishment.mockResolvedValue([stale])

    const result = await useCase.run(establishmentId.value, now)

    expect(result).toHaveLength(1)
    expect(result[0].stale).toBe(true)
  })

  it('includes status and statusUpdatedAt sourced directly from stored primitives', async () => {
    const statusUpdatedAt = new Date(now.getTime() - 2 * 60 * 1000)
    const device = DiscoveredPrinterDevice.create(
      {
        id: Uuid.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.52',
        usbIdentifier: null
      },
      new Date(now.getTime() - 1 * 60 * 1000) // 1 min ago, within TTL
    )
    device.reportStatus('online', statusUpdatedAt)
    repository.searchAllByEstablishment.mockResolvedValue([device])

    const result = await useCase.run(establishmentId.value, now)

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('online')
    expect(result[0].statusUpdatedAt).toEqual(statusUpdatedAt)
  })

  it('status is independent of stale — a stale device can still report a recent status', async () => {
    const statusUpdatedAt = new Date(now.getTime() - 1 * 60 * 1000)
    const device = DiscoveredPrinterDevice.create(
      {
        id: Uuid.random().value,
        establishmentId: establishmentId.value,
        connectionType: 'network',
        address: '192.168.1.53',
        usbIdentifier: null
      },
      new Date(now.getTime() - 20 * 60 * 1000) // stale by lastSeenAt
    )
    device.reportStatus('online', statusUpdatedAt) // but status recently pinged
    repository.searchAllByEstablishment.mockResolvedValue([device])

    const result = await useCase.run(establishmentId.value, now)

    expect(result).toHaveLength(1)
    expect(result[0].stale).toBe(true)
    expect(result[0].status).toBe('online')
  })
})
