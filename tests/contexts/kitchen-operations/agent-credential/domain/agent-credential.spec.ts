import {
  AgentCredential,
  AGENT_CREDENTIAL_ACTIVE_TTL_MS,
  ROTATION_LEAD_MS
} from '@contexts/kitchen-operations/agent-credential/domain/agent-credential'
import { Argon2AgentCredentialSecretHasher } from '@contexts/kitchen-operations/agent-credential/infrastructure/services/argon2-agent-credential-secret-hasher.service'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { AgentCredentialMother } from '../__mothers__/agent-credential.mother'

describe('AgentCredential (aggregate)', () => {
  const hasher = new Argon2AgentCredentialSecretHasher()

  describe('issue()', () => {
    it('should create an active credential with an argon2 hash and FK to the establishment', async () => {
      const id = UuidMother.random()
      const establishmentId = UuidMother.random()

      const { credential, plainSecret } = await AgentCredential.issue(
        { id, establishmentId },
        hasher
      )
      const p = credential.toPrimitives()

      expect(p.id).toBe(id)
      expect(p.establishmentId).toBe(establishmentId)
      expect(p.status).toBe('active')
      expect(p.secretHash).toBeTruthy()
      expect(p.secretHash).not.toBe(plainSecret)
      expect(p.secretHash.startsWith('$argon2')).toBe(true)
      expect(plainSecret.startsWith('lspa_')).toBe(true)
      expect(p.gracePeriodEndsAt).toBeNull()
    })

    it('should set activeExpiresAt to now + AGENT_CREDENTIAL_ACTIVE_TTL_MS', async () => {
      const id = UuidMother.random()
      const establishmentId = UuidMother.random()
      const now = new Date('2026-01-01T00:00:00.000Z')

      const { credential } = await AgentCredential.issue({ id, establishmentId }, hasher, now)
      const p = credential.toPrimitives()

      expect(p.activeExpiresAt).toEqual(new Date(now.getTime() + AGENT_CREDENTIAL_ACTIVE_TTL_MS))
    })
  })

  describe('revoke()', () => {
    it('should transition active -> revoked with no grace period', () => {
      const credential = AgentCredentialMother.active()

      credential.revoke()
      const p = credential.toPrimitives()

      expect(p.status).toBe('revoked')
      expect(p.gracePeriodEndsAt).toBeNull()
    })
  })

  describe('supersede() (rotation)', () => {
    it('should transition active -> superseded with gracePeriodEndsAt = now + AGENT_CREDENTIAL_GRACE_PERIOD_MS', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const gracePeriodMs = 48 * 60 * 60 * 1000
      const credential = AgentCredentialMother.active()

      credential.supersede(now, gracePeriodMs)
      const p = credential.toPrimitives()

      expect(p.status).toBe('superseded')
      expect(p.gracePeriodEndsAt).toEqual(new Date(now.getTime() + gracePeriodMs))
    })

    it('should still authenticate a rotated (superseded, in-grace) credential', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const credential = AgentCredentialMother.active()

      credential.supersede(now)
      const authenticatable = credential.isAuthenticatable(new Date(now.getTime() + 1000))

      expect(authenticatable).toBe(true)
    })

    it('should not authenticate a superseded credential past its grace deadline', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const gracePeriodMs = 60 * 60 * 1000
      const credential = AgentCredentialMother.active()

      credential.supersede(now, gracePeriodMs)
      const authenticatable = credential.isAuthenticatable(
        new Date(now.getTime() + gracePeriodMs + 1000)
      )

      expect(authenticatable).toBe(false)
    })
  })

  describe('needsRotation()', () => {
    it('returns false for an active credential far from its TTL', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const credential = AgentCredentialMother.farFromRotation(undefined, now)

      expect(credential.needsRotation(now)).toBe(false)
    })

    it('returns true exactly at the rotation lead boundary (activeExpiresAt - leadTimeMs)', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const activeExpiresAt = new Date(now.getTime() + ROTATION_LEAD_MS)
      const credential = AgentCredentialMother.create({ status: 'active', activeExpiresAt })

      expect(credential.needsRotation(now)).toBe(true)
    })

    it('returns false one millisecond before the rotation lead boundary', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const activeExpiresAt = new Date(now.getTime() + ROTATION_LEAD_MS + 1)
      const credential = AgentCredentialMother.create({ status: 'active', activeExpiresAt })

      expect(credential.needsRotation(now)).toBe(false)
    })

    it('returns false for a non-active credential regardless of TTL', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const credential = AgentCredentialMother.supersededInGrace(undefined, now)

      expect(credential.needsRotation(now)).toBe(false)
    })
  })

  describe('isAuthenticatable() defensive TTL bound', () => {
    it('still returns true for an active credential before its activeExpiresAt', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const credential = AgentCredentialMother.farFromRotation(undefined, now)

      expect(credential.isAuthenticatable(now)).toBe(true)
    })

    it('returns false for an active credential whose activeExpiresAt has passed (missed-rotation bound)', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const activeExpiresAt = new Date(now.getTime() + 1000)
      const credential = AgentCredentialMother.create({ status: 'active', activeExpiresAt })

      const afterExpiry = new Date(activeExpiresAt.getTime() + 1)
      expect(credential.isAuthenticatable(afterExpiry)).toBe(false)
    })
  })
})
