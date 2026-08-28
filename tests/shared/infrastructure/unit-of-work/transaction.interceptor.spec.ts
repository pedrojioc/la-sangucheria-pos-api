import { of, throwError, lastValueFrom } from 'rxjs'
import { CallHandler, ExecutionContext } from '@nestjs/common'
import { DataSource, EntityManager } from 'typeorm'

import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

describe('TransactionInterceptor', () => {
  const buildExecutionContext = (method: string): ExecutionContext => {
    const request = { method }
    return {
      switchToHttp: () => ({
        getRequest: () => request
      })
    } as unknown as ExecutionContext
  }

  const buildDataSource = (manager: EntityManager) => {
    return {
      transaction: jest.fn(async (work: (manager: EntityManager) => Promise<unknown>) => {
        return work(manager)
      })
    } as unknown as DataSource
  }

  const buildCallHandler = (result: unknown = 'ok', shouldThrow = false): CallHandler => {
    return {
      handle: () => (shouldThrow ? throwError(() => result) : of(result))
    }
  }

  it('opens a transaction and runs an ALS context for POST requests', async () => {
    const manager = {} as EntityManager
    const dataSource = buildDataSource(manager)
    const holder = new UnitOfWorkContextHolder()
    const runSpy = jest.spyOn(holder, 'run')
    const interceptor = new TransactionInterceptor(dataSource, holder)
    const context = buildExecutionContext('POST')
    const callHandler = buildCallHandler('created')

    const result$ = interceptor.intercept(context, callHandler)
    const result = await lastValueFrom(result$)

    expect(result).toBe('created')
    expect(dataSource.transaction).toHaveBeenCalledTimes(1)
    expect(runSpy).toHaveBeenCalledTimes(1)
    expect(runSpy.mock.calls[0][0]).toEqual({ manager, pending: [], depth: 0 })
  })

  it.each(['PUT', 'PATCH', 'DELETE'])('opens a transaction for %s requests', async method => {
    const manager = {} as EntityManager
    const dataSource = buildDataSource(manager)
    const holder = new UnitOfWorkContextHolder()
    const interceptor = new TransactionInterceptor(dataSource, holder)
    const context = buildExecutionContext(method)
    const callHandler = buildCallHandler('ok')

    await lastValueFrom(interceptor.intercept(context, callHandler))

    expect(dataSource.transaction).toHaveBeenCalledTimes(1)
  })

  it.each(['GET', 'HEAD'])('bypasses the transaction entirely for %s requests', async method => {
    const manager = {} as EntityManager
    const dataSource = buildDataSource(manager)
    const holder = new UnitOfWorkContextHolder()
    const runSpy = jest.spyOn(holder, 'run')
    const interceptor = new TransactionInterceptor(dataSource, holder)
    const context = buildExecutionContext(method)
    const callHandler = buildCallHandler('read-result')

    const result$ = interceptor.intercept(context, callHandler)
    const result = await lastValueFrom(result$)

    expect(result).toBe('read-result')
    expect(dataSource.transaction).not.toHaveBeenCalled()
    expect(runSpy).not.toHaveBeenCalled()
  })

  it('commits (resolves) when next.handle() succeeds', async () => {
    const manager = {} as EntityManager
    const dataSource = buildDataSource(manager)
    const holder = new UnitOfWorkContextHolder()
    const interceptor = new TransactionInterceptor(dataSource, holder)
    const context = buildExecutionContext('POST')
    const callHandler = buildCallHandler('success')

    const result$ = interceptor.intercept(context, callHandler)

    await expect(lastValueFrom(result$)).resolves.toBe('success')
  })

  it('rolls back (rejects) when next.handle() errors, propagating the same error', async () => {
    const manager = {} as EntityManager
    const failure = new Error('boom')
    const dataSource = {
      transaction: jest.fn(async (work: (manager: EntityManager) => Promise<unknown>) => {
        return work(manager)
      })
    } as unknown as DataSource
    const holder = new UnitOfWorkContextHolder()
    const interceptor = new TransactionInterceptor(dataSource, holder)
    const context = buildExecutionContext('POST')
    const callHandler = buildCallHandler(failure, true)

    const result$ = interceptor.intercept(context, callHandler)

    await expect(lastValueFrom(result$)).rejects.toBe(failure)
  })
})
