import { GetAgentPairingStatus } from '@contexts/kitchen-operations/agent-gateway/application/get-status/get-agent-pairing-status'
import { AgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/domain/repositories/agent-credential.repository'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'
import { AgentCredentialMother } from '@test/contexts/kitchen-operations/agent-credential/__mothers__/agent-credential.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('GetAgentPairingStatus', () => {
  let credentialRepository: jest.Mocked<AgentCredentialRepository>
  let registry: jest.Mocked<AgentConnectionRegistry>
  let useCase: GetAgentPairingStatus

  const establishmentId = new EstablishmentId(UuidMother.random())

  beforeEach(() => {
    credentialRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findActiveByEstablishment: jest.fn(),
      findCandidatesByEstablishment: jest.fn(),
      findAllAuthenticatableCandidates: jest.fn()
    } as unknown as jest.Mocked<AgentCredentialRepository>
    registry = {
      register: jest.fn(),
      unregister: jest.fn(),
      current: jest.fn()
    } as unknown as jest.Mocked<AgentConnectionRegistry>
    useCase = new GetAgentPairingStatus(credentialRepository, registry)
  })

  it('returns not paired and not connected when no credential was ever issued', async () => {
    credentialRepository.findCandidatesByEstablishment.mockResolvedValue([])
    registry.current.mockReturnValue(undefined)

    const result = await useCase.run(establishmentId)

    expect(result).toEqual({ paired: false, connected: false })
  })

  it('returns paired and disconnected when the agent has an authenticatable credential but no live connection', async () => {
    credentialRepository.findCandidatesByEstablishment.mockResolvedValue([
      AgentCredentialMother.active(establishmentId.value)
    ])
    registry.current.mockReturnValue(undefined)

    const result = await useCase.run(establishmentId)

    expect(result).toEqual({ paired: true, connected: false })
  })

  it('returns paired and connected when the agent has an authenticatable credential and a live connection', async () => {
    credentialRepository.findCandidatesByEstablishment.mockResolvedValue([
      AgentCredentialMother.active(establishmentId.value)
    ])
    registry.current.mockReturnValue({ emit: jest.fn() })

    const result = await useCase.run(establishmentId)

    expect(result).toEqual({ paired: true, connected: true })
  })

  it('returns paired and connected for a superseded credential still inside its grace window', async () => {
    credentialRepository.findCandidatesByEstablishment.mockResolvedValue([
      AgentCredentialMother.supersededInGrace(establishmentId.value)
    ])
    registry.current.mockReturnValue({ emit: jest.fn() })

    const result = await useCase.run(establishmentId)

    expect(result).toEqual({ paired: true, connected: true })
  })

  it('returns not paired when only revoked and grace-expired credentials exist', async () => {
    credentialRepository.findCandidatesByEstablishment.mockResolvedValue([
      AgentCredentialMother.revoked(establishmentId.value),
      AgentCredentialMother.supersededExpired(establishmentId.value)
    ])
    registry.current.mockReturnValue(undefined)

    const result = await useCase.run(establishmentId)

    expect(result).toEqual({ paired: false, connected: false })
  })

  it('scopes the credential lookup to the resolved establishment and never uses the cross-establishment verifier query', async () => {
    credentialRepository.findCandidatesByEstablishment.mockResolvedValue([
      AgentCredentialMother.active(establishmentId.value)
    ])
    registry.current.mockReturnValue(undefined)

    await useCase.run(establishmentId)

    expect(credentialRepository.findCandidatesByEstablishment).toHaveBeenCalledWith(
      establishmentId.value
    )
    expect(credentialRepository.findAllAuthenticatableCandidates).not.toHaveBeenCalled()
  })
})
