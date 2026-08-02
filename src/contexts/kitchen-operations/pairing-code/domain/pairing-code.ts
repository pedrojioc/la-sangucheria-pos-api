import { randomInt } from 'crypto'
import { AggregateRoot } from '@shared/domain/aggregate-root'
import { PairingCodeId } from './pairing-code-id'
import { PairingCodeValue, PAIRING_CODE_ALPHABET, PAIRING_CODE_LENGTH } from './pairing-code-value'
import { PairingCodePendingSecretUnavailable } from './exceptions/pairing-code-pending-secret-unavailable.exception'

export { PAIRING_CODE_ALPHABET }

export const PAIRING_CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes

// Plaintext-with-TTL-and-wipe (RFC 8628 style): the redeemed apiKey is
// persisted transiently on this row so `poll` can retrieve it, bounded by a
// short TTL and wiped atomically on first successful delivery. See design
// obs #311 (rev 6) — no encryption, TTL + atomic wipe + token-gated read.
export const PENDING_SECRET_TTL_MS = 2 * 60 * 1000 // 2 minutes

export type PairingCodeStatus = 'issued' | 'consumed'

export interface PairingCodePrimitives {
  id: string
  code: string
  status: PairingCodeStatus
  expiresAt: Date
  credentialId: string | null
  deliveredAt: Date | null
  createdAt: Date
  updatedAt: Date
  pollTokenHash: string
  pendingSecret: string | null
  pendingSecretExpiresAt: Date | null
}

export class PairingCode extends AggregateRoot {
  private constructor(
    public readonly id: PairingCodeId,
    private readonly codeValue: PairingCodeValue,
    private status: PairingCodeStatus,
    private readonly expiresAtValue: Date,
    private credentialId: string | null,
    private deliveredAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private readonly pollTokenHashValue: string,
    private pendingSecret: string | null,
    private pendingSecretExpiresAt: Date | null
  ) {
    super()
  }

  static issue(id: string, pollTokenHash: string, now: Date = new Date()): PairingCode {
    const code = PairingCode.generateCode()
    const expiresAt = new Date(now.getTime() + PAIRING_CODE_TTL_MS)

    return new PairingCode(
      new PairingCodeId(id),
      new PairingCodeValue(code),
      'issued',
      expiresAt,
      null,
      null,
      now,
      now,
      pollTokenHash,
      null,
      null
    )
  }

  static fromPrimitives(primitives: PairingCodePrimitives): PairingCode {
    return new PairingCode(
      new PairingCodeId(primitives.id),
      new PairingCodeValue(primitives.code),
      primitives.status,
      primitives.expiresAt,
      primitives.credentialId,
      primitives.deliveredAt,
      primitives.createdAt,
      primitives.updatedAt,
      primitives.pollTokenHash,
      primitives.pendingSecret,
      primitives.pendingSecretExpiresAt
    )
  }

  get code(): string {
    return this.codeValue.value
  }

  get expiresAt(): Date {
    return this.expiresAtValue
  }

  getStatus(): PairingCodeStatus {
    return this.status
  }

  getCredentialId(): string | null {
    return this.credentialId
  }

  getDeliveredAt(): Date | null {
    return this.deliveredAt
  }

  getPollTokenHash(): string {
    return this.pollTokenHashValue
  }

  isExpired(now: Date = new Date()): boolean {
    return now >= this.expiresAtValue
  }

  isRedeemable(now: Date = new Date()): boolean {
    return this.status === 'issued' && !this.isExpired(now)
  }

  consume(now: Date = new Date()): void {
    this.status = 'consumed'
    this.updatedAt = now
  }

  attachCredential(credentialId: string, now: Date = new Date()): void {
    this.credentialId = credentialId
    this.updatedAt = now
  }

  markDelivered(now: Date = new Date()): void {
    this.deliveredAt = now
    this.updatedAt = now
  }

  // Plain assignment, no crypto: persists the just-redeemed plaintext apiKey
  // on this row, clamped to whichever is sooner — the pending-secret TTL or
  // the code's own expiry — so it never outlives the pairing code itself.
  attachPendingSecret(apiKey: string, now: Date, ttlMs: number = PENDING_SECRET_TTL_MS): void {
    const candidateExpiry = new Date(now.getTime() + ttlMs)
    this.pendingSecret = apiKey
    this.pendingSecretExpiresAt =
      candidateExpiry < this.expiresAtValue ? candidateExpiry : this.expiresAtValue
    this.updatedAt = now
  }

  // Guards presence + TTL, captures the plaintext, then wipes it in the same
  // mutation. Caller pairs this with markDelivered(now) and a single save().
  retrieveAndWipeSecret(now: Date): string {
    if (this.pendingSecret === null || this.pendingSecretExpiresAt === null) {
      throw new PairingCodePendingSecretUnavailable()
    }
    if (now >= this.pendingSecretExpiresAt) {
      throw new PairingCodePendingSecretUnavailable()
    }

    const secret = this.pendingSecret
    this.pendingSecret = null
    this.updatedAt = now
    return secret
  }

  hasPendingSecret(now: Date): boolean {
    return (
      this.pendingSecret !== null &&
      this.pendingSecretExpiresAt !== null &&
      now < this.pendingSecretExpiresAt
    )
  }

  private static generateCode(): string {
    let result = ''
    for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
      result += PAIRING_CODE_ALPHABET[randomInt(PAIRING_CODE_ALPHABET.length)]
    }
    return result
  }

  toPrimitives(): PairingCodePrimitives {
    return {
      id: this.id.value,
      code: this.codeValue.value,
      status: this.status,
      expiresAt: this.expiresAtValue,
      credentialId: this.credentialId,
      deliveredAt: this.deliveredAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      pollTokenHash: this.pollTokenHashValue,
      pendingSecret: this.pendingSecret,
      pendingSecretExpiresAt: this.pendingSecretExpiresAt
    }
  }
}
