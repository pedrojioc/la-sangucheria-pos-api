import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class InvalidStationColor extends DomainException {
  constructor(color: string) {
    super(`Invalid station color "${color}". Must be a 7-character hex color (#RRGGBB)`)
  }
}
