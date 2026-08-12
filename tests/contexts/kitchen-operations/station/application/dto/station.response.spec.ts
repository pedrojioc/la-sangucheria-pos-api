import { StationResponse } from '@contexts/kitchen-operations/station/application/dto/station.response'
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
})
