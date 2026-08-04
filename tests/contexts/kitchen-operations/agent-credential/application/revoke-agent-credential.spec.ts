import { RevokeAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/revoke/revoke-agent-credential'
import { AgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/domain/repositories/agent-credential.repository'
import { NoActiveAgentCredential } from '@contexts/kitchen-operations/agent-credential/domain/exceptions/no-active-agent-credential.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { AgentCredentialMother } from '../__mothers__/agent-credential.mother'

describe('RevokeAgentCredential', () => {
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

  it('should revoke the active credential for the establishment', async () => {
    const establishmentId = UuidMother.random()
    const active = AgentCredentialMother.active(establishmentId)
    const repository = mockRepository(active)
    const useCase = new RevokeAgentCredential(repository)

    await useCase.run(establishmentId)

    expect(active.getStatus()).toBe('revoked')
    expect(repository.save).toHaveBeenCalledWith(active)
  })

  it('should reject revoke when no active credential exists', async () => {
    const establishmentId = UuidMother.random()
    const repository = mockRepository(null)
    const useCase = new RevokeAgentCredential(repository)

    await expect(useCase.run(establishmentId)).rejects.toThrow(NoActiveAgentCredential)
    expect(repository.save).not.toHaveBeenCalled()
  })
})
