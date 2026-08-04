import { DomainException } from '@shared/domain/exceptions/domain.exception'

export type PairingCodeNotRedeemableReason = 'unknown' | 'expired' | 'consumed'

export class PairingCodeNotRedeemable extends DomainException {
  public readonly reason: PairingCodeNotRedeemableReason

  constructor(reason: PairingCodeNotRedeemableReason, code?: string) {
    super(
      code
        ? `Pairing code ${code} is not redeemable: ${reason}`
        : `Pairing code is not redeemable: ${reason}`
    )
    this.reason = reason
  }
}
