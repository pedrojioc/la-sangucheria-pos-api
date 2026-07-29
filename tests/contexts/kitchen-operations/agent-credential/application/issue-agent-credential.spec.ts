import { IssueAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/issue/issue-agent-credential'
import { AgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/domain/repositories/agent-credential.repository'
import { Argon2AgentCredentialSecretHasher } from '@contexts/kitchen-operations/agent-credential/infrastructure/services/argon2-agent-credential-secret-hasher.service'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { AgentCredentialMother } from '../__mothers__/agent-credential.mother'

describe('IssueAgentCredential', () => {
  const hasher = new Argon2AgentCredentialSecretHasher()

  function mockRepository(
    activeCredential: ReturnType<typeof AgentCredentialMother.active> | null = null
  ) {
    return {
      save: jest.fn(),
      search: jest.fn(),
      findActiveByEstablishment: jest.fn().mockResolvedValue(activeCredential),
      findCandidatesByEstablishment: jest.fn(),
      findAllAuthenticatableCandidates: jest.fn()
    } as unknown as jest.Mocked<AgentCredentialRepository>
  }

  it('should issue a new active credential when none exists for the establishment', async () => {
    const establishmentId = UuidMother.random()
    const repository = mockRepository(null)
    const useCase = new IssueAgentCredential(repository, hasher)

    const { plainSecret } = await useCase.run(establishmentId)

    expect(plainSecret).toMatch(/^lspa_/)
    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0]
    expect(saved.getStatus()).toBe('active')
    expect(saved.getEstablishmentId()).toBe(establishmentId)
  })

  it('should supersede the existing active credential when issuing a new one', async () => {
    const establishmentId = UuidMother.random()
    const existing = AgentCredentialMother.active(establishmentId)
    const repository = mockRepository(existing)
    const useCase = new IssueAgentCredential(repository, hasher)

    await useCase.run(establishmentId)

    // Two saves: the superseded old credential, and the new active one.
    expect(repository.save).toHaveBeenCalledTimes(2)
    expect(existing.getStatus()).toBe('superseded')
    const newCredentialSave = repository.save.mock.calls[1][0]
    expect(newCredentialSave.getStatus()).toBe('active')
    expect(newCredentialSave.getEstablishmentId()).toBe(establishmentId)
  })
})
