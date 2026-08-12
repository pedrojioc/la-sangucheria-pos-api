import { UpdateStation } from '@contexts/kitchen-operations/station/application/update/update-station'
import { StationRepository } from '@contexts/kitchen-operations/station/domain/repositories/station.repository'
import { FindStation } from '@contexts/kitchen-operations/station/application/find/find-station'
import { PrinterDeviceLookupPort } from '@contexts/kitchen-operations/station/domain/ports/printer-device-lookup.port'
import { DiscoveredPrinterDeviceNotExist } from '@contexts/kitchen-operations/station/domain/exceptions/discovered-printer-device-not-exist.exception'
import { Station } from '@contexts/kitchen-operations/station/domain/station'
import { StationOutputDeviceEnum } from '@contexts/kitchen-operations/station/domain/station-output-device'
import { StationMother } from '../../__mothers__/station.mother'
import { EventBus } from '@shared/domain/events'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('UpdateStation', () => {
  let repository: jest.Mocked<StationRepository>
  let eventBus: jest.Mocked<EventBus>
  let findStation: FindStation
  let lookupPort: jest.Mocked<PrinterDeviceLookupPort>
  let useCase: UpdateStation

  beforeEach(() => {
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

    useCase = new UpdateStation(repository, eventBus, findStation, lookupPort)
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

    expect(lookupPort.findById).toHaveBeenCalledWith(unknownDeviceId)
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

  it('rejects a device id belonging to a different establishment (lookup port scopes and returns null)', async () => {
    const existing = StationMother.withPrinter(UuidMother.random())
    repository.search.mockResolvedValue(existing)
    lookupPort.findById.mockResolvedValue(null)
    const crossTenantDeviceId = UuidMother.random()

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
    expect(repository.save).not.toHaveBeenCalled()
  })
})
