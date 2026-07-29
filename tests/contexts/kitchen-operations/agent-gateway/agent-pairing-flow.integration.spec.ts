// Full-flow integration test wiring the real PairingGateway, real
// AgentPairingController, real IssuePairingCode/RedeemPairingCode/
// IssueAgentCredential use cases, and an in-memory fake PairingCodeRepository
// + AgentCredentialRepository — no mocks on the domain/application layer.
//
// NOTE: this repo has no `socket.io-client` dependency (not even
// transitively), so a true `supertest` + real socket.io-client E2E spec
// under tests/e2e/ is not possible without adding a new dependency, which is
// out of scope for this apply batch. This test exercises the identical
// call graph a real E2E run would (gateway.handleRequestPairingCode ->
// controller.redeem -> gateway push) using fake sockets, and lives in the
// unit test project as the closest available equivalent.
import { PairingGateway } from '@contexts/kitchen-operations/agent-gateway/infrastructure/websocket/agent-pairing.gateway'
import { PairingSocketRegistry } from '@contexts/kitchen-operations/agent-gateway/infrastructure/websocket/pairing-socket-registry'
import { AgentPairingController } from '@contexts/kitchen-operations/agent-gateway/presentation/http/agent-pairing.controller'
import { IssuePairingCode } from '@contexts/kitchen-operations/pairing-code/application/issue/issue-pairing-code'
import { RedeemPairingCode } from '@contexts/kitchen-operations/pairing-code/application/redeem/redeem-pairing-code'
import { PairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/domain/repositories/pairing-code.repository'
import { PairingCode } from '@contexts/kitchen-operations/pairing-code/domain/pairing-code'
import { IssueAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/issue/issue-agent-credential'
import { AgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/domain/repositories/agent-credential.repository'
import { AgentCredential } from '@contexts/kitchen-operations/agent-credential/domain/agent-credential'
import { Argon2AgentCredentialSecretHasher } from '@contexts/kitchen-operations/agent-credential/infrastructure/services/argon2-agent-credential-secret-hasher.service'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

class InMemoryPairingCodeRepository implements PairingCodeRepository {
  private readonly byCode = new Map<string, PairingCode>()

  save(pairingCode: PairingCode): Promise<void> {
    this.byCode.set(pairingCode.code, pairingCode)
    return Promise.resolve()
  }

  findByCode(code: string): Promise<PairingCode | null> {
    return Promise.resolve(this.byCode.get(code) ?? null)
  }
}

class InMemoryAgentCredentialRepository implements AgentCredentialRepository {
  private readonly byId = new Map<string, AgentCredential>()

  save(credential: AgentCredential): Promise<void> {
    this.byId.set(credential.id.value, credential)
    return Promise.resolve()
  }
  search(): Promise<AgentCredential | null> {
    return Promise.resolve(null)
  }
  findActiveByEstablishment(establishmentId: string): Promise<AgentCredential | null> {
    for (const c of this.byId.values()) {
      if (c.getEstablishmentId() === establishmentId && c.getStatus() === 'active') {
        return Promise.resolve(c)
      }
    }
    return Promise.resolve(null)
  }
  findCandidatesByEstablishment(): Promise<AgentCredential[]> {
    return Promise.resolve([])
  }
  findAllAuthenticatableCandidates(): Promise<AgentCredential[]> {
    return Promise.resolve([])
  }
}

type FakeSocket = { id: string; emit: jest.Mock }
const buildSocket = (id: string): FakeSocket => ({ id, emit: jest.fn() })

describe('Agent pairing flow (integration)', () => {
  let registry: PairingSocketRegistry
  let gateway: PairingGateway
  let controller: AgentPairingController
  const establishmentId = UuidMother.random()

  beforeEach(() => {
    registry = new PairingSocketRegistry()
    const pairingCodeRepository = new InMemoryPairingCodeRepository()
    const issuePairingCode = new IssuePairingCode(pairingCodeRepository)
    gateway = new PairingGateway(registry, issuePairingCode)

    const agentCredentialRepository = new InMemoryAgentCredentialRepository()
    const issueAgentCredential = new IssueAgentCredential(
      agentCredentialRepository,
      new Argon2AgentCredentialSecretHasher()
    )
    const redeemPairingCode = new RedeemPairingCode(pairingCodeRepository, issueAgentCredential)
    const establishmentRepository = {
      findSingleton: jest.fn().mockResolvedValue({ id: { value: establishmentId } }),
      save: jest.fn()
    } as unknown as jest.Mocked<EstablishmentRepository>

    controller = new AgentPairingController(redeemPairingCode, registry, establishmentRepository)
  })

  it('happy path: agent connected throughout — requests code, admin redeems, agent receives pushed credential, HTTP response has no secret', async () => {
    const agentSocket = buildSocket('agent-1')

    await gateway.handleRequestPairingCode(agentSocket as any, {})
    const [, pairingCodePayload] = agentSocket.emit.mock.calls[0]
    const { code } = pairingCodePayload as { code: string }

    const httpResponse = await controller.redeem({ code })

    expect(httpResponse).toEqual({ paired: true })
    expect(JSON.stringify(httpResponse)).not.toMatch(/lspa_/)
    expect(agentSocket.emit).toHaveBeenCalledWith(
      'agent-credential',
      expect.objectContaining({ apiKey: expect.stringMatching(/^lspa_/) })
    )
  })

  it('agent disconnects before redemption, reconnects with the same code before expiry and receives the pending credential without re-redeeming', async () => {
    const agentSocket = buildSocket('agent-1')
    await gateway.handleRequestPairingCode(agentSocket as any, {})
    const [, pairingCodePayload] = agentSocket.emit.mock.calls[0]
    const { code } = pairingCodePayload as { code: string }

    // Agent disconnects: unregister its socket (push to a dead socket must
    // not error the redemption — see registry.getSocket returning undefined).
    registry.deleteSocket(code)

    const httpResponse = await controller.redeem({ code })
    expect(httpResponse).toEqual({ paired: true })

    // Reconnect with the same still-valid code, no new redemption performed.
    const reconnectedSocket = buildSocket('agent-1-reconnected')
    await gateway.handleRequestPairingCode(reconnectedSocket as any, { code })

    expect(reconnectedSocket.emit).toHaveBeenCalledWith(
      'agent-credential',
      expect.objectContaining({ apiKey: expect.stringMatching(/^lspa_/) })
    )
  })
})
