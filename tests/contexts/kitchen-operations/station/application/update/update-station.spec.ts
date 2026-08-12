import { UpdateStation } from '@contexts/kitchen-operations/station/application/update/update-station'
import { StationRepository } from '@contexts/kitchen-operations/station/domain/repositories/station.repository'
import { FindStation } from '@contexts/kitchen-operations/station/application/find/find-station'
import { PrinterDeviceLookupPort } from '@contexts/kitchen-operations/station/domain/ports/printer-device-lookup.port'
import { DiscoveredPrinterDeviceNotExist } from '@contexts/kitchen-operations/station/domain/exceptions/discovered-printer-device-not-exist.exception'
import { Station } from '@contexts/kitchen-operations/station/domain/station'
import { StationOutputDeviceEnum } from '@contexts/kitchen-operations/station/domain/station-output-device'
import { StationMother } from '../../__mothers__/station.mother'
import { EventBus } from '@shared/domain/events'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'
import { Establishment } from '@contexts/establishment/establishment/domain/establishment'
import { EstablishmentMother } from '@test/contexts/establishment/establishment/__mothers__/establishment.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('UpdateStation', () => {
  let repository: jest.Mocked<StationRepository>
  let eventBus: jest.Mocked<EventBus>
  let findStation: FindStation
  let lookupPort: jest.Mocked<PrinterDeviceLookupPort>
  let establishmentRepository: jest.Mocked<EstablishmentRepository>
  let useCase: UpdateStation
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
    findStation = new FindStation(repository)
    lookupPort = {
      findById: jest.fn()
    } as unknown as jest.Mocked<PrinterDeviceLookupPort>
    establishmentRepository = {
      findSingleton: jest.fn().mockResolvedValue(establishment),
      save: jest.fn()
    } as unknown as jest.Mocked<EstablishmentRepository>

    useCase = new UpdateStation(
      repository,
      eventBus,
      findStation,
      lookupPort,
      establishmentRepository
    )
  })

  it('rejects reassignment to an unknown device id, stored id unchanged', async () => {
    const existingDeviceId = UuidMother.random()
    const existing = StationMother.withPrinter(existingDeviceId)
    repository.search.mockResolvedValue(existing)
    lookupPort.findById.mockResolvedValue(null)
    const unknownDeviceId = UuidMother.random()

    await expect(
      useCase.run(existing.id.value, {
        name: existing.getName(),
        displayOrder: 1,
        isActive: true,
        color: null,
        outputDevice: StationOutputDeviceEnum.PRINTER,
        discoveredPrinterDeviceId: unknownDeviceId
      })
    ).rejects.toThrow(DiscoveredPrinterDeviceNotExist)

    expect(lookupPort.findById).toHaveBeenCalledWith(unknownDeviceId, establishment.id.value)
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('updates the station when reassigned to a known device id', async () => {
    const existing = StationMother.withPrinter(UuidMother.random())
    repository.search.mockResolvedValue(existing)
    const newDeviceId = UuidMother.random()
    lookupPort.findById.mockResolvedValue({
      connectionType: 'usb',
      address: null,
      usbIdentifier: 'USB002',
      model: null,
      lastSeenAt: new Date()
    })

    await useCase.run(existing.id.value, {
      name: existing.getName(),
      displayOrder: 1,
      isActive: true,
      color: null,
      outputDevice: StationOutputDeviceEnum.PRINTER,
      discoveredPrinterDeviceId: newDeviceId
    })

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as Station
    expect(saved.toPrimitives().discoveredPrinterDeviceId).toBe(newDeviceId)
  })

  it('rejects a device id belonging to a different establishment (lookup is establishment-scoped, cross-tenant id treated as nonexistent)', async () => {
    // Real regression fixture: the device genuinely exists, but only for a
    // DIFFERENT establishment than the one UpdateStation resolves via
    // EstablishmentRepository.findSingleton(). A correct implementation
    // must call findById with the CALLER's establishmentId, and the mock
    // only resolves for that establishment id — proving establishment
    // scoping, not just "any not-found id gets rejected".
    const existing = StationMother.withPrinter(UuidMother.random())
    repository.search.mockResolvedValue(existing)
    const crossTenantDeviceId = UuidMother.random()
    lookupPort.findById.mockImplementation((id, establishmentId) => {
      if (id === crossTenantDeviceId && establishmentId === establishment.id.value) {
        return Promise.resolve(null)
      }
      throw new Error('unexpected lookup call in this test')
    })

    await expect(
      useCase.run(existing.id.value, {
        name: existing.getName(),
        displayOrder: 1,
        isActive: true,
        color: null,
        outputDevice: StationOutputDeviceEnum.PRINTER,
        discoveredPrinterDeviceId: crossTenantDeviceId
      })
    ).rejects.toThrow(DiscoveredPrinterDeviceNotExist)

    expect(lookupPort.findById).toHaveBeenCalledWith(crossTenantDeviceId, establishment.id.value)
    expect(repository.save).not.toHaveBeenCalled()
  })
})
