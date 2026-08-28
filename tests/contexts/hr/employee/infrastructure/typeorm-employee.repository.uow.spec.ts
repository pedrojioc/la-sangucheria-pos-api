import { EntityManager, Repository } from 'typeorm'

import { TypeOrmEmployeeRepository } from '@contexts/hr/employee/infrastructure/persistence/typeorm/typeorm-employee.repository'
import { EmployeeEntity } from '@contexts/hr/employee/infrastructure/persistence/typeorm/employee.entity'
import { Employee } from '@contexts/hr/employee/domain/employee'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmEmployeeRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<EmployeeEntity> => {
    return {
      target: EmployeeEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      save: jest.fn()
    } as unknown as Repository<EmployeeEntity>
  }

  const buildEmployee = (): Employee =>
    Employee.create(
      UuidMother.random(),
      'Ana',
      'Gomez',
      null,
      null,
      null,
      null,
      null,
      'active',
      null,
      null,
      null,
      null
    )

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmEmployeeRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmEmployeeRepository(defaultRepository, holder)

    await repository.save(buildEmployee())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmEmployeeRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      save: scopedSave
    } as unknown as Repository<EmployeeEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildEmployee()))

    expect(getRepository).toHaveBeenCalledWith(EmployeeEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
