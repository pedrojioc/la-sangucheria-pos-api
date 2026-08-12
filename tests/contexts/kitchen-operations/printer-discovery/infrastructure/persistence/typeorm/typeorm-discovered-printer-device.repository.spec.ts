import { Repository } from 'typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test, TestingModule } from '@nestjs/testing'

import { TypeOrmDiscoveredPrinterDeviceRepository } from '@contexts/kitchen-operations/printer-discovery/infrastructure/persistence/typeorm/typeorm-discovered-printer-device.repository'
import { DiscoveredPrinterDeviceEntity } from '@contexts/kitchen-operations/printer-discovery/infrastructure/persistence/typeorm/discovered-printer-device.entity'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'
import { Uuid } from '@shared/domain/value-objects/uuid'

describe('TypeOrmDiscoveredPrinterDeviceRepository', () => {
  let repository: TypeOrmDiscoveredPrinterDeviceRepository
  let typeOrmRepo: jest.Mocked<Repository<DiscoveredPrinterDeviceEntity>>

  const buildEntity = (
    overrides: Partial<DiscoveredPrinterDeviceEntity> = {}
  ): DiscoveredPrinterDeviceEntity => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    return {
      id: Uuid.random().value,
      establishmentId: EstablishmentId.random().value,
      connectionType: 'network',
      address: '192.168.1.50',
      usbIdentifier: null,
      model: 'EPSON TM-T20',
      lastSeenAt: now,
      status: 'unknown',
      statusUpdatedAt: null,
      createdAt: now,
      updatedAt: now,
      ...overrides
    } as DiscoveredPrinterDeviceEntity
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmDiscoveredPrinterDeviceRepository,
        {
          provide: getRepositoryToken(DiscoveredPrinterDeviceEntity),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn()
          }
        }
      ]
    }).compile()

    repository = module.get(TypeOrmDiscoveredPrinterDeviceRepository)
    typeOrmRepo = module.get(getRepositoryToken(DiscoveredPrinterDeviceEntity))
  })

  describe('findById', () => {
    it('returns the device when it exists', async () => {
      const entity = buildEntity()
      typeOrmRepo.findOne.mockResolvedValue(entity)

      const found = await repository.findById(entity.id)

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({ where: { id: entity.id } })
      expect(found).not.toBeNull()
      expect(found!.toPrimitives()).toEqual({
        id: entity.id,
        establishmentId: entity.establishmentId,
        connectionType: entity.connectionType,
        address: entity.address,
        usbIdentifier: entity.usbIdentifier,
        model: entity.model,
        lastSeenAt: entity.lastSeenAt,
        status: entity.status,
        statusUpdatedAt: entity.statusUpdatedAt
      })
    })

    it('returns null when the device does not exist', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null)

      const found = await repository.findById(Uuid.random().value)

      expect(found).toBeNull()
    })
  })
})
