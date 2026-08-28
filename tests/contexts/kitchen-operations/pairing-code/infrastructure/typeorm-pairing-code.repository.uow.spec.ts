import { EntityManager, Repository } from 'typeorm'

import { TypeOrmPairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/infrastructure/persistence/typeorm/typeorm-pairing-code.repository'
import { PairingCodeEntity } from '@contexts/kitchen-operations/pairing-code/infrastructure/persistence/typeorm/pairing-code.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { PairingCodeMother } from '../__mothers__/pairing-code.mother'

describe('TypeOrmPairingCodeRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<PairingCodeEntity> => {
    return {
      target: PairingCodeEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      save: jest.fn()
    } as unknown as Repository<PairingCodeEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPairingCodeRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPairingCodeRepository(defaultRepository, holder)

    await repository.save(PairingCodeMother.random())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPairingCodeRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      save: scopedSave
    } as unknown as Repository<PairingCodeEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(PairingCodeMother.random()))

    expect(getRepository).toHaveBeenCalledWith(PairingCodeEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
