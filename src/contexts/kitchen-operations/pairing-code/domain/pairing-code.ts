import { randomInt } from 'crypto'
import { AggregateRoot } from '@shared/domain/aggregate-root'
import { PairingCodeId } from './pairing-code-id'
import { PairingCodeValue, PAIRING_CODE_ALPHABET, PAIRING_CODE_LENGTH } from './pairing-code-value'

export { PAIRING_CODE_ALPHABET }

export const PAIRING_CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes

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
    private updatedAt: Date
  ) {
    super()
  }

  static issue(id: string, now: Date = new Date()): PairingCode {
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
      now
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
      primitives.updatedAt
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
      updatedAt: this.updatedAt
    }
  }
}
