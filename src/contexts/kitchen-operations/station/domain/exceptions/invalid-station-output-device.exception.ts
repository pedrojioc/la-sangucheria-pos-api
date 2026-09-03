import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class InvalidStationOutputDevice extends InvalidValueObjectException {
  constructor(value: string) {
    super(`Invalid station output device "${value}". Must be one of: kds, printer, none`)
  }
}
