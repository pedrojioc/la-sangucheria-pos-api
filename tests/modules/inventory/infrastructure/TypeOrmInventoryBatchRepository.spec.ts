import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeOrmInventoryBatchRepository } from '@contexts/inventory/batch/infrastructure/persistence/typeorm/typeorm-inventory-batch.repository'
import { InventoryBatchEntity } from '@contexts/inventory/batch/infrastructure/persistence/typeorm/inventory-batch.entity'
import { InventoryBatchMother } from '../__mothers__/InventoryBatchMother'
import { InventoryBatchId } from '@contexts/inventory/batch/domain/inventory-batch-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmInventoryBatchRepository (Integration)', () => {
  let repository: TypeOrmInventoryBatchRepository
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE_TEST || 'lasangucheria_test',
          entities: [InventoryBatchEntity],
          synchronize: true,
          dropSchema: true
        }),
        TypeOrmModule.forFeature([InventoryBatchEntity])
      ],
      providers: [TypeOrmInventoryBatchRepository]
    }).compile()

    repository = module.get<TypeOrmInventoryBatchRepository>(
      TypeOrmInventoryBatchRepository
    )
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean database before each test
    const repo = module.get('InventoryBatchEntityRepository')
    await repo.clear()
  })

  describe('save', () => {
    it('should persist a new batch', async () => {
      const batch = InventoryBatchMother.random()

      await repository.save(batch)

      const found = await repository.search(batch.id)
      expect(found).not.toBeNull()
      expect(found!.id.value).toBe(batch.id.value)
    })

    it('should update an existing batch', async () => {
      const batch = InventoryBatchMother.create({
        availableQuantity: 100
      })

      await repository.save(batch)

      // Consume some quantity
      const primitives = batch.toPrimitives()
      const updatedBatch = InventoryBatchMother.create({
        ...primitives,
        availableQuantity: 50
      })

      await repository.save(updatedBatch)

      const found = await repository.search(batch.id)
      expect(found!.toPrimitives().availableQuantity).toBe(50)
    })
  })

  describe('search', () => {
    it('should find a batch by id', async () => {
      const batch = InventoryBatchMother.random()

      await repository.save(batch)

      const found = await repository.search(batch.id)

      expect(found).not.toBeNull()
      expect(found!.id.value).toBe(batch.id.value)
    })

    it('should return null when batch does not exist', async () => {
      const found = await repository.search(
        new InventoryBatchId(UuidMother.random())
      )

      expect(found).toBeNull()
    })
  })

  describe('findAvailableByIngredient', () => {
    it('should find all available batches for an ingredient', async () => {
      const ingredientId = UuidMother.random()
      const batch1 = InventoryBatchMother.create({
        ingredientId,
        availableQuantity: 50
      })
      const batch2 = InventoryBatchMother.create({
        ingredientId,
        availableQuantity: 30
      })

      await repository.save(batch1)
      await repository.save(batch2)

      const batches = await repository.findAvailableByIngredient(
        new IngredientId(ingredientId)
      )

      expect(batches).toHaveLength(2)
    })

    it('should exclude fully consumed batches', async () => {
      const ingredientId = UuidMother.random()
      const batch1 = InventoryBatchMother.create({
        ingredientId,
        availableQuantity: 50
      })
      const batch2 = InventoryBatchMother.create({
        ingredientId,
        availableQuantity: 0
      })

      await repository.save(batch1)
      await repository.save(batch2)

      const batches = await repository.findAvailableByIngredient(
        new IngredientId(ingredientId)
      )

      expect(batches).toHaveLength(1)
      expect(batches[0].id.value).toBe(batch1.id.value)
    })

    it('should return batches ordered by receivedAt (FIFO)', async () => {
      const ingredientId = UuidMother.random()
      const batch1 = InventoryBatchMother.create({
        ingredientId,
        receivedAt: new Date('2024-01-03')
      })
      const batch2 = InventoryBatchMother.create({
        ingredientId,
        receivedAt: new Date('2024-01-01')
      })
      const batch3 = InventoryBatchMother.create({
        ingredientId,
        receivedAt: new Date('2024-01-02')
      })

      await repository.save(batch1)
      await repository.save(batch2)
      await repository.save(batch3)

      const batches = await repository.findAvailableByIngredient(
        new IngredientId(ingredientId)
      )

      expect(batches).toHaveLength(3)
      expect(batches[0].toPrimitives().receivedAt).toEqual(new Date('2024-01-01'))
      expect(batches[1].toPrimitives().receivedAt).toEqual(new Date('2024-01-02'))
      expect(batches[2].toPrimitives().receivedAt).toEqual(new Date('2024-01-03'))
    })
  })

  describe('findExpiredBatches', () => {
    it('should find batches that have expired', async () => {
      const expiredBatch = InventoryBatchMother.expired()
      const validBatch = InventoryBatchMother.expiresIn(30)

      await repository.save(expiredBatch)
      await repository.save(validBatch)

      const expiredBatches = await repository.findExpiredBatches()

      expect(expiredBatches).toHaveLength(1)
      expect(expiredBatches[0].id.value).toBe(expiredBatch.id.value)
    })

    it('should not include batches without expiry date', async () => {
      const expiredBatch = InventoryBatchMother.expired()
      const noExpiryBatch = InventoryBatchMother.withoutExpiry()

      await repository.save(expiredBatch)
      await repository.save(noExpiryBatch)

      const expiredBatches = await repository.findExpiredBatches()

      expect(expiredBatches).toHaveLength(1)
    })
  })
})
