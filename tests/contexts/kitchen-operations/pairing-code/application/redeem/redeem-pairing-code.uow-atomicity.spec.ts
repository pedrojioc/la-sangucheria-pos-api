import { EntityManager, Repository } from 'typeorm'

import { TypeOrmAgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/infrastructure/persistence/typeorm/typeorm-agent-credential.repository'
import { AgentCredentialEntity } from '@contexts/kitchen-operations/agent-credential/infrastructure/persistence/typeorm/agent-credential.entity'
import { TypeOrmPairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/infrastructure/persistence/typeorm/typeorm-pairing-code.repository'
import { PairingCodeEntity } from '@contexts/kitchen-operations/pairing-code/infrastructure/persistence/typeorm/pairing-code.entity'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { AgentCredentialMother } from '@test/contexts/kitchen-operations/agent-credential/__mothers__/agent-credential.mother'
import { PairingCodeMother } from '@test/contexts/kitchen-operations/pairing-code/__mothers__/pairing-code.mother'

/**
 * Slice 6 Group A — proves RedeemPairingCode's writes (AgentCredential save
 * via IssueAgentCredential.run(), then PairingCode save) share ONE ambient
 * EntityManager when a UnitOfWorkContext is active — the atomicity guarantee
 * `@UseInterceptors(TransactionInterceptor)` provides for
 * `POST /agent-pairing/redeem`.
 *
 * IssueAgentCredential.run() itself may issue up to two AgentCredential
 * saves (supersede the existing active one, then save the newly issued
 * one) before RedeemPairingCode.run() saves the PairingCode — all writes
 * must land in the same transaction, or a partial failure leaves an issued
 * credential with no PairingCode ever marking it consumed/attached.
 */
describe('RedeemPairingCode atomicity (Slice 6 Group A): AgentCredential save(s) + PairingCode save share one ambient manager', () => {
  const buildDefaultAgentCredentialRepository = (): Repository<AgentCredentialEntity> =>
    ({
      target: AgentCredentialEntity,
      manager: { name: 'default-agent-credential-manager' } as unknown as EntityManager,
      save: jest.fn()
    }) as unknown as Repository<AgentCredentialEntity>

  const buildDefaultPairingCodeRepository = (): Repository<PairingCodeEntity> =>
    ({
      target: PairingCodeEntity,
      manager: { name: 'default-pairing-code-manager' } as unknown as EntityManager,
      save: jest.fn()
    }) as unknown as Repository<PairingCodeEntity>

  it('resolves both AgentCredential and PairingCode repositories from the same ambient manager inside one UnitOfWorkContext', async () => {
    const holder = new UnitOfWorkContextHolder()

    const defaultAgentCredentialRepository = buildDefaultAgentCredentialRepository()
    const agentCredentialRepository = new TypeOrmAgentCredentialRepository(
      defaultAgentCredentialRepository,
      holder
    )

    const defaultPairingCodeRepository = buildDefaultPairingCodeRepository()
    const pairingCodeRepository = new TypeOrmPairingCodeRepository(
      defaultPairingCodeRepository,
      holder
    )

    const scopedAgentCredentialSave = jest.fn()
    const scopedAgentCredentialRepo = {
      save: scopedAgentCredentialSave
    } as unknown as Repository<AgentCredentialEntity>
    const scopedPairingCodeSave = jest.fn()
    const scopedPairingCodeRepo = {
      save: scopedPairingCodeSave
    } as unknown as Repository<PairingCodeEntity>

    const getRepository = jest.fn().mockImplementation((target: unknown) => {
      if (target === AgentCredentialEntity) return scopedAgentCredentialRepo
      if (target === PairingCodeEntity) return scopedPairingCodeRepo
      throw new Error(`Unexpected target: ${String(target)}`)
    })
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, async () => {
      // Mirrors IssueAgentCredential.run() superseding an existing active
      // credential then saving the new one, followed by RedeemPairingCode
      // saving the PairingCode.
      await agentCredentialRepository.save(AgentCredentialMother.active())
      await agentCredentialRepository.save(AgentCredentialMother.random())
      await pairingCodeRepository.save(PairingCodeMother.random())
    })

    expect(getRepository).toHaveBeenCalledWith(AgentCredentialEntity)
    expect(getRepository).toHaveBeenCalledWith(PairingCodeEntity)
    expect(scopedAgentCredentialSave).toHaveBeenCalledTimes(2)
    expect(scopedPairingCodeSave).toHaveBeenCalledTimes(1)
    expect(defaultAgentCredentialRepository.save).not.toHaveBeenCalled()
    expect(defaultPairingCodeRepository.save).not.toHaveBeenCalled()
  })

  it('without an ambient context, AgentCredential and PairingCode saves fall back to their own independent default repositories (the bug this endpoint has today without the interceptor)', async () => {
    const holder = new UnitOfWorkContextHolder()

    const defaultAgentCredentialRepository = buildDefaultAgentCredentialRepository()
    const agentCredentialRepository = new TypeOrmAgentCredentialRepository(
      defaultAgentCredentialRepository,
      holder
    )

    const defaultPairingCodeRepository = buildDefaultPairingCodeRepository()
    const pairingCodeRepository = new TypeOrmPairingCodeRepository(
      defaultPairingCodeRepository,
      holder
    )

    await agentCredentialRepository.save(AgentCredentialMother.random())
    await pairingCodeRepository.save(PairingCodeMother.random())

    expect(defaultAgentCredentialRepository.save).toHaveBeenCalledTimes(1)
    expect(defaultPairingCodeRepository.save).toHaveBeenCalledTimes(1)
  })
})
