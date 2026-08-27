import { StationResponse } from '@contexts/kitchen-operations/station/application/dto/station.response'
import { StationWithPrinterDevice } from '@contexts/kitchen-operations/station/domain/station-with-printer-device'
import { StationMother } from '../../__mothers__/station.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('StationResponse', () => {
  it('exposes discoveredPrinterDeviceId instead of printerAddress/connectionType/usbIdentifier', () => {
    const deviceId = UuidMother.random()
    const station = StationMother.withPrinter(deviceId)

    const response = StationResponse.fromAggregate(station)

    expect(response.discoveredPrinterDeviceId).toBe(deviceId)
    expect('printerAddress' in response).toBe(false)
    expect('connectionType' in response).toBe(false)
    expect('usbIdentifier' in response).toBe(false)
  })

  it('exposes discoveredPrinterDeviceId as null for a non-printer station', () => {
    const station = StationMother.withNoOutput()

    const response = StationResponse.fromAggregate(station)

    expect(response.discoveredPrinterDeviceId).toBeNull()
  })

  describe('fromAggregateWithPrinterDevice', () => {
    it('exposes the joined printer summary when the station has a printer device', () => {
      const deviceId = UuidMother.random()
      const station = StationMother.withPrinter(deviceId)
      const printer = { model: 'Epson TM-T20', status: 'online', address: '192.168.1.50' }

      const response = StationResponse.fromAggregateWithPrinterDevice(
        new StationWithPrinterDevice(station, printer)
      )

      expect(response.printer).toEqual(printer)
      expect(response.discoveredPrinterDeviceId).toBe(deviceId)
    })

    it('exposes a null printer when the station has no printer device', () => {
      const station = StationMother.withNoOutput()

      const response = StationResponse.fromAggregateWithPrinterDevice(
        new StationWithPrinterDevice(station, null)
      )

      expect(response.printer).toBeNull()
    })
  })
})
