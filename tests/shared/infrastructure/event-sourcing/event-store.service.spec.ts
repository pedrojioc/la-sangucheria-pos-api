import { EntityManager, Repository } from 'typeorm'

import { EventStoreService } from '@shared/infrastructure/event-sourcing/event-store.service'
import { EventStoreEntity } from '@shared/infrastructure/event-sourcing/persistence/event-store.entity'

describe('EventStoreService — outbox additions', () => {
  const buildRepository = (): Repository<EventStoreEntity> => {
    return {
      create: jest.fn((data: Partial<EventStoreEntity>) => data),
      save: jest.fn((entities: unknown) => Promise.resolve(entities))
    } as unknown as Repository<EventStoreEntity>
  }

  describe('appendInTransaction', () => {
    it('inserts rows using the manager passed as an argument, not the injected default one', async () => {
      const injectedRepository = buildRepository()
      const service = new EventStoreService(injectedRepository)

      const managerRepository = buildRepository()
      const manager = {
        getRepository: jest.fn(() => managerRepository)
      } as unknown as EntityManager

      const row = {
        aggregateId: 'order-1',
        aggregateType: 'orders',
        eventType: 'order.closed',
        version: 1,
        payload: { foo: 'bar' },
        metadata: null,
        correlationId: null,
        occurredAt: new Date('2026-01-01T00:00:00Z'),
        dispatchedAt: null
      }

      await service.appendInTransaction(manager, [row])

      expect(manager.getRepository).toHaveBeenCalledWith(EventStoreEntity)
      expect(managerRepository.save).toHaveBeenCalledTimes(1)
      expect(injectedRepository.save).not.toHaveBeenCalled()
    })

    it('inserts a row with dispatchedAt set to a Date for category-1 audit rows (triangulation)', async () => {
      const injectedRepository = buildRepository()
      const service = new EventStoreService(injectedRepository)

      const managerRepository = buildRepository()
      const manager = {
        getRepository: jest.fn(() => managerRepository)
      } as unknown as EntityManager

      const dispatchedAt = new Date('2026-01-01T00:00:00Z')
      const row = {
        aggregateId: 'order-2',
        aggregateType: 'orders',
        eventType: 'order.opened',
        version: 1,
        payload: {},
        metadata: null,
        correlationId: null,
        occurredAt: new Date('2026-01-01T00:00:00Z'),
        dispatchedAt
      }

      await service.appendInTransaction(manager, [row])

      const savedArg = (managerRepository.save as jest.Mock).mock.calls[0][0]
      expect(savedArg[0].dispatchedAt).toBe(dispatchedAt)
    })
  })

  describe('markDispatched', () => {
    it('delegates an update setting dispatchedAt for the given ids using the passed manager', async () => {
      const injectedRepository = buildRepository()
      const service = new EventStoreService(injectedRepository)

      const update = jest.fn(() => Promise.resolve(undefined))
      const manager = {
        update: update
      } as unknown as EntityManager

      await service.markDispatched(manager, ['id-1', 'id-2'])

      expect(update).toHaveBeenCalledTimes(1)
      expect(update).toHaveBeenCalledWith(
        EventStoreEntity,
        ['id-1', 'id-2'],
        expect.objectContaining({ dispatchedAt: expect.any(Date) })
      )
    })
  })

  describe('claimUndispatched', () => {
    it('builds the query with WHERE dispatchedAt IS NULL, ORDER BY createdAt ASC, the given limit, and FOR UPDATE SKIP LOCKED', async () => {
      const injectedRepository = buildRepository()
      const service = new EventStoreService(injectedRepository)

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        setOnLocked: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([])
      }
      const manager = {
        createQueryBuilder: jest.fn(() => queryBuilder)
      } as unknown as EntityManager

      await service.claimUndispatched(manager, 50)

      expect(manager.createQueryBuilder).toHaveBeenCalledWith(EventStoreEntity, 'event')
      expect(queryBuilder.where).toHaveBeenCalledWith('event.dispatchedAt IS NULL')
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('event.createdAt', 'ASC')
      expect(queryBuilder.take).toHaveBeenCalledWith(50)
      // The FOR UPDATE SKIP LOCKED semantics — this is the multi-instance
      // safety guarantee design D3 depends on. Asserted on the actual
      // query-builder call chain, not inferred from a comment.
      expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write')
      expect(queryBuilder.setOnLocked).toHaveBeenCalledWith('skip_locked')
    })

    it('returns the rows resolved by the query builder', async () => {
      const injectedRepository = buildRepository()
      const service = new EventStoreService(injectedRepository)

      const rows = [{ id: 'row-1' }]
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        setOnLocked: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows)
      }
      const manager = {
        createQueryBuilder: jest.fn(() => queryBuilder)
      } as unknown as EntityManager

      const result = await service.claimUndispatched(manager, 50)

      expect(result).toBe(rows)
    })
  })
})
