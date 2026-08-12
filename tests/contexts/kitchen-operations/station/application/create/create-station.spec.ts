import { CreateStation } from '@contexts/kitchen-operations/station/application/create/create-station'
import { StationRepository } from '@contexts/kitchen-operations/station/domain/repositories/station.repository'
import { PrinterDeviceLookupPort } from '@contexts/kitchen-operations/station/domain/ports/printer-device-lookup.port'
import { DiscoveredPrinterDeviceNotExist } from '@contexts/kitchen-operations/station/domain/exceptions/discovered-printer-device-not-exist.exception'
import { Station } from '@contexts/kitchen-operations/station/domain/station'
import { StationOutputDeviceEnum } from '@contexts/kitchen-operations/station/domain/station-output-device'
import { EventBus } from '@shared/domain/events'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'
import { Establishment } from '@contexts/establishment/establishment/domain/establishment'
import { EstablishmentMother } from '@test/contexts/establishment/establishment/__mothers__/establishment.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('CreateStation', () => {
  let repository: jest.Mocked<StationRepository>
  let eventBus: jest.Mocked<EventBus>
  let lookupPort: jest.Mocked<PrinterDeviceLookupPort>
  let establishmentRepository: jest.Mocked<EstablishmentRepository>
  let useCase: CreateStation
  let establishment: Establishment

  beforeEach(() => {
    establishment = EstablishmentMother.create()
    repository = {
      save: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      searchByName: jest.fn().mockResolvedValue(null),
      searchAll: jest.fn()
    } as unknown as jest.Mocked<StationRepository>
    eventBus = { publish: jest.fn() } as any
    lookupPort = {
      findById: jest.fn()
    } as unknown as jest.Mocked<PrinterDeviceLookupPort>
    establishmentRepository = {
      findSingleton: jest.fn().mockResolvedValue(establishment),
      save: jest.fn()
    } as unknown as jest.Mocked<EstablishmentRepository>

    useCase = new CreateStation(repository, eventBus, lookupPort, establishmentRepository)
  })

  it('rejects creation with a not-found device id when the lookup port resolves null', async () => {
    lookupPort.findById.mockResolvedValue(null)
    const deviceId = UuidMother.random()

    await expect(
      useCase.run({
        id: UuidMother.random(),
        name: 'Grill',
        displayOrder: 1,
        color: null,
        outputDevice: StationOutputDeviceEnum.PRINTER,
        discoveredPrinterDeviceId: deviceId
      })
    ).rejects.toThrow(DiscoveredPrinterDeviceNotExist)

    expect(lookupPort.findById).toHaveBeenCalledWith(deviceId, establishment.id.value)
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('creates and persists the station when the lookup port resolves the device', async () => {
    const deviceId = UuidMother.random()
    lookupPort.findById.mockResolvedValue({
      connectionType: 'network',
      address: '192.168.1.50',
      usbIdentifier: null,
      model: 'EPSON TM-T20',
      lastSeenAt: new Date()
    })
    const id = UuidMother.random()

    await useCase.run({
      id,
      name: 'Grill',
      displayOrder: 1,
      color: null,
      outputDevice: StationOutputDeviceEnum.PRINTER,
      discoveredPrinterDeviceId: deviceId
    })

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as Station
    expect(saved.toPrimitives().discoveredPrinterDeviceId).toBe(deviceId)
    expect(eventBus.publish).toHaveBeenCalledTimes(1)
  })

  it('rejects a device id belonging to a different establishment (lookup is establishment-scoped, cross-tenant id treated as nonexistent)', async () => {
    // Real regression fixture: the device genuinely exists, but only for a
    // DIFFERENT establishment than the one CreateStation resolves via
    // EstablishmentRepository.findSingleton(). The port contract is that
    // establishment-scoped lookups return null for cross-tenant ids — so a
    // correct implementation must call findById with the CALLER's
    // establishmentId, not just any establishmentId, and the mock proves
    // that by only resolving for the caller's own establishment id.
    const crossTenantDeviceId = UuidMother.random()
    lookupPort.findById.mockImplementation((id, establishmentId) => {
      if (id === crossTenantDeviceId && establishmentId === establishment.id.value) {
        // Simulates the real repository behavior: device exists, but not
        // scoped to this establishment, so it is not found.
        return Promise.resolve(null)
      }
      throw new Error('unexpected lookup call in this test')
    })

    await expect(
      useCase.run({
        id: UuidMother.random(),
        name: 'Grill',
        displayOrder: 1,
        color: null,
        outputDevice: StationOutputDeviceEnum.PRINTER,
        discoveredPrinterDeviceId: crossTenantDeviceId
      })
    ).rejects.toThrow(DiscoveredPrinterDeviceNotExist)

    expect(lookupPort.findById).toHaveBeenCalledWith(crossTenantDeviceId, establishment.id.value)
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('does not call the lookup port for a non-printer output device with no device id', async () => {
    await useCase.run({
      id: UuidMother.random(),
      name: 'Cold Station',
      displayOrder: 2,
      color: null,
      outputDevice: StationOutputDeviceEnum.KDS
    })

    expect(lookupPort.findById).not.toHaveBeenCalled()
    expect(repository.save).toHaveBeenCalledTimes(1)
  })
})
