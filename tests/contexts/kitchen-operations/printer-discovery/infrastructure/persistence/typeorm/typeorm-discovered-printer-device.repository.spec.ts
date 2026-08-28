import { Repository } from 'typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test, TestingModule } from '@nestjs/testing'

import { TypeOrmDiscoveredPrinterDeviceRepository } from '@contexts/kitchen-operations/printer-discovery/infrastructure/persistence/typeorm/typeorm-discovered-printer-device.repository'
import { DiscoveredPrinterDeviceEntity } from '@contexts/kitchen-operations/printer-discovery/infrastructure/persistence/typeorm/discovered-printer-device.entity'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'
import { Uuid } from '@shared/domain/value-objects/uuid'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

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
        UnitOfWorkContextHolder,
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
    it('returns the device when it exists for the given establishment', async () => {
      const entity = buildEntity()
      typeOrmRepo.findOne.mockResolvedValue(entity)

      const found = await repository.findById(entity.id, entity.establishmentId)

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: entity.id, establishmentId: entity.establishmentId }
      })
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

      const found = await repository.findById(Uuid.random().value, EstablishmentId.random().value)

      expect(found).toBeNull()
    })

    it('returns null when the device exists but belongs to a different establishment (cross-tenant lookup)', async () => {
      // The device row itself is never fetched here — the WHERE clause
      // filters by establishmentId at the query level, so a device that
      // exists only for a different establishment behaves identically to a
      // nonexistent device from the caller's perspective (findOne resolves
      // null because no row matches the combined id+establishmentId filter).
      typeOrmRepo.findOne.mockResolvedValue(null)
      const deviceId = Uuid.random().value
      const callerEstablishmentId = EstablishmentId.random().value

      const found = await repository.findById(deviceId, callerEstablishmentId)

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: deviceId, establishmentId: callerEstablishmentId }
      })
      expect(found).toBeNull()
    })
  })
})
