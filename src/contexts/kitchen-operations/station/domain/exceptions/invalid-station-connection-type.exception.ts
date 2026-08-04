import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class InvalidStationConnectionType extends DomainException {
  constructor(value: string) {
    super(`Invalid station connection type "${value}". Must be one of: network, usb`)
  }
}
