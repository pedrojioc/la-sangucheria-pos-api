import { EntityManager, Repository } from 'typeorm'

import { TypeOrmAgentCredentialRepository } from '@contexts/kitchen-operations/agent-credential/infrastructure/persistence/typeorm/typeorm-agent-credential.repository'
import { AgentCredentialEntity } from '@contexts/kitchen-operations/agent-credential/infrastructure/persistence/typeorm/agent-credential.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { AgentCredentialMother } from '@test/contexts/kitchen-operations/agent-credential/__mothers__/agent-credential.mother'

describe('TypeOrmAgentCredentialRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<AgentCredentialEntity> => {
    return {
      target: AgentCredentialEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      save: jest.fn()
    } as unknown as Repository<AgentCredentialEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmAgentCredentialRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmAgentCredentialRepository(defaultRepository, holder)

    await repository.save(AgentCredentialMother.random())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmAgentCredentialRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      save: scopedSave
    } as unknown as Repository<AgentCredentialEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(AgentCredentialMother.random()))

    expect(getRepository).toHaveBeenCalledWith(AgentCredentialEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
