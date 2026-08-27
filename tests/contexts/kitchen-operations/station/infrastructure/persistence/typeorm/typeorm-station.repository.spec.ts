import { Repository } from 'typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test, TestingModule } from '@nestjs/testing'

import { TypeOrmStationRepository } from '@contexts/kitchen-operations/station/infrastructure/persistence/typeorm/typeorm-station.repository'
import { StationEntity } from '@contexts/kitchen-operations/station/infrastructure/persistence/typeorm/station.entity'
import { StationId } from '@contexts/kitchen-operations/station/domain/station-id'
import { StationOutputDeviceEnum } from '@contexts/kitchen-operations/station/domain/station-output-device'
import { StationMother } from '@test/contexts/kitchen-operations/station/__mothers__/station.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmStationRepository', () => {
  let repository: TypeOrmStationRepository
  let typeOrmRepo: jest.Mocked<Repository<StationEntity>>

  const buildEntity = (overrides: Partial<StationEntity> = {}): StationEntity => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    return {
      id: UuidMother.random(),
      name: 'Grill',
      displayOrder: 1,
      isActive: true,
      color: '#FF5733',
      outputDevice: StationOutputDeviceEnum.KDS,
      discoveredPrinterDeviceId: null,
      createdAt: now,
      updatedAt: now,
      ...overrides
    } as StationEntity
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmStationRepository,
        {
          provide: getRepositoryToken(StationEntity),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile()

    repository = module.get(TypeOrmStationRepository)
    typeOrmRepo = module.get(getRepositoryToken(StationEntity))
  })

  describe('save', () => {
    it('persists discoveredPrinterDeviceId to the entity column when the station has one assigned', async () => {
      const deviceId = UuidMother.random()
      const station = StationMother.withPrinter(deviceId)
      typeOrmRepo.save.mockResolvedValue(buildEntity())

      await repository.save(station)

      expect(typeOrmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ discoveredPrinterDeviceId: deviceId })
      )
    })

    it('persists a null discoveredPrinterDeviceId when the station has none assigned', async () => {
      const station = StationMother.create({ outputDevice: StationOutputDeviceEnum.KDS })
      typeOrmRepo.save.mockResolvedValue(buildEntity())

      await repository.save(station)

      expect(typeOrmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ discoveredPrinterDeviceId: null })
      )
    })
  })

  describe('search', () => {
    it('reads discoveredPrinterDeviceId back from the entity column and reconstructs the station', async () => {
      const deviceId = UuidMother.random()
      const entity = buildEntity({
        outputDevice: StationOutputDeviceEnum.PRINTER,
        discoveredPrinterDeviceId: deviceId
      })
      typeOrmRepo.findOne.mockResolvedValue(entity)

      const found = await repository.search(new StationId(entity.id))

      expect(found).not.toBeNull()
      expect(found!.toPrimitives().discoveredPrinterDeviceId).toBe(deviceId)
    })

    it('reconstructs a station with a null discoveredPrinterDeviceId when the column is null', async () => {
      const entity = buildEntity({ discoveredPrinterDeviceId: null })
      typeOrmRepo.findOne.mockResolvedValue(entity)

      const found = await repository.search(new StationId(entity.id))

      expect(found).not.toBeNull()
      expect(found!.toPrimitives().discoveredPrinterDeviceId).toBeNull()
    })
  })

  describe('searchAllWithPrinterDevice', () => {
    it('joins the discovered printer device and maps it to a printer summary', async () => {
      const deviceId = UuidMother.random()
      const entity = buildEntity({
        outputDevice: StationOutputDeviceEnum.PRINTER,
        discoveredPrinterDeviceId: deviceId,
        discoveredPrinterDevice: {
          id: deviceId,
          model: 'Epson TM-T20',
          status: 'online',
          address: '192.168.1.50'
        }
      } as Partial<StationEntity>)
      typeOrmRepo.find.mockResolvedValue([entity])

      const [result] = await repository.searchAllWithPrinterDevice()

      expect(typeOrmRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: { discoveredPrinterDevice: true } })
      )
      expect(result.printer).toEqual({
        model: 'Epson TM-T20',
        status: 'online',
        address: '192.168.1.50'
      })
    })

    it('returns a null printer summary when the station has no printer device', async () => {
      const entity = buildEntity({ discoveredPrinterDeviceId: null })
      typeOrmRepo.find.mockResolvedValue([entity])

      const [result] = await repository.searchAllWithPrinterDevice()

      expect(result.printer).toBeNull()
    })
  })
})
