// Full-flow integration test wiring the real AgentPairingPublicController
// (start/poll), real AgentPairingController (admin redeem), real
// IssuePairingCode/RedeemPairingCode/PollPairingCode/IssueAgentCredential
// use cases, and in-memory fake PairingCodeRepository +
// AgentCredentialRepository — no mocks on the domain/application layer.
//
// Rewritten from the previous WS-gateway-push flow (PairingGateway +
// PairingSocketRegistry, now removed) to the HTTP start -> redeem -> poll
// flow (plaintext-with-TTL-and-wipe, design obs #311 rev 6).
import { NotFoundException } from '@nestjs/common'
import { AgentPairingPublicController } from '@contexts/kitchen-operations/agent-gateway/presentation/http/agent-pairing-public.controller'
import { AgentPairingController } from '@contexts/kitchen-operations/agent-gateway/presentation/http/agent-pairing.controller'
import { IssuePairingCode } from '@contexts/kitchen-operations/pairing-code/application/issue/issue-pairing-code'
import { RedeemPairingCode } from '@contexts/kitchen-operations/pairing-code/application/redeem/redeem-pairing-code'
import { PollPairingCode } from '@contexts/kitchen-operations/pairing-code/application/poll/poll-pairing-code'
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

  // Approximates the atomic conditional UPDATE from the real TypeORM
  // repository against the in-memory store: only wipes if a live pending
  // secret is present, mirroring the "WHERE pending_secret IS NOT NULL"
  // guard's observable behavior for this fake's single-threaded test usage.
  compareAndWipePendingSecret(id: string, now: Date): Promise<PairingCode | null> {
    for (const pairingCode of this.byCode.values()) {
      if (pairingCode.id.value !== id) continue
      if (!pairingCode.hasPendingSecret(now)) return Promise.resolve(null)

      const primitives = pairingCode.toPrimitives()
      const wiped = PairingCode.fromPrimitives({ ...primitives, deliveredAt: now })
      this.byCode.set(wiped.code, wiped)
      return Promise.resolve(wiped)
    }
    return Promise.resolve(null)
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

describe('Agent pairing flow (integration)', () => {
  let publicController: AgentPairingPublicController
  let adminController: AgentPairingController
  const establishmentId = UuidMother.random()

  beforeEach(() => {
    const pairingCodeRepository = new InMemoryPairingCodeRepository()
    const issuePairingCode = new IssuePairingCode(pairingCodeRepository)
    const pollPairingCode = new PollPairingCode(pairingCodeRepository)
    publicController = new AgentPairingPublicController(issuePairingCode, pollPairingCode)

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

    adminController = new AgentPairingController(redeemPairingCode, establishmentRepository)
  })

  it('happy path: start -> admin redeems -> agent polls and receives the apiKey, HTTP redeem response has no secret', async () => {
    const { code, pollToken } = await publicController.start()

    const httpResponse = await adminController.redeem({ code })
    expect(httpResponse).toEqual({ paired: true })
    expect(JSON.stringify(httpResponse)).not.toMatch(/lspa_/)

    const pollResult = await publicController.poll({ code, pollToken })
    expect(pollResult).toEqual({ status: 'ready', apiKey: expect.stringMatching(/^lspa_/) })
  })

  it('poll-before-redeem yields pending', async () => {
    const { code, pollToken } = await publicController.start()

    const pollResult = await publicController.poll({ code, pollToken })

    expect(pollResult).toEqual({ status: 'pending' })
  })

  it('wrong pollToken never leaks the apiKey (same generic response as pending)', async () => {
    const { code } = await publicController.start()
    await adminController.redeem({ code })

    const pollResult = await publicController.poll({ code, pollToken: 'wrong-token' })

    expect(pollResult).toEqual({ status: 'pending' })
  })

  it('re-poll after delivery yields delivered, not a repeated apiKey', async () => {
    const { code, pollToken } = await publicController.start()
    await adminController.redeem({ code })

    const firstPoll = await publicController.poll({ code, pollToken })
    expect(firstPoll).toEqual({ status: 'ready', apiKey: expect.stringMatching(/^lspa_/) })

    const secondPoll = await publicController.poll({ code, pollToken })
    expect(secondPoll).toEqual({ status: 'delivered' })
  })

  it('poll on an unknown code rejects with the same 404-equivalent the admin redeem uses for unknown codes', async () => {
    await expect(publicController.poll({ code: 'ZZZ999', pollToken: 'any' })).rejects.toThrow(
      NotFoundException
    )

    await expect(adminController.redeem({ code: 'ZZZ999' })).rejects.toThrow(NotFoundException)
  })
})
