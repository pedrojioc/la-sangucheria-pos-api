import { EntityManager, Repository } from 'typeorm'

import { TypeOrmDiscoveredPrinterDeviceRepository } from '@contexts/kitchen-operations/printer-discovery/infrastructure/persistence/typeorm/typeorm-discovered-printer-device.repository'
import { DiscoveredPrinterDeviceEntity } from '@contexts/kitchen-operations/printer-discovery/infrastructure/persistence/typeorm/discovered-printer-device.entity'
import { DiscoveredPrinterDevice } from '@contexts/kitchen-operations/printer-discovery/domain/discovered-printer-device'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmDiscoveredPrinterDeviceRepository (ambient UnitOfWork wiring)', () => {
  const buildDevice = (): DiscoveredPrinterDevice =>
    DiscoveredPrinterDevice.create({
      id: UuidMother.random(),
      establishmentId: UuidMother.random(),
      connectionType: 'network',
      address: '192.168.1.50',
      usbIdentifier: null,
      model: 'EPSON TM-T20'
    })

  const buildDefaultRepository = (): Repository<DiscoveredPrinterDeviceEntity> => {
    return {
      target: DiscoveredPrinterDeviceEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      save: jest.fn()
    } as unknown as Repository<DiscoveredPrinterDeviceEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmDiscoveredPrinterDeviceRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmDiscoveredPrinterDeviceRepository(defaultRepository, holder)

    await repository.save(buildDevice())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmDiscoveredPrinterDeviceRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      save: scopedSave
    } as unknown as Repository<DiscoveredPrinterDeviceEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildDevice()))

    expect(getRepository).toHaveBeenCalledWith(DiscoveredPrinterDeviceEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
