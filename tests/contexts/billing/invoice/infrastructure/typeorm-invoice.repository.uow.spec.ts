import { EntityManager, Repository } from 'typeorm'

import { TypeOrmInvoiceRepository } from '@contexts/billing/invoice/infrastructure/persistence/typeorm/typeorm-invoice.repository'
import { InvoiceEntity } from '@contexts/billing/invoice/infrastructure/persistence/typeorm/invoice.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { InvoiceMother } from '@test/contexts/billing/invoice/__mothers__/invoice.mother'

describe('TypeOrmInvoiceRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<InvoiceEntity> => {
    return {
      target: InvoiceEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<InvoiceEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInvoiceRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInvoiceRepository(defaultRepository, holder)

    await repository.save(InvoiceMother.pending())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInvoiceRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<InvoiceEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(InvoiceMother.pending()))

    expect(getRepository).toHaveBeenCalledWith(InvoiceEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
