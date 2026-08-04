import { DomainException } from '@shared/domain/exceptions/domain.exception'

// Thrown when retrieveAndWipeSecret() is called with no live pending secret
// (absent or TTL-expired). The application layer MUST map this to the same
// generic response used for "pending"/"delivered" — never a distinct error
// that could leak whether a secret existed (see design's pollToken-oracle
// warning, spec's no-code-existence-oracle invariant).
export class PairingCodePendingSecretUnavailable extends DomainException {
  constructor() {
    super('Pairing code has no live pending secret to retrieve')
  }
}
