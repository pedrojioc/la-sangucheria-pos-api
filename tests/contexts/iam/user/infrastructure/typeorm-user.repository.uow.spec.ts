import { EntityManager, Repository } from 'typeorm'

import { TypeOrmUserRepository } from '@contexts/iam/user/infrastructure/persistence/typeorm/typeorm-user.repository'
import { UserEntity } from '@contexts/iam/user/infrastructure/persistence/typeorm/user.entity'
import { User } from '@contexts/iam/user/domain/user'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmUserRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<UserEntity> => {
    return {
      target: UserEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<UserEntity>
  }

  const buildUser = (): User =>
    User.create(
      UuidMother.random(),
      'agomez',
      'agomez@example.com',
      'hashed-password',
      'Ana Gomez',
      UuidMother.random()
    )

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmUserRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmUserRepository(defaultRepository, holder)

    await repository.save(buildUser())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmUserRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<UserEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildUser()))

    expect(getRepository).toHaveBeenCalledWith(UserEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
