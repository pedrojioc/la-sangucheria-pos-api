import { ValueObject } from '@shared/domain/value-objects/value-object'
import { InvalidStationConnectionType } from './exceptions/invalid-station-connection-type.exception'

export enum StationConnectionTypeEnum {
  NETWORK = 'network',
  USB = 'usb'
}

export class StationConnectionType extends ValueObject<StationConnectionTypeEnum> {
  constructor(value: StationConnectionTypeEnum) {
    super(value)
    this.ensureIsValidConnectionType(value)
  }

  private ensureIsValidConnectionType(value: StationConnectionTypeEnum): void {
    if (!Object.values(StationConnectionTypeEnum).includes(value)) {
      throw new InvalidStationConnectionType(value)
    }
  }

  static default(): StationConnectionType {
    return new StationConnectionType(StationConnectionTypeEnum.NETWORK)
  }

  isNetwork(): boolean {
    return this.value === StationConnectionTypeEnum.NETWORK
  }

  isUsb(): boolean {
    return this.value === StationConnectionTypeEnum.USB
  }
}
