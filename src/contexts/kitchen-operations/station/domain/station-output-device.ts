import { ValueObject } from '@shared/domain/value-objects/value-object'
import { InvalidStationOutputDevice } from './exceptions/invalid-station-output-device.exception'

export enum StationOutputDeviceEnum {
  KDS = 'kds',
  PRINTER = 'printer',
  NONE = 'none'
}

export class StationOutputDevice extends ValueObject<StationOutputDeviceEnum> {
  constructor(value: StationOutputDeviceEnum) {
    super(value)
    this.ensureIsValidDevice(value)
  }

  private ensureIsValidDevice(value: StationOutputDeviceEnum): void {
    if (!Object.values(StationOutputDeviceEnum).includes(value)) {
      throw new InvalidStationOutputDevice(value)
    }
  }

  isPrinter(): boolean {
    return this.value === StationOutputDeviceEnum.PRINTER
  }

  isKds(): boolean {
    return this.value === StationOutputDeviceEnum.KDS
  }

  isNone(): boolean {
    return this.value === StationOutputDeviceEnum.NONE
  }
}
