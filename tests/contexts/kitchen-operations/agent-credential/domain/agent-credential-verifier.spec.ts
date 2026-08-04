import { Argon2AgentCredentialVerifier } from '@contexts/kitchen-operations/agent-credential/infrastructure/services/argon2-agent-credential-verifier.service'
import { AgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/domain/repositories/agent-credential.repository'
import { AgentCredential } from '@contexts/kitchen-operations/agent-credential/domain/agent-credential'
import { Argon2AgentCredentialSecretHasher } from '@contexts/kitchen-operations/agent-credential/infrastructure/services/argon2-agent-credential-secret-hasher.service'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('Argon2AgentCredentialVerifier', () => {
  const hasher = new Argon2AgentCredentialSecretHasher()

  function mockRepository(candidates: AgentCredential[]): AgentCredentialRepository {
    return {
      save: jest.fn(),
      search: jest.fn(),
      findActiveByEstablishment: jest.fn(),
      findCandidatesByEstablishment: jest.fn(),
      findAllAuthenticatableCandidates: jest.fn().mockResolvedValue(candidates)
    }
  }

  it('should return the EstablishmentId for a matching active credential', async () => {
    const establishmentId = UuidMother.random()
    const { credential, plainSecret } = await AgentCredential.issue(
      { id: UuidMother.random(), establishmentId },
      hasher
    )
    const repository = mockRepository([credential])
    const verifier = new Argon2AgentCredentialVerifier(repository, hasher)

    const result = await verifier.verify(plainSecret)

    expect(result).toBe(establishmentId)
  })

  it('should return an in-grace superseded credential establishment on match', async () => {
    const establishmentId = UuidMother.random()
    const { credential, plainSecret } = await AgentCredential.issue(
      { id: UuidMother.random(), establishmentId },
      hasher
    )
    credential.supersede(new Date())
    const repository = mockRepository([credential])
    const verifier = new Argon2AgentCredentialVerifier(repository, hasher)

    const result = await verifier.verify(plainSecret)

    expect(result).toBe(establishmentId)
  })

  it('should return null when no candidate matches (revoked/unknown excluded upstream)', async () => {
    const { plainSecret } = await AgentCredential.issue(
      { id: UuidMother.random(), establishmentId: UuidMother.random() },
      hasher
    )
    const repository = mockRepository([])
    const verifier = new Argon2AgentCredentialVerifier(repository, hasher)

    const result = await verifier.verify(plainSecret)

    expect(result).toBeNull()
  })

  it('should return null for a grace-expired superseded credential (excluded from candidate set by repository)', async () => {
    // The repository is responsible for excluding grace-expired candidates via
    // findAllAuthenticatableCandidates(now); simulate that exclusion here.
    const repository = mockRepository([])
    const verifier = new Argon2AgentCredentialVerifier(repository, hasher)

    const result = await verifier.verify('lspa_some-expired-key')

    expect(result).toBeNull()
  })
})
