import { EntityManager, Repository } from 'typeorm'

import { TypeOrmRoleRepository } from '@contexts/iam/role/infrastructure/persistence/typeorm/typeorm-role.repository'
import { RoleEntity } from '@contexts/iam/role/infrastructure/persistence/typeorm/role.entity'
import { Role } from '@contexts/iam/role/domain/role'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmRoleRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<RoleEntity> => {
    return {
      target: RoleEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<RoleEntity>
  }

  const buildRole = (): Role => Role.create(UuidMother.random(), 'Manager', null)

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmRoleRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmRoleRepository(defaultRepository, holder)

    await repository.save(buildRole())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmRoleRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<RoleEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildRole()))

    expect(getRepository).toHaveBeenCalledWith(RoleEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
