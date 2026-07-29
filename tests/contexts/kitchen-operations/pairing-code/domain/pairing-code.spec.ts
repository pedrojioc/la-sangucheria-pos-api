import {
  PairingCode,
  PAIRING_CODE_TTL_MS,
  PAIRING_CODE_ALPHABET
} from '@contexts/kitchen-operations/pairing-code/domain/pairing-code'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('PairingCode', () => {
  describe('issue', () => {
    it('generates a code using only characters from the pairing code alphabet', () => {
      const id = UuidMother.random()
      const now = new Date('2026-01-01T00:00:00.000Z')

      const pairingCode = PairingCode.issue(id, now)

      expect(pairingCode.code).toHaveLength(6)
      for (const char of pairingCode.code) {
        expect(PAIRING_CODE_ALPHABET).toContain(char)
      }
    })

    it('sets expiresAt to now + PAIRING_CODE_TTL_MS', () => {
      const id = UuidMother.random()
      const now = new Date('2026-01-01T00:00:00.000Z')

      const pairingCode = PairingCode.issue(id, now)

      expect(pairingCode.expiresAt.getTime()).toBe(now.getTime() + PAIRING_CODE_TTL_MS)
    })

    it('is persisted in status issued', () => {
      const id = UuidMother.random()
      const now = new Date('2026-01-01T00:00:00.000Z')

      const pairingCode = PairingCode.issue(id, now)

      expect(pairingCode.getStatus()).toBe('issued')
    })
  })

  describe('isRedeemable', () => {
    it('returns true when status is issued and not expired', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), now)

      const stillWithinTtl = new Date(now.getTime() + 5 * 60 * 1000)

      expect(pairingCode.isRedeemable(stillWithinTtl)).toBe(true)
    })

    it('returns false when status is consumed', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), now)
      pairingCode.consume(now)

      expect(pairingCode.isRedeemable(now)).toBe(false)
    })

    it('returns false when expiresAt has passed (expired is derived, not stored)', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), now)

      const afterExpiry = new Date(now.getTime() + PAIRING_CODE_TTL_MS + 1)

      expect(pairingCode.isRedeemable(afterExpiry)).toBe(false)
      // status remains 'issued' — expiry is derived at read time, never stored
      expect(pairingCode.getStatus()).toBe('issued')
    })
  })

  describe('consume', () => {
    it('transitions status from issued to consumed', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), now)

      pairingCode.consume(now)

      expect(pairingCode.getStatus()).toBe('consumed')
    })
  })

  describe('attachCredential', () => {
    it('stores the credentialId', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), now)
      const credentialId = UuidMother.random()

      pairingCode.attachCredential(credentialId, now)

      expect(pairingCode.getCredentialId()).toBe(credentialId)
    })
  })

  describe('markDelivered', () => {
    it('stamps deliveredAt', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), now)

      pairingCode.markDelivered(now)

      expect(pairingCode.getDeliveredAt()).toEqual(now)
    })
  })
})
