import { RotateAgentCredentialIfNeeded } from '@contexts/kitchen-operations/agent-credential/application/rotate/rotate-agent-credential-if-needed'
import { AgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/domain/repositories/agent-credential.repository'
import { IssueAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/issue/issue-agent-credential'
import { AgentCredentialMother } from '../__mothers__/agent-credential.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('RotateAgentCredentialIfNeeded', () => {
  function mockRepository(active: ReturnType<typeof AgentCredentialMother.active> | null) {
    return {
      save: jest.fn(),
      search: jest.fn(),
      findActiveByEstablishment: jest.fn().mockResolvedValue(active),
      findCandidatesByEstablishment: jest.fn(),
      findAllAuthenticatableCandidates: jest.fn()
    } as unknown as jest.Mocked<AgentCredentialRepository>
  }

  function mockIssueAgentCredential(plainSecret = 'lspa_new_secret') {
    return {
      run: jest.fn().mockResolvedValue({
        credential: AgentCredentialMother.active(),
        plainSecret
      })
    } as unknown as jest.Mocked<IssueAgentCredential>
  }

  it('is a no-op and returns null when the active credential does not need rotation', async () => {
    const establishmentId = UuidMother.random()
    const active = AgentCredentialMother.farFromRotation(establishmentId)
    const repository = mockRepository(active)
    const issueAgentCredential = mockIssueAgentCredential()
    const useCase = new RotateAgentCredentialIfNeeded(repository, issueAgentCredential)

    const result = await useCase.run(establishmentId)

    expect(result).toBeNull()
    expect(issueAgentCredential.run).not.toHaveBeenCalled()
  })

  it('invokes IssueAgentCredential.run unmodified when rotation is due', async () => {
    const establishmentId = UuidMother.random()
    const active = AgentCredentialMother.nearingRotation(establishmentId)
    const repository = mockRepository(active)
    const issueAgentCredential = mockIssueAgentCredential('lspa_rotated')
    const useCase = new RotateAgentCredentialIfNeeded(repository, issueAgentCredential)

    const result = await useCase.run(establishmentId)

    expect(issueAgentCredential.run).toHaveBeenCalledWith(establishmentId)
    expect(result).toEqual({ plainSecret: 'lspa_rotated' })
  })

  it('is a no-op when there is no active credential for the establishment', async () => {
    const establishmentId = UuidMother.random()
    const repository = mockRepository(null)
    const issueAgentCredential = mockIssueAgentCredential()
    const useCase = new RotateAgentCredentialIfNeeded(repository, issueAgentCredential)

    const result = await useCase.run(establishmentId)

    expect(result).toBeNull()
    expect(issueAgentCredential.run).not.toHaveBeenCalled()
  })

  // B5: rotation for an establishment with no live socket must not crash —
  // IssueAgentCredential/supersede runs unconditionally of connection state
  // (the use case has no notion of sockets at all), so the credential is
  // superseded proactively and delivery is deferred to the caller (the
  // gateway only pushes the new secret over a socket it already has in
  // hand — see B4). The invariant asserted here is purely
  // "does not crash / does not silently lose authentication capability".
  it('(B5) does not crash and still rotates for an establishment with no live socket (delivery deferred to the caller)', async () => {
    const establishmentId = UuidMother.random()
    const active = AgentCredentialMother.nearingRotation(establishmentId)
    const repository = mockRepository(active)
    const issueAgentCredential = mockIssueAgentCredential('lspa_rotated')
    const useCase = new RotateAgentCredentialIfNeeded(repository, issueAgentCredential)

    // No socket/connection registry is passed to or consulted by this use
    // case — rotation happens purely at the credential-repository level.
    await expect(useCase.run(establishmentId)).resolves.toEqual({ plainSecret: 'lspa_rotated' })
    // The old credential's supersede()/grace-period path is exercised via
    // IssueAgentCredential.run, already covered by issue-agent-credential.spec.ts;
    // here we assert the rotate use case itself never throws when invoked
    // for an establishment whose socket state it cannot see.
  })
})
