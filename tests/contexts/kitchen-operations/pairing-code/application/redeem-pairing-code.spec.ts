import { RedeemPairingCode } from '@contexts/kitchen-operations/pairing-code/application/redeem/redeem-pairing-code'
import { PairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/domain/repositories/pairing-code.repository'
import { PairingCodeNotRedeemable } from '@contexts/kitchen-operations/pairing-code/domain/exceptions/pairing-code-not-redeemable.exception'
import { IssueAgentCredential } from '@contexts/kitchen-operations/agent-credential/application/issue/issue-agent-credential'
import { AgentCredentialMother } from '@test/contexts/kitchen-operations/agent-credential/__mothers__/agent-credential.mother'
import { PairingCodeMother } from '../__mothers__/pairing-code.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('RedeemPairingCode', () => {
  function mockRepository(pairingCode: ReturnType<typeof PairingCodeMother.issued> | null) {
    return {
      save: jest.fn(),
      findByCode: jest.fn().mockResolvedValue(pairingCode)
    } as unknown as jest.Mocked<PairingCodeRepository>
  }

  function mockIssueAgentCredential(establishmentId: string, plainSecret = 'lspa_secret') {
    return {
      run: jest.fn().mockResolvedValue({
        credential: AgentCredentialMother.active(establishmentId),
        plainSecret
      })
    } as unknown as jest.Mocked<IssueAgentCredential>
  }

  it('rejects redemption of an unknown code', async () => {
    const repository = mockRepository(null)
    const issueAgentCredential = mockIssueAgentCredential(UuidMother.random())
    const useCase = new RedeemPairingCode(repository, issueAgentCredential)

    await expect(useCase.run('ABCDEF', UuidMother.random())).rejects.toThrow(
      PairingCodeNotRedeemable
    )
    expect(issueAgentCredential.run).not.toHaveBeenCalled()
  })

  it('rejects redemption of an expired code', async () => {
    const pairingCode = PairingCodeMother.expired()
    const repository = mockRepository(pairingCode)
    const issueAgentCredential = mockIssueAgentCredential(UuidMother.random())
    const useCase = new RedeemPairingCode(repository, issueAgentCredential)

    await expect(useCase.run(pairingCode.code, UuidMother.random())).rejects.toThrow(
      PairingCodeNotRedeemable
    )
    expect(issueAgentCredential.run).not.toHaveBeenCalled()
  })

  it('rejects redemption of an already-consumed code', async () => {
    const pairingCode = PairingCodeMother.consumed()
    const repository = mockRepository(pairingCode)
    const issueAgentCredential = mockIssueAgentCredential(UuidMother.random())
    const useCase = new RedeemPairingCode(repository, issueAgentCredential)

    await expect(useCase.run(pairingCode.code, UuidMother.random())).rejects.toThrow(
      PairingCodeNotRedeemable
    )
    expect(issueAgentCredential.run).not.toHaveBeenCalled()
  })

  it('consumes the code, issues a credential for the establishment, and returns the plaintext apiKey', async () => {
    const establishmentId = UuidMother.random()
    const pairingCode = PairingCodeMother.issued()
    const repository = mockRepository(pairingCode)
    const issueAgentCredential = mockIssueAgentCredential(establishmentId, 'lspa_plaintext')
    const useCase = new RedeemPairingCode(repository, issueAgentCredential)

    const result = await useCase.run(pairingCode.code, establishmentId)

    expect(pairingCode.getStatus()).toBe('consumed')
    expect(issueAgentCredential.run).toHaveBeenCalledWith(establishmentId)
    expect(pairingCode.getCredentialId()).not.toBeNull()
    expect(result.apiKey).toBe('lspa_plaintext')
    expect(result.code).toBe(pairingCode.code)
    expect(repository.save).toHaveBeenCalledWith(pairingCode)
  })
})
