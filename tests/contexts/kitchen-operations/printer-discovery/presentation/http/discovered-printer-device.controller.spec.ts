import { DiscoveredPrinterDeviceController } from '@contexts/kitchen-operations/printer-discovery/presentation/http/discovered-printer-device.controller'
import { FindDiscoveredDevices } from '@contexts/kitchen-operations/printer-discovery/application/find-all/find-discovered-devices'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'
import { EstablishmentMother } from '@test/contexts/establishment/establishment/__mothers__/establishment.mother'

describe('DiscoveredPrinterDeviceController', () => {
  it('resolves the singleton establishment and returns the discovered devices for it', async () => {
    const establishment = EstablishmentMother.create()
    const establishmentRepository = {
      findSingleton: jest.fn().mockResolvedValue(establishment),
      save: jest.fn()
    } as unknown as jest.Mocked<EstablishmentRepository>
    const findDiscoveredDevices = {
      run: jest.fn().mockResolvedValue([
        {
          id: 'device-1',
          connectionType: 'network',
          address: '192.168.1.50',
          usbIdentifier: null,
          lastSeenAt: new Date(),
          stale: false
        }
      ])
    } as unknown as jest.Mocked<FindDiscoveredDevices>
    const controller = new DiscoveredPrinterDeviceController(
      findDiscoveredDevices,
      establishmentRepository
    )

    const result = await controller.findAll()

    expect(findDiscoveredDevices.run).toHaveBeenCalledWith(establishment.id.value)
    expect(result).toHaveLength(1)
    expect(result[0].stale).toBe(false)
  })
})
