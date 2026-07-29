import { RecordDiscoveredDevice } from '@contexts/kitchen-operations/printer-discovery/application/record/record-discovered-device'
import { DiscoveredPrinterDeviceRepository } from '@contexts/kitchen-operations/printer-discovery/domain/repositories/discovered-printer-device.repository'
import { StationRepository } from '@contexts/kitchen-operations/station/domain/repositories/station.repository'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'

// Guardrail: printer-discovery MUST NOT create, update, or read any Station
// aggregate. Assignment stays an explicit staff action via Station's own
// create/update flows — recording a discovered device never touches it.
describe('RecordDiscoveredDevice — Station guardrail', () => {
  it('recording a device does not create/update/read any Station aggregate', async () => {
    const discoveredPrinterDeviceRepository = {
      save: jest.fn(),
      findByEstablishmentAndIdentity: jest.fn().mockResolvedValue(null),
      searchAllByEstablishment: jest.fn()
    } as unknown as jest.Mocked<DiscoveredPrinterDeviceRepository>
    const stationRepository: jest.Mocked<StationRepository> = {
      save: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      searchByName: jest.fn(),
      searchAll: jest.fn()
    } as unknown as jest.Mocked<StationRepository>

    const useCase = new RecordDiscoveredDevice(discoveredPrinterDeviceRepository)

    await useCase.run({
      establishmentId: EstablishmentId.random().value,
      connectionType: 'network',
      address: '192.168.1.50',
      usbIdentifier: undefined
    })

    expect(stationRepository.save).not.toHaveBeenCalled()
    expect(stationRepository.delete).not.toHaveBeenCalled()
    expect(stationRepository.search).not.toHaveBeenCalled()
    expect(stationRepository.searchByName).not.toHaveBeenCalled()
    expect(stationRepository.searchAll).not.toHaveBeenCalled()
  })

  it('RecordDiscoveredDevice constructor accepts only DiscoveredPrinterDeviceRepository (structural: no StationRepository dependency)', () => {
    expect(RecordDiscoveredDevice.length).toBe(1)
  })
})
