import { EntityManager, Repository } from 'typeorm'

import { TypeOrmUserRepository } from '@contexts/iam/user/infrastructure/persistence/typeorm/typeorm-user.repository'
import { UserEntity } from '@contexts/iam/user/infrastructure/persistence/typeorm/user.entity'
import { TypeOrmEmployeeRepository } from '@contexts/hr/employee/infrastructure/persistence/typeorm/typeorm-employee.repository'
import { EmployeeEntity } from '@contexts/hr/employee/infrastructure/persistence/typeorm/employee.entity'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'

/**
 * Slice 6 Group A — proves GrantEmployeeAccess's two writes (User save via
 * RegisterUser.run(), then Employee save) share ONE ambient EntityManager
 * when a UnitOfWorkContext is active — the atomicity guarantee
 * `@UseInterceptors(TransactionInterceptor)` provides for
 * `POST /employees/:id/grant-access`.
 *
 * Unlike Slice 6 Group B (one repository's save() issuing multiple internal
 * statements), this endpoint's atomicity risk spans TWO DIFFERENT
 * `TransactionalRepository` instances (User, Employee) called from two
 * separate use cases chained inside GrantEmployeeAccess.run(). The proof
 * needed here is that both repositories resolve their scoped Repository<T>
 * from the SAME ambient EntityManager — which is exactly what a real
 * Postgres transaction (opened once by TransactionInterceptor) would enlist
 * both saves into.
 */
describe('GrantEmployeeAccess atomicity (Slice 6 Group A): User save + Employee save share one ambient manager', () => {
  const buildDefaultUserRepository = (): Repository<UserEntity> =>
    ({
      target: UserEntity,
      manager: { name: 'default-user-manager' } as unknown as EntityManager,
      create: jest.fn().mockImplementation((primitives: unknown) => primitives),
      save: jest.fn()
    }) as unknown as Repository<UserEntity>

  const buildDefaultEmployeeRepository = (): Repository<EmployeeEntity> =>
    ({
      target: EmployeeEntity,
      manager: { name: 'default-employee-manager' } as unknown as EntityManager,
      save: jest.fn()
    }) as unknown as Repository<EmployeeEntity>

  it('resolves both User and Employee repositories from the same ambient manager inside one UnitOfWorkContext', async () => {
    const holder = new UnitOfWorkContextHolder()

    const defaultUserRepository = buildDefaultUserRepository()
    const userRepository = new TypeOrmUserRepository(defaultUserRepository, holder)

    const defaultEmployeeRepository = buildDefaultEmployeeRepository()
    const employeeRepository = new TypeOrmEmployeeRepository(defaultEmployeeRepository, holder)

    const scopedUserSave = jest.fn()
    const scopedUserRepo = {
      create: jest.fn().mockImplementation((primitives: unknown) => primitives),
      save: scopedUserSave
    } as unknown as Repository<UserEntity>
    const scopedEmployeeSave = jest.fn()
    const scopedEmployeeRepo = {
      save: scopedEmployeeSave
    } as unknown as Repository<EmployeeEntity>

    const getRepository = jest.fn().mockImplementation((target: unknown) => {
      if (target === UserEntity) return scopedUserRepo
      if (target === EmployeeEntity) return scopedEmployeeRepo
      throw new Error(`Unexpected target: ${String(target)}`)
    })
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, async () => {
      // Mirrors GrantEmployeeAccess.run()'s write order: User saved first
      // (via RegisterUser.run()), Employee saved second.
      await userRepository.save({ toPrimitives: () => ({}) } as never)
      await employeeRepository.save({ toPrimitives: () => ({}) } as never)
    })

    // Both repositories resolved their scoped Repository<T> from the SAME
    // ambient manager instance — proving they would share one real Postgres
    // transaction under TransactionInterceptor, not two independent
    // autocommit statements.
    expect(getRepository).toHaveBeenCalledWith(UserEntity)
    expect(getRepository).toHaveBeenCalledWith(EmployeeEntity)
    expect(scopedUserSave).toHaveBeenCalledTimes(1)
    expect(scopedEmployeeSave).toHaveBeenCalledTimes(1)
    expect(defaultUserRepository.save).not.toHaveBeenCalled()
    expect(defaultEmployeeRepository.save).not.toHaveBeenCalled()
  })

  it('without an ambient context, User and Employee saves fall back to their own independent default repositories (the bug this endpoint has today without the interceptor)', async () => {
    const holder = new UnitOfWorkContextHolder()

    const defaultUserRepository = buildDefaultUserRepository()
    const userRepository = new TypeOrmUserRepository(defaultUserRepository, holder)

    const defaultEmployeeRepository = buildDefaultEmployeeRepository()
    const employeeRepository = new TypeOrmEmployeeRepository(defaultEmployeeRepository, holder)

    await userRepository.save({ toPrimitives: () => ({}) } as never)
    await employeeRepository.save({ toPrimitives: () => ({}) } as never)

    expect(defaultUserRepository.save).toHaveBeenCalledTimes(1)
    expect(defaultEmployeeRepository.save).toHaveBeenCalledTimes(1)
  })
})
