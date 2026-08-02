import {
  PairingCode,
  PAIRING_CODE_TTL_MS,
  PAIRING_CODE_ALPHABET,
  PENDING_SECRET_TTL_MS
} from '@contexts/kitchen-operations/pairing-code/domain/pairing-code'
import { PairingCodePendingSecretUnavailable } from '@contexts/kitchen-operations/pairing-code/domain/exceptions/pairing-code-pending-secret-unavailable.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { PairingCodeMother } from '../__mothers__/pairing-code.mother'

const POLL_TOKEN_HASH = PairingCodeMother.hashPollToken('test-poll-token')

describe('PairingCode', () => {
  describe('issue', () => {
    it('generates a code using only characters from the pairing code alphabet', () => {
      const id = UuidMother.random()
      const now = new Date('2026-01-01T00:00:00.000Z')

      const pairingCode = PairingCode.issue(id, POLL_TOKEN_HASH, now)

      expect(pairingCode.code).toHaveLength(6)
      for (const char of pairingCode.code) {
        expect(PAIRING_CODE_ALPHABET).toContain(char)
      }
    })

    it('sets expiresAt to now + PAIRING_CODE_TTL_MS', () => {
      const id = UuidMother.random()
      const now = new Date('2026-01-01T00:00:00.000Z')

      const pairingCode = PairingCode.issue(id, POLL_TOKEN_HASH, now)

      expect(pairingCode.expiresAt.getTime()).toBe(now.getTime() + PAIRING_CODE_TTL_MS)
    })

    it('is persisted in status issued', () => {
      const id = UuidMother.random()
      const now = new Date('2026-01-01T00:00:00.000Z')

      const pairingCode = PairingCode.issue(id, POLL_TOKEN_HASH, now)

      expect(pairingCode.getStatus()).toBe('issued')
    })

    it('persists the pollTokenHash and starts with no pending secret', () => {
      const id = UuidMother.random()
      const now = new Date('2026-01-01T00:00:00.000Z')

      const pairingCode = PairingCode.issue(id, POLL_TOKEN_HASH, now)

      expect(pairingCode.getPollTokenHash()).toBe(POLL_TOKEN_HASH)
      expect(pairingCode.hasPendingSecret(now)).toBe(false)
    })
  })

  describe('isRedeemable', () => {
    it('returns true when status is issued and not expired', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)

      const stillWithinTtl = new Date(now.getTime() + 5 * 60 * 1000)

      expect(pairingCode.isRedeemable(stillWithinTtl)).toBe(true)
    })

    it('returns false when status is consumed', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)
      pairingCode.consume(now)

      expect(pairingCode.isRedeemable(now)).toBe(false)
    })

    it('returns false when expiresAt has passed (expired is derived, not stored)', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)

      const afterExpiry = new Date(now.getTime() + PAIRING_CODE_TTL_MS + 1)

      expect(pairingCode.isRedeemable(afterExpiry)).toBe(false)
      // status remains 'issued' — expiry is derived at read time, never stored
      expect(pairingCode.getStatus()).toBe('issued')
    })
  })

  describe('consume', () => {
    it('transitions status from issued to consumed', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)

      pairingCode.consume(now)

      expect(pairingCode.getStatus()).toBe('consumed')
    })
  })

  describe('attachCredential', () => {
    it('stores the credentialId', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)
      const credentialId = UuidMother.random()

      pairingCode.attachCredential(credentialId, now)

      expect(pairingCode.getCredentialId()).toBe(credentialId)
    })
  })

  describe('markDelivered', () => {
    it('stamps deliveredAt', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)

      pairingCode.markDelivered(now)

      expect(pairingCode.getDeliveredAt()).toEqual(now)
    })
  })

  describe('attachPendingSecret', () => {
    it('stores the plaintext secret with expiry clamped to now + ttlMs when that is sooner than code expiry', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)

      pairingCode.attachPendingSecret('lspa_secret', now, PENDING_SECRET_TTL_MS)

      expect(pairingCode.hasPendingSecret(now)).toBe(true)
      expect(
        pairingCode.hasPendingSecret(new Date(now.getTime() + PENDING_SECRET_TTL_MS + 1))
      ).toBe(false)
    })

    it('clamps expiry to the code expiresAt when ttlMs would exceed it', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)
      // TTL longer than the code's own remaining life (10 min) must never win.
      const hugeTtlMs = 60 * 60 * 1000

      pairingCode.attachPendingSecret('lspa_secret', now, hugeTtlMs)

      const rightAtCodeExpiry = pairingCode.expiresAt
      expect(pairingCode.hasPendingSecret(rightAtCodeExpiry)).toBe(false)
      expect(pairingCode.hasPendingSecret(new Date(rightAtCodeExpiry.getTime() - 1))).toBe(true)
    })
  })

  describe('retrieveAndWipeSecret', () => {
    it('returns the plaintext secret and wipes it on success', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)
      pairingCode.attachPendingSecret('lspa_secret', now, PENDING_SECRET_TTL_MS)

      const secret = pairingCode.retrieveAndWipeSecret(now)

      expect(secret).toBe('lspa_secret')
      expect(pairingCode.hasPendingSecret(now)).toBe(false)
    })

    it('throws PairingCodePendingSecretUnavailable when the secret is expired', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCodeMother.withExpiredPendingSecret('lspa_secret', now)

      expect(() => pairingCode.retrieveAndWipeSecret(now)).toThrow(
        PairingCodePendingSecretUnavailable
      )
    })

    it('throws PairingCodePendingSecretUnavailable when no secret is pending', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)

      expect(() => pairingCode.retrieveAndWipeSecret(now)).toThrow(
        PairingCodePendingSecretUnavailable
      )
    })

    it('a second retrieval after a successful wipe also throws (idempotent terminal state)', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const pairingCode = PairingCode.issue(UuidMother.random(), POLL_TOKEN_HASH, now)
      pairingCode.attachPendingSecret('lspa_secret', now, PENDING_SECRET_TTL_MS)
      pairingCode.retrieveAndWipeSecret(now)

      expect(() => pairingCode.retrieveAndWipeSecret(now)).toThrow(
        PairingCodePendingSecretUnavailable
      )
    })
  })
})
