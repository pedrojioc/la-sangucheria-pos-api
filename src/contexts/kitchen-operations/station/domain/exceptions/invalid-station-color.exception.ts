import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class InvalidStationColor extends InvalidValueObjectException {
  constructor(color: string) {
    super(`Invalid station color "${color}". Must be a 7-character hex color (#RRGGBB)`)
  }
}
