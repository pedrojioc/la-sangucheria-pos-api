import { Repository, In } from 'typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test, TestingModule } from '@nestjs/testing'

import { TypeOrmKitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/infrastructure/persistence/typeorm/typeorm-kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJobEntity } from '@contexts/kitchen-operations/kitchen-printer/infrastructure/persistence/typeorm/kitchen-ticket-print-job.entity'
import { KitchenTicketPrintJobMother } from '../../../__mothers__/kitchen-ticket-print-job.mother'

describe('TypeOrmKitchenTicketPrintJobRepository', () => {
  let repository: TypeOrmKitchenTicketPrintJobRepository
  let typeOrmRepo: jest.Mocked<Repository<KitchenTicketPrintJobEntity>>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmKitchenTicketPrintJobRepository,
        {
          provide: getRepositoryToken(KitchenTicketPrintJobEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn()
          }
        }
      ]
    }).compile()

    repository = module.get(TypeOrmKitchenTicketPrintJobRepository)
    typeOrmRepo = module.get(getRepositoryToken(KitchenTicketPrintJobEntity))
  })

  describe('save', () => {
    it('maps aggregate primitives to the entity and persists it', async () => {
      const job = KitchenTicketPrintJobMother.create()
      const primitives = job.toPrimitives()
      typeOrmRepo.create.mockReturnValue(primitives as unknown as KitchenTicketPrintJobEntity)

      await repository.save(job)

      expect(typeOrmRepo.create).toHaveBeenCalledWith(primitives)
      expect(typeOrmRepo.save).toHaveBeenCalledWith(primitives)
    })
  })

  describe('search', () => {
    it('returns null when job does not exist', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null)

      const found = await repository.search('00000000-0000-0000-0000-000000000000')

      expect(found).toBeNull()
    })

    it('maps a found entity back to the aggregate', async () => {
      const job = KitchenTicketPrintJobMother.create()
      const primitives = job.toPrimitives()
      typeOrmRepo.findOne.mockResolvedValue(primitives as unknown as KitchenTicketPrintJobEntity)

      const found = await repository.search(job.id)

      expect(found).not.toBeNull()
      expect(found!.toPrimitives()).toEqual(primitives)
    })
  })

  describe('searchUnprinted', () => {
    it('queries status IN (pending, delivered) — NEVER status = pending alone', async () => {
      typeOrmRepo.find.mockResolvedValue([])

      await repository.searchUnprinted()

      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { status: In(['pending', 'delivered']) },
        order: { createdAt: 'ASC' }
      })
    })

    it('maps returned entities (pending and delivered) back to aggregates, excluding printed', async () => {
      const pending = KitchenTicketPrintJobMother.create()
      const delivered = KitchenTicketPrintJobMother.create()
      delivered.markDelivered()

      typeOrmRepo.find.mockResolvedValue([
        pending.toPrimitives(),
        delivered.toPrimitives()
      ] as unknown as KitchenTicketPrintJobEntity[])

      const results = await repository.searchUnprinted()

      const statuses = results.map(r => r.toPrimitives().status)
      expect(statuses).toEqual(['pending', 'delivered'])
      expect(statuses).not.toContain('printed')
    })
  })
})
