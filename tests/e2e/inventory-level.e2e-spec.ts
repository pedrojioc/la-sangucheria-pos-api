import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { resetDatabase } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * HTTP-boundary spec for the `stock-level` module (design "New e2e —
 * inventory-level", spec requirement "Stock-Level (Inventory-Level) e2e
 * HTTP-Boundary Coverage"). Mirrors `ingredient-category.e2e-spec.ts` — real
 * HTTP request via supertest -> InventoryLevelController -> use cases (direct
 * `.run()` calls, no CQRS bus) -> real Postgres (Testcontainers).
 *
 * Inventory-level rows have no direct create endpoint — they only appear via
 * the `CreateInventoryLevelOnIngredientCreated` subscriber, dispatched
 * synchronously in-transaction when `POST /ingredients` succeeds. Seeding
 * therefore goes through `POST /ingredient-categories` -> `POST /ingredients`.
 *
 * `search`'s response shape is the D3 regression guard from the design: the
 * use case (`SearchInventoryLevelsByCriteria.run()`) returns a NESTED
 * `{ paginated: { data, meta }, stats }` shape, unlike every other migrated
 * module's flat `{ data, meta }`. The controller must reconstruct the flat
 * HTTP contract `{ data, meta, stats }` — this spec asserts `stats` is
 * present alongside `data`/`meta`, which would silently break if the
 * controller mapped `result.data`/`result.meta` instead of
 * `result.paginated.data`/`result.paginated.meta`.
 */
describe('InventoryLevelController (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let http: E2eContext['http']
  let authHeader: E2eContext['authHeader']

  beforeAll(async () => {
    const context = await bootstrapE2eApp()
    app = context.app
    dataSource = context.dataSource
    http = context.http
    authHeader = context.authHeader
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDatabase(dataSource)
  })

  async function seedCategory(): Promise<string> {
    const id = UuidMother.random()
    await http()
      .post('/ingredient-categories')
      .set(...(await authHeader()))
      .send({ id, name: `Categoria ${id.slice(0, 8)}`, isActive: true })
      .expect(201)
    return id
  }

  async function seedUnit(): Promise<string> {
    const id = UuidMother.random()
    await dataSource.query(
      `INSERT INTO units (id, name, symbol, type, is_active) VALUES ($1, $2, $3, 'weight', true)`,
      [id, `unit-${id.slice(0, 8)}`, 'kgt']
    )
    return id
  }

  /**
   * Seeds an ingredient (which triggers `CreateInventoryLevelOnIngredientCreated`
   * synchronously) and returns its id, category id, and unit id. The
   * resulting inventory level starts at `currentQuantity: 0` with no
   * thresholds (`InitializeInventoryLevel`), so callers that need to exercise
   * a stock deduction must bump `current_quantity` directly first.
   */
  async function seedIngredientWithLevel(): Promise<{
    ingredientId: string
    categoryId: string
    unitId: string
  }> {
    const categoryId = await seedCategory()
    const unitId = await seedUnit()
    const ingredientId = UuidMother.random()

    await http()
      .post('/ingredients')
      .set(...(await authHeader()))
      .send({
        id: ingredientId,
        name: `Ingrediente ${ingredientId.slice(0, 8)}`,
        ingredientCategoryId: categoryId,
        unitId,
        isPerishable: true,
        isActive: true
      })
      .expect(201)

    return { ingredientId, categoryId, unitId }
  }

  describe('GET /inventory-levels', () => {
    it('returns a paginated envelope with data, meta, and stats fields', async () => {
      const { ingredientId } = await seedIngredientWithLevel()

      const response = await http()
        .get('/inventory-levels')
        .query({ page: 1, pageSize: 10 })
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(response.body.meta).toMatchObject({ page: 1, pageSize: 10 })
      expect(
        response.body.data.some(
          (item: { ingredientId: string }) => item.ingredientId === ingredientId
        )
      ).toBe(true)
      // D3 regression guard: stats must be present alongside data/meta —
      // proves the controller mapped result.paginated.* and result.stats,
      // not result.data/result.meta (which would compile-fail or return
      // stats: undefined at runtime if types were loosened).
      expect(response.body.stats).toBeDefined()
      expect(response.body.stats).toMatchObject({
        lowStockCount: expect.any(Number),
        criticalStockCount: expect.any(Number),
        outOfStockCount: expect.any(Number)
      })
    })

    it('rejects an unauthenticated request with 401, proving JwtAuthGuard is wired', async () => {
      const response = await http().get('/inventory-levels')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /inventory-levels/summary', () => {
    it('returns alert counts', async () => {
      await seedIngredientWithLevel()

      const response = await http()
        .get('/inventory-levels/summary')
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        totalIngredients: expect.any(Number),
        lowStockCount: expect.any(Number),
        criticalStockCount: expect.any(Number),
        outOfStockCount: expect.any(Number),
        totalInventoryValue: expect.any(Number)
      })
    })
  })

  describe('POST /inventory-levels/:ingredientId/adjustments', () => {
    it('registers a manual adjustment and persists the movement record', async () => {
      const { ingredientId } = await seedIngredientWithLevel()

      // The subscriber initializes the level at currentQuantity: 0, but both
      // manual-adjustment types (ADJUSTMENT, WASTE) are deductions — bump the
      // stock directly so the adjustment has quantity to deduct from.
      await dataSource.query(
        'UPDATE inventory_levels SET current_quantity = 100 WHERE ingredient_id = $1',
        [ingredientId]
      )

      const response = await http()
        .post(`/inventory-levels/${ingredientId}/adjustments`)
        .set(...(await authHeader()))
        .send({ type: 'WASTE', quantity: 5, note: 'Merma de prueba' })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')

      // RegisterManualAdjustment records the InventoryMovement and publishes
      // InventoryMovementCreatedEvent; no subscriber in this bounded context
      // currently decrements inventory_levels.current_quantity in reaction to
      // it (pre-existing behavior, unrelated to and unchanged by this
      // migration) — so only the movement row is asserted here.
      const movementRows = await dataSource.query(
        'SELECT * FROM inventory_movements WHERE ingredient_id = $1',
        [ingredientId]
      )
      expect(movementRows).toHaveLength(1)
      expect(movementRows[0].type).toBe('WASTE')
      expect(Number(movementRows[0].quantity)).toBe(5)
    })

    it('rejects an invalid body with 400, proving ValidationPipe is wired', async () => {
      const { ingredientId } = await seedIngredientWithLevel()

      const response = await http()
        .post(`/inventory-levels/${ingredientId}/adjustments`)
        .set(...(await authHeader()))
        .send({ type: 'NOT_A_TYPE', quantity: -1 })

      expect(response.status).toBe(400)
      expect(Array.isArray(response.body.message)).toBe(true)
      expect(response.body.message.length).toBeGreaterThan(0)
    })
  })
})
