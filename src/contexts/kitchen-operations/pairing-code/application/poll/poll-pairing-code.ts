import { createHash, timingSafeEqual } from 'crypto'
import { PairingCodeRepository } from '../../domain/repositories/pairing-code.repository'
import { PairingCodeNotRedeemable } from '../../domain/exceptions/pairing-code-not-redeemable.exception'

export type PollPairingCodeResult =
  | { status: 'pending' }
  | { status: 'ready'; apiKey: string }
  | { status: 'delivered' }

export class PollPairingCode {
  constructor(private readonly repository: PairingCodeRepository) {}

  async run(
    code: string,
    pollToken: string,
    now: Date = new Date()
  ): Promise<PollPairingCodeResult> {
    const pairingCode = await this.repository.findByCode(code)

    if (!pairingCode) {
      throw new PairingCodeNotRedeemable('unknown', code)
    }
    if (pairingCode.getStatus() === 'consumed' && pairingCode.getDeliveredAt() !== null) {
      // Already delivered in a prior poll — terminal, idempotent.
      return { status: 'delivered' }
    }
    if (pairingCode.isExpired(now) && pairingCode.getCredentialId() === null) {
      throw new PairingCodeNotRedeemable('expired', code)
    }

    if (pairingCode.getCredentialId() === null) {
      // Not yet redeemed by an admin — pending, regardless of pollToken
      // correctness (no code-existence oracle either way).
      return { status: 'pending' }
    }

    // Constant-time compare against the stored hash. A mismatch returns the
    // SAME generic response as "pending" — never a distinct "wrong token"
    // error, to avoid confirming the code/secret's existence to a guesser.
    if (!this.pollTokenMatches(pollToken, pairingCode.getPollTokenHash())) {
      return { status: 'pending' }
    }

    // Atomic compare-and-wipe closes the TOCTOU gap between two concurrent
    // polls (design-gate review obs #315, Warning 1). If this caller does
    // not win the race (or the secret already expired/was never live), the
    // code has already been redeemed, so treat it identically to delivered.
    const wiped = await this.repository.compareAndWipePendingSecret(pairingCode.id.value, now)
    if (!wiped) {
      return { status: 'delivered' }
    }

    const apiKey = wiped.retrieveAndWipeSecret(now)
    return { status: 'ready', apiKey }
  }

  private pollTokenMatches(pollToken: string, pollTokenHash: string): boolean {
    const candidateHash = Buffer.from(createHash('sha256').update(pollToken).digest('hex'))
    const storedHash = Buffer.from(pollTokenHash)

    if (candidateHash.length !== storedHash.length) return false
    return timingSafeEqual(candidateHash, storedHash)
  }
}
