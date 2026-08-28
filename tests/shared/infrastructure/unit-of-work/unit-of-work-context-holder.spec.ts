import { EntityManager } from 'typeorm'

import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'

describe('UnitOfWorkContextHolder', () => {
  const buildManager = (): EntityManager => ({}) as EntityManager

  it('returns undefined for currentManager() outside of run()', () => {
    const holder = new UnitOfWorkContextHolder()

    expect(holder.currentManager()).toBeUndefined()
  })

  it('returns undefined for current() outside of run()', () => {
    const holder = new UnitOfWorkContextHolder()

    expect(holder.current()).toBeUndefined()
  })

  it('returns the ambient manager inside run()', () => {
    const holder = new UnitOfWorkContextHolder()
    const manager = buildManager()
    const context: UnitOfWorkContext = { manager, pending: [], depth: 0 }

    holder.run(context, () => {
      expect(holder.currentManager()).toBe(manager)
    })
  })

  it('exposes the full context via current() inside run()', () => {
    const holder = new UnitOfWorkContextHolder()
    const manager = buildManager()
    const context: UnitOfWorkContext = { manager, pending: [], depth: 0 }

    holder.run(context, () => {
      expect(holder.current()).toBe(context)
    })
  })

  it('nested code without its own run() reads the same ambient context via ALS', () => {
    const holder = new UnitOfWorkContextHolder()
    const manager = buildManager()
    const context: UnitOfWorkContext = { manager, pending: [], depth: 0 }

    const readManagerFromNestedFunction = (): EntityManager | undefined => holder.currentManager()

    holder.run(context, () => {
      expect(readManagerFromNestedFunction()).toBe(manager)
    })
  })

  it('propagates the ambient context through async nested calls', async () => {
    const holder = new UnitOfWorkContextHolder()
    const manager = buildManager()
    const context: UnitOfWorkContext = { manager, pending: [], depth: 0 }

    const readManagerAsync = async (): Promise<EntityManager | undefined> => {
      await Promise.resolve()
      return holder.currentManager()
    }

    await holder.run(context, async () => {
      const resolved = await readManagerAsync()
      expect(resolved).toBe(manager)
    })
  })

  it('returns undefined again once run() has completed', () => {
    const holder = new UnitOfWorkContextHolder()
    const manager = buildManager()
    const context: UnitOfWorkContext = { manager, pending: [], depth: 0 }

    holder.run(context, () => {
      // inside run — context is set
    })

    expect(holder.currentManager()).toBeUndefined()
  })
})
