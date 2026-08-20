import { UnpairAgent } from '@contexts/kitchen-operations/agent-gateway/application/unpair/unpair-agent'
import { RevokeAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/revoke/revoke-agent-credential'
import { NoActiveAgentCredential } from '@contexts/kitchen-operations/agent-credential/domain/exceptions/no-active-agent-credential.exception'
import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('UnpairAgent', () => {
  let revokeAgentCredential: jest.Mocked<RevokeAgentCredential>
  let registry: jest.Mocked<AgentConnectionRegistry>
  let useCase: UnpairAgent

  const establishmentId = new EstablishmentId(UuidMother.random())

  beforeEach(() => {
    revokeAgentCredential = { run: jest.fn() } as unknown as jest.Mocked<RevokeAgentCredential>
    registry = {
      register: jest.fn(),
      unregister: jest.fn(),
      current: jest.fn()
    } as unknown as jest.Mocked<AgentConnectionRegistry>
    useCase = new UnpairAgent(revokeAgentCredential, registry)
  })

  it('revokes the credential and emits agent-unpaired to a live connection', async () => {
    revokeAgentCredential.run.mockResolvedValue(undefined)
    const emit = jest.fn()
    registry.current.mockReturnValue({ emit })

    await useCase.run(establishmentId)

    expect(revokeAgentCredential.run).toHaveBeenCalledWith(establishmentId.value)
    expect(registry.current).toHaveBeenCalledWith(establishmentId)
    expect(emit).toHaveBeenCalledWith('agent-unpaired', {})
  })

  it('revokes the credential and does not attempt to emit when there is no live connection', async () => {
    revokeAgentCredential.run.mockResolvedValue(undefined)
    registry.current.mockReturnValue(undefined)

    await expect(useCase.run(establishmentId)).resolves.toBeUndefined()

    expect(revokeAgentCredential.run).toHaveBeenCalledWith(establishmentId.value)
  })

  it('is idempotent: swallows NoActiveAgentCredential and resolves successfully', async () => {
    revokeAgentCredential.run.mockRejectedValue(new NoActiveAgentCredential(establishmentId.value))
    registry.current.mockReturnValue(undefined)

    await expect(useCase.run(establishmentId)).resolves.toBeUndefined()
  })

  it('propagates errors that are not NoActiveAgentCredential', async () => {
    const unexpected = new Error('boom')
    revokeAgentCredential.run.mockRejectedValue(unexpected)

    await expect(useCase.run(establishmentId)).rejects.toThrow(unexpected)
    expect(registry.current).not.toHaveBeenCalled()
  })

  it('swallows a failing emit on a stale connection without affecting the already-persisted revoke', async () => {
    revokeAgentCredential.run.mockResolvedValue(undefined)
    const emit = jest.fn(() => {
      throw new Error('socket is dead')
    })
    registry.current.mockReturnValue({ emit })

    await expect(useCase.run(establishmentId)).resolves.toBeUndefined()

    expect(revokeAgentCredential.run).toHaveBeenCalledWith(establishmentId.value)
    expect(emit).toHaveBeenCalledWith('agent-unpaired', {})
  })
})
