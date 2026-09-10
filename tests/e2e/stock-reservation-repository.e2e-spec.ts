import { DataSource } from 'typeorm'
import { INestApplication } from '@nestjs/common'

import { StockReservationEntity } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/stock-reservation.entity'
import { TypeOrmStockReservationRepository } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/typeorm-stock-reservation.repository'
import { StockReservation } from '@contexts/inventory/stock-level/domain/stock-reservation'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { truncateTables } from './support/truncate'

/**
 * Deferred (task 1.7) e2e coverage for TypeOrmStockReservationRepository
 * against real Postgres — covers what unit tests with a mocked repository
 * cannot: the raw SUM aggregation query (sumActiveByIngredient) and the
 * unique-constraint duplicate-reserve guard on (order_id, item_id,
 * ingredient_id), both defined only at the database layer.
 *
 * Hand-wired directly against the container-backed DataSource (mirrors
 * purchase-reception-atomicity.e2e-spec.ts's pattern) — there is no single
 * HTTP endpoint that exercises this repository in isolation from the rest
 * of the reservation lifecycle.
 */
describe('TypeOrmStockReservationRepository (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let repository: TypeOrmStockReservationRepository

  const TABLES = ['stock_reservations']

  beforeAll(async () => {
    const context: E2eContext = await bootstrapE2eApp()
    app = context.app
    dataSource = context.dataSource

    const uow = new UnitOfWorkContextHolder()
    const entityRepository = dataSource.getRepository(StockReservationEntity)
    repository = new TypeOrmStockReservationRepository(entityRepository, uow)
  })

  afterAll(async () => {
    await truncateTables(dataSource, TABLES)
    await app.close()
  })

  beforeEach(async () => {
    await truncateTables(dataSource, TABLES)
  })

  describe('sumActiveByIngredient', () => {
    it('returns 0 when there are no reservations for the ingredient', async () => {
      const ingredientId = UuidMother.random()

      const sum = await repository.sumActiveByIngredient(new IngredientId(ingredientId))

      expect(sum).toBe(0)
    })

    it('sums only ACTIVE reservations for the given ingredient, ignoring RELEASED/CONSUMED and other ingredients', async () => {
      const ingredientId = UuidMother.random()
      const otherIngredientId = UuidMother.random()
      const orderId = UuidMother.random()

      const active1 = StockReservation.create(
        UuidMother.random(),
        orderId,
        UuidMother.random(),
        ingredientId,
        3,
        'unit'
      )
      const active2 = StockReservation.create(
        UuidMother.random(),
        orderId,
        UuidMother.random(),
        ingredientId,
        4,
        'unit'
      )
      const released = StockReservation.create(
        UuidMother.random(),
        orderId,
        UuidMother.random(),
        ingredientId,
        100,
        'unit'
      )
      released.release()
      const otherIngredientReservation = StockReservation.create(
        UuidMother.random(),
        orderId,
        UuidMother.random(),
        otherIngredientId,
        50,
        'unit'
      )

      await repository.save(active1)
      await repository.save(active2)
      await repository.save(released)
      await repository.save(otherIngredientReservation)

      const sum = await repository.sumActiveByIngredient(new IngredientId(ingredientId))

      expect(sum).toBe(7)
    })
  })

  describe('unique-constraint duplicate-reserve guard', () => {
    it('rejects a second insert with the same (order_id, item_id, ingredient_id)', async () => {
      const orderId = UuidMother.random()
      const itemId = UuidMother.random()
      const ingredientId = UuidMother.random()

      const first = StockReservation.create(
        UuidMother.random(),
        orderId,
        itemId,
        ingredientId,
        2,
        'unit'
      )
      await repository.save(first)

      const duplicate = StockReservation.create(
        UuidMother.random(),
        orderId,
        itemId,
        ingredientId,
        5,
        'unit'
      )

      await expect(repository.save(duplicate)).rejects.toThrow()
    })

    it('allows the same ingredient reserved for two different items on the same order', async () => {
      const orderId = UuidMother.random()
      const ingredientId = UuidMother.random()

      const forItem1 = StockReservation.create(
        UuidMother.random(),
        orderId,
        UuidMother.random(),
        ingredientId,
        2,
        'unit'
      )
      const forItem2 = StockReservation.create(
        UuidMother.random(),
        orderId,
        UuidMother.random(),
        ingredientId,
        3,
        'unit'
      )

      await repository.save(forItem1)
      await expect(repository.save(forItem2)).resolves.not.toThrow()
    })
  })

  describe('findActiveByOrderItem / findActiveByOrder', () => {
    it('returns only ACTIVE rows scoped to (orderId, itemId)', async () => {
      const orderId = UuidMother.random()
      const itemId = UuidMother.random()
      const otherItemId = UuidMother.random()
      const ingredientId = UuidMother.random()

      const active = StockReservation.create(
        UuidMother.random(),
        orderId,
        itemId,
        ingredientId,
        1,
        'unit'
      )
      const otherItemActive = StockReservation.create(
        UuidMother.random(),
        orderId,
        otherItemId,
        ingredientId,
        1,
        'unit'
      )

      await repository.save(active)
      await repository.save(otherItemActive)

      const result = await repository.findActiveByOrderItem(orderId, itemId)

      expect(result).toHaveLength(1)
      expect(result[0].toPrimitives().itemId).toBe(itemId)
    })

    it('returns only ACTIVE rows for the whole order', async () => {
      const orderId = UuidMother.random()
      const ingredientId = UuidMother.random()

      const active = StockReservation.create(
        UuidMother.random(),
        orderId,
        UuidMother.random(),
        ingredientId,
        1,
        'unit'
      )
      const released = StockReservation.create(
        UuidMother.random(),
        orderId,
        UuidMother.random(),
        ingredientId,
        1,
        'unit'
      )
      released.release()

      await repository.save(active)
      await repository.save(released)

      const result = await repository.findActiveByOrder(orderId)

      expect(result).toHaveLength(1)
      expect(result[0].toPrimitives().status).toBe('ACTIVE')
    })
  })
})
