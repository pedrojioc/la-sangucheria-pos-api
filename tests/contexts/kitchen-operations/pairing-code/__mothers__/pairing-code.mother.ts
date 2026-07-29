import {
  PairingCode,
  PairingCodePrimitives,
  PairingCodeStatus,
  PAIRING_CODE_TTL_MS,
  PAIRING_CODE_ALPHABET
} from '@contexts/kitchen-operations/pairing-code/domain/pairing-code'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

let counter = 0

export class PairingCodeMother {
  static create(params: Partial<PairingCodePrimitives> = {}): PairingCode {
    const now = new Date()
    const primitives: PairingCodePrimitives = {
      id: params.id ?? UuidMother.random(),
      code: params.code ?? this.nextCode(),
      status: params.status ?? ('issued' as PairingCodeStatus),
      expiresAt: params.expiresAt ?? new Date(now.getTime() + PAIRING_CODE_TTL_MS),
      credentialId: params.credentialId !== undefined ? params.credentialId : null,
      deliveredAt: params.deliveredAt !== undefined ? params.deliveredAt : null,
      createdAt: params.createdAt ?? now,
      updatedAt: params.updatedAt ?? now
    }
    return PairingCode.fromPrimitives(primitives)
  }

  static random(): PairingCode {
    return this.create()
  }

  static issued(now: Date = new Date()): PairingCode {
    return this.create({
      status: 'issued',
      expiresAt: new Date(now.getTime() + PAIRING_CODE_TTL_MS)
    })
  }

  static consumed(): PairingCode {
    return this.create({ status: 'consumed' })
  }

  static expired(now: Date = new Date()): PairingCode {
    return this.create({ status: 'issued', expiresAt: new Date(now.getTime() - 1000) })
  }

  private static nextCode(): string {
    counter += 1
    let n = counter
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += PAIRING_CODE_ALPHABET[n % PAIRING_CODE_ALPHABET.length]
      n = Math.floor(n / PAIRING_CODE_ALPHABET.length)
    }
    return code
  }
}
