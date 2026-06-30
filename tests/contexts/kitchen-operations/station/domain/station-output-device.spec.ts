import {
  StationOutputDevice,
  StationOutputDeviceEnum
} from '@contexts/kitchen-operations/station/domain/station-output-device'
import { InvalidStationOutputDevice } from '@contexts/kitchen-operations/station/domain/exceptions/invalid-station-output-device.exception'

describe('StationOutputDevice (VO)', () => {
  it.each([
    StationOutputDeviceEnum.KDS,
    StationOutputDeviceEnum.PRINTER,
    StationOutputDeviceEnum.NONE
  ])('should accept valid value "%s"', value => {
    const vo = new StationOutputDevice(value)
    expect(vo.value).toBe(value)
  })

  it('should throw InvalidStationOutputDevice for invalid value', () => {
    expect(() => new StationOutputDevice('monitor' as StationOutputDeviceEnum)).toThrow(
      InvalidStationOutputDevice
    )
  })

  it('should report isPrinter() correctly', () => {
    expect(new StationOutputDevice(StationOutputDeviceEnum.PRINTER).isPrinter()).toBe(true)
    expect(new StationOutputDevice(StationOutputDeviceEnum.KDS).isPrinter()).toBe(false)
  })

  it('should report isKds() correctly', () => {
    expect(new StationOutputDevice(StationOutputDeviceEnum.KDS).isKds()).toBe(true)
    expect(new StationOutputDevice(StationOutputDeviceEnum.PRINTER).isKds()).toBe(false)
  })

  it('should report isNone() correctly', () => {
    expect(new StationOutputDevice(StationOutputDeviceEnum.NONE).isNone()).toBe(true)
    expect(new StationOutputDevice(StationOutputDeviceEnum.KDS).isNone()).toBe(false)
  })
})
