import {
  StationConnectionType,
  StationConnectionTypeEnum
} from '@contexts/kitchen-operations/station/domain/station-connection-type'
import { InvalidStationConnectionType } from '@contexts/kitchen-operations/station/domain/exceptions/invalid-station-connection-type.exception'

describe('StationConnectionType (VO)', () => {
  it.each([StationConnectionTypeEnum.NETWORK, StationConnectionTypeEnum.USB])(
    'should accept valid value "%s"',
    value => {
      const vo = new StationConnectionType(value)
      expect(vo.value).toBe(value)
    }
  )

  it('should throw InvalidStationConnectionType for invalid value', () => {
    expect(() => new StationConnectionType('bluetooth' as StationConnectionTypeEnum)).toThrow(
      InvalidStationConnectionType
    )
  })

  it('should report isNetwork() correctly', () => {
    expect(new StationConnectionType(StationConnectionTypeEnum.NETWORK).isNetwork()).toBe(true)
    expect(new StationConnectionType(StationConnectionTypeEnum.USB).isNetwork()).toBe(false)
  })

  it('should report isUsb() correctly', () => {
    expect(new StationConnectionType(StationConnectionTypeEnum.USB).isUsb()).toBe(true)
    expect(new StationConnectionType(StationConnectionTypeEnum.NETWORK).isUsb()).toBe(false)
  })

  it('should expose a static default() that returns NETWORK', () => {
    expect(StationConnectionType.default().value).toBe(StationConnectionTypeEnum.NETWORK)
  })
})
