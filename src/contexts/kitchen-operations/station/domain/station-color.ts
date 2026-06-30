import { InvalidStationColor } from './exceptions/invalid-station-color.exception'

export class StationColor {
  private static readonly HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/

  readonly value: string

  constructor(value: string) {
    if (!StationColor.HEX_PATTERN.test(value)) {
      throw new InvalidStationColor(value)
    }
    this.value = value
  }
}
