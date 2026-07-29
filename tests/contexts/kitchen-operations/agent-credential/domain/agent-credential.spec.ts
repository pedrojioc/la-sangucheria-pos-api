import { AgentCredential } from '@contexts/kitchen-operations/agent-credential/domain/agent-credential'
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
})
