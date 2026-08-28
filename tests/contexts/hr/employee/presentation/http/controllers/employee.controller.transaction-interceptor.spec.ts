import { INTERCEPTORS_METADATA } from '@nestjs/common/constants'

import { EmployeeController } from '@contexts/hr/employee/presentation/http/controllers/employee.controller'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

/**
 * Slice 6 Group A — proves `EmployeeController.grantAccess` carries
 * `@UseInterceptors(TransactionInterceptor)`.
 *
 * Root cause this closes: `GrantEmployeeAccess.run()` performs two
 * independent saves — `RegisterUser.run()` (User) then
 * `employeeRepository.save()` (Employee) — via two different
 * `TransactionalRepository` instances. Without an ambient transaction, each
 * save autocommits independently: if the Employee save fails after the User
 * save already committed, a User exists with no linked Employee.
 *
 * Reads `@UseInterceptors`' own metadata key (INTERCEPTORS_METADATA) directly
 * off the controller's method function, matching the Slice 6 Group B pattern
 * (see order.controller.transaction-interceptor.spec.ts) — no HTTP/DI
 * bootstrap, matching this project's "unit" jest project convention.
 */
describe('EmployeeController — TransactionInterceptor wiring (Slice 6 Group A)', () => {
  const readInterceptors = (methodName: keyof EmployeeController): unknown[] => {
    const handler = EmployeeController.prototype[methodName] as unknown as (
      ...args: unknown[]
    ) => unknown
    return (Reflect.getMetadata(INTERCEPTORS_METADATA, handler) as unknown[]) ?? []
  }

  it('grantAccess carries TransactionInterceptor — POST /employees/:id/grant-access (GrantEmployeeAccess)', () => {
    expect(readInterceptors('grantAccess')).toContain(TransactionInterceptor)
  })

  it.each([
    ['create', 'POST /employees (single write, no interceptor needed)'],
    ['update', 'PUT /employees/:id (single write, no interceptor needed)'],
    ['delete', 'DELETE /employees/:id (single write, no interceptor needed)'],
    ['findOne', 'GET /employees/:id (read-only, no interceptor needed)'],
    ['search', 'GET /employees (read-only, no interceptor needed)']
  ] as const)('%s does NOT carry TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).not.toContain(TransactionInterceptor)
  })
})
