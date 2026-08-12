import { StationController } from '@contexts/kitchen-operations/station/presentation/http/controllers/station.controller'
import { CreateStation } from '@contexts/kitchen-operations/station/application/create/create-station'
import { UpdateStation } from '@contexts/kitchen-operations/station/application/update/update-station'
import { FindStation } from '@contexts/kitchen-operations/station/application/find/find-station'
import { FindAllStations } from '@contexts/kitchen-operations/station/application/find-all/find-all-stations'
import { DeleteStation } from '@contexts/kitchen-operations/station/application/delete/delete-station'
import { CreateStationRequest } from '@contexts/kitchen-operations/station/presentation/http/dto/create-station.request'
import { UpdateStationRequest } from '@contexts/kitchen-operations/station/presentation/http/dto/update-station.request'
import { StationOutputDeviceEnum } from '@contexts/kitchen-operations/station/domain/station-output-device'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('StationController', () => {
  let controller: StationController
  let createStation: jest.Mocked<CreateStation>
  let updateStation: jest.Mocked<UpdateStation>
  let findStation: jest.Mocked<FindStation>
  let findAllStations: jest.Mocked<FindAllStations>
  let deleteStation: jest.Mocked<DeleteStation>

  beforeEach(() => {
    createStation = { run: jest.fn() } as unknown as jest.Mocked<CreateStation>
    updateStation = { run: jest.fn() } as unknown as jest.Mocked<UpdateStation>
    findStation = { run: jest.fn() } as unknown as jest.Mocked<FindStation>
    findAllStations = { run: jest.fn() } as unknown as jest.Mocked<FindAllStations>
    deleteStation = { run: jest.fn() } as unknown as jest.Mocked<DeleteStation>

    controller = new StationController(
      createStation,
      updateStation,
      findStation,
      findAllStations,
      deleteStation
    )
  })

  describe('create', () => {
    it('passes discoveredPrinterDeviceId straight through to CreateStation', async () => {
      const deviceId = UuidMother.random()
      const dto: CreateStationRequest = {
        id: UuidMother.random(),
        name: 'Grill',
        displayOrder: 1,
        outputDevice: StationOutputDeviceEnum.PRINTER,
        discoveredPrinterDeviceId: deviceId
      } as CreateStationRequest

      await controller.create(dto)

      expect(createStation.run).toHaveBeenCalledWith(
        expect.objectContaining({ discoveredPrinterDeviceId: deviceId })
      )
    })

    it('passes null when discoveredPrinterDeviceId is omitted', async () => {
      const dto: CreateStationRequest = {
        id: UuidMother.random(),
        name: 'Cold Station',
        displayOrder: 2
      } as CreateStationRequest

      await controller.create(dto)

      expect(createStation.run).toHaveBeenCalledWith(
        expect.objectContaining({ discoveredPrinterDeviceId: null })
      )
    })

    it('no longer passes printerAddress/connectionType/usbIdentifier to CreateStation', async () => {
      const dto: CreateStationRequest = {
        id: UuidMother.random(),
        name: 'Grill',
        displayOrder: 1
      } as CreateStationRequest

      await controller.create(dto)

      const passedParams = createStation.run.mock.calls[0][0] as unknown as Record<string, unknown>
      expect('printerAddress' in passedParams).toBe(false)
      expect('connectionType' in passedParams).toBe(false)
      expect('usbIdentifier' in passedParams).toBe(false)
    })
  })

  describe('update', () => {
    it('passes discoveredPrinterDeviceId straight through to UpdateStation', async () => {
      const stationId = UuidMother.random()
      const deviceId = UuidMother.random()
      const dto: UpdateStationRequest = {
        name: 'Grill',
        displayOrder: 1,
        isActive: true,
        outputDevice: StationOutputDeviceEnum.PRINTER,
        discoveredPrinterDeviceId: deviceId
      } as UpdateStationRequest

      await controller.update(stationId, dto)

      expect(updateStation.run).toHaveBeenCalledWith(
        stationId,
        expect.objectContaining({ discoveredPrinterDeviceId: deviceId })
      )
    })
  })
})
