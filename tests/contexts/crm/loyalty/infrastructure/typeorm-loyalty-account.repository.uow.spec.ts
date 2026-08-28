import { EntityManager, Repository } from 'typeorm'

import { TypeOrmLoyaltyAccountRepository } from '@contexts/crm/loyalty/infrastructure/persistence/typeorm/typeorm-loyalty-account.repository'
import { LoyaltyAccountEntity } from '@contexts/crm/loyalty/infrastructure/persistence/typeorm/loyalty-account.entity'
import { LoyaltyAccount } from '@contexts/crm/loyalty/domain/loyalty-account'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmLoyaltyAccountRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<LoyaltyAccountEntity> => {
    return {
      target: LoyaltyAccountEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      save: jest.fn()
    } as unknown as Repository<LoyaltyAccountEntity>
  }

  const buildAccount = (): LoyaltyAccount =>
    LoyaltyAccount.create(UuidMother.random(), UuidMother.random())

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmLoyaltyAccountRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmLoyaltyAccountRepository(defaultRepository, holder)

    await repository.save(buildAccount())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmLoyaltyAccountRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      save: scopedSave
    } as unknown as Repository<LoyaltyAccountEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildAccount()))

    expect(getRepository).toHaveBeenCalledWith(LoyaltyAccountEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
