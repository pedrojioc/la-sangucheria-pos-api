import { Repository } from 'typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test, TestingModule } from '@nestjs/testing'

import { Invoice } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceId } from '@contexts/billing/invoice/domain/invoice-id'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'
import { InvoiceEntity } from '@contexts/billing/invoice/infrastructure/persistence/typeorm/invoice.entity'
import { TypeOrmInvoiceRepository } from '@contexts/billing/invoice/infrastructure/persistence/typeorm/typeorm-invoice.repository'
import {
  InvoiceMother,
  InvoiceSnapshotMother
} from '@test/contexts/billing/invoice/__mothers__/invoice.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmInvoiceRepository', () => {
  let repository: TypeOrmInvoiceRepository
  let typeOrmRepo: jest.Mocked<Repository<InvoiceEntity>>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmInvoiceRepository,
        {
          provide: getRepositoryToken(InvoiceEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn()
          }
        }
      ]
    }).compile()

    repository = module.get(TypeOrmInvoiceRepository)
    typeOrmRepo = module.get(getRepositoryToken(InvoiceEntity))
  })

  describe('save()', () => {
    it('calls TypeORM save with correctly mapped entity preserving jsonb snapshot', async () => {
      const snapshot = InvoiceSnapshotMother.create()
      const invoice = InvoiceMother.pending({ snapshot })
      const primitives = invoice.toPrimitives()

      const fakeEntity = { ...primitives } as unknown as InvoiceEntity
      typeOrmRepo.create.mockReturnValue(fakeEntity)
      typeOrmRepo.save.mockResolvedValue(fakeEntity)

      await repository.save(invoice)

      expect(typeOrmRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: primitives.id,
          documentType: primitives.documentType,
          snapshot: primitives.snapshot,
          status: primitives.status,
          attempts: primitives.attempts,
          cufeCude: null,
          factusDocumentNumber: null,
          failureReason: null
        })
      )

      // snapshot jsonb integrity: key fields present
      const createArg = typeOrmRepo.create.mock.calls[0][0] as Partial<InvoiceEntity>
      expect(createArg.snapshot).toEqual(snapshot)
      expect(createArg.documentType).toBe(primitives.documentType)

      expect(typeOrmRepo.save).toHaveBeenCalledWith(fakeEntity)
    })
  })

  describe('search()', () => {
    it('returns Invoice when entity is found', async () => {
      const primitives = InvoiceMother.primitives()
      const entity: InvoiceEntity = {
        id: primitives.id,
        documentType: primitives.documentType,
        snapshot: primitives.snapshot,
        status: primitives.status,
        cufeCude: primitives.cufeCude,
        factusDocumentNumber: primitives.factusDocumentNumber,
        failureReason: primitives.failureReason,
        attempts: primitives.attempts,
        createdAt: primitives.createdAt,
        updatedAt: primitives.updatedAt
      }
      typeOrmRepo.findOne.mockResolvedValue(entity)

      const result = await repository.search(new InvoiceId(primitives.id))

      expect(result).toBeInstanceOf(Invoice)
      expect(result!.toPrimitives().id).toBe(primitives.id)
      expect(result!.toPrimitives().status).toBe(primitives.status)
    })

    it('returns null when entity is not found', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null)

      const result = await repository.search(new InvoiceId(UuidMother.random()))

      expect(result).toBeNull()
    })
  })

  describe('searchPending()', () => {
    it('returns Invoice array for FAILED and PENDING rows', async () => {
      const pendingPrimitives = InvoiceMother.primitives({ status: InvoiceStatus.PENDING })
      const failedPrimitives = InvoiceMother.primitives({ status: InvoiceStatus.FAILED })

      const entities: InvoiceEntity[] = [
        {
          id: pendingPrimitives.id,
          documentType: pendingPrimitives.documentType,
          snapshot: pendingPrimitives.snapshot,
          status: pendingPrimitives.status,
          cufeCude: null,
          factusDocumentNumber: null,
          failureReason: null,
          attempts: 0,
          createdAt: pendingPrimitives.createdAt,
          updatedAt: pendingPrimitives.updatedAt
        },
        {
          id: failedPrimitives.id,
          documentType: failedPrimitives.documentType,
          snapshot: failedPrimitives.snapshot,
          status: failedPrimitives.status,
          cufeCude: null,
          factusDocumentNumber: null,
          failureReason: 'timeout',
          attempts: 1,
          createdAt: failedPrimitives.createdAt,
          updatedAt: failedPrimitives.updatedAt
        }
      ]
      typeOrmRepo.find.mockResolvedValue(entities)

      const results = await repository.searchPending()

      expect(results).toHaveLength(2)
      expect(results.every(r => r instanceof Invoice)).toBe(true)
      expect(results.map(r => r.toPrimitives().status)).toEqual(
        expect.arrayContaining([InvoiceStatus.PENDING, InvoiceStatus.FAILED])
      )
    })
  })
})
