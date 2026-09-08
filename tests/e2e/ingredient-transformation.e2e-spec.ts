import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { resetDatabase } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * HTTP-boundary e2e spec for `ingredient-transformation` (design "Phase 1:
 * E2E Regression Net" / "ingredient-transformation.e2e-spec.ts fixture
 * plan", spec requirement "Ingredient-Transformation e2e HTTP-Boundary
 * Coverage"). The heaviest fixture of the three Phase 1 specs — exercises
 * `RegisterTransformation`'s FIFO deduction + stock-increase unit of work.
 *
 * Written and merged GREEN against the pre-migration CQRS-wired code
 * (design D5) — this is the regression net Phase 3 (transformation
 * migration) must keep passing UNMODIFIED.
 *
 * `seedIngredientWithLevel()` in `inventory-level.e2e-spec.ts` is a
 * file-local closure, not exported — its shape is copied here rather than
 * imported (design fixture plan). ONE unit id is reused for both the base
 * and output ingredients, because `RegisterTransformation` throws
 * `InputUnitMismatchException`/`OutputUnitMismatchException` unless the
 * request's `inputUnitId`/`outputUnitId` match each ingredient's `unitId`.
 *
 * Stock for the base ingredient is seeded via a direct
 * `INSERT INTO inventory_batches` + `UPDATE inventory_levels` (same direct-
 * SQL precedent `inventory-level.e2e-spec.ts` sets for bumping
 * `current_quantity`) — creating the ingredient alone leaves its inventory
 * level at 0 (via `CreateInventoryLevelOnIngredientCreated`), and
 * `deductIngredient` throws `NoStockAvailableException` when
 * `findAvailableByIngredient` returns no batches, before `level.decrease(...)`
 * ever runs. `purchase-reception-atomicity.e2e-spec.ts`'s HTTP reception flow
 * requires purchase orders + suppliers and is heavier than this direct
 * insert, so the direct-SQL path is used per the design's stated preference.
 */
describe('IngredientTransformationController (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let http: E2eContext['http']
  let authHeader: E2eContext['authHeader']

  const DEFAULT_USER_ID = '11111111-1111-4111-8111-111111111111'

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

  async function seedIngredient(unitId: string, categoryId: string): Promise<string> {
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

    return ingredientId
  }

  /**
   * Inserts an available inventory batch for the base ingredient and bumps
   * `inventory_levels.current_quantity` to match, so
   * `findAvailableByIngredient` returns a non-exhausted batch and
   * `level.decrease(...)` has stock to deduct from.
   */
  async function seedStock(ingredientId: string, unitId: string, quantity: number): Promise<void> {
    const batchId = UuidMother.random()
    await dataSource.query(
      `INSERT INTO inventory_batches
         (id, ingredient_id, initial_quantity, remaining_quantity, unit_id, unit_cost, currency, purchase_date)
       VALUES ($1, $2, $3, $3, $4, 1000, 'COP', now())`,
      [batchId, ingredientId, quantity, unitId]
    )
    await dataSource.query(
      'UPDATE inventory_levels SET current_quantity = $1 WHERE ingredient_id = $2',
      [quantity, ingredientId]
    )
  }

  /**
   * Builds the full fixture chain: one shared unit, a base + output
   * ingredient on that unit, a single-ingredient preparation recipe
   * (`additionalIngredients: []` keeps the FIFO cost loop to one
   * ingredient), and seeded stock for the base ingredient.
   */
  async function seedTransformationFixture(stockQuantity = 10): Promise<{
    unitId: string
    baseIngredientId: string
    outputIngredientId: string
    recipeId: string
  }> {
    const categoryId = await seedCategory()
    const unitId = await seedUnit()
    const baseIngredientId = await seedIngredient(unitId, categoryId)
    const outputIngredientId = await seedIngredient(unitId, categoryId)

    const recipeId = UuidMother.random()
    await http()
      .post('/preparation-recipes')
      .set(...(await authHeader()))
      .send({
        id: recipeId,
        name: `Preparacion ${recipeId.slice(0, 8)}`,
        baseIngredientId,
        outputIngredientId,
        yieldPercentage: 50,
        additionalIngredients: []
      })
      .expect(201)

    if (stockQuantity > 0) {
      await seedStock(baseIngredientId, unitId, stockQuantity)
    }

    return { unitId, baseIngredientId, outputIngredientId, recipeId }
  }

  describe('POST /ingredient-transformations', () => {
    it('rejects an unauthenticated request with 401, proving JwtAuthGuard is wired', async () => {
      const { unitId, recipeId } = await seedTransformationFixture()

      const response = await http().post('/ingredient-transformations').send({
        id: UuidMother.random(),
        recipeId,
        inputQuantity: 2,
        inputUnitId: unitId,
        outputQuantity: 1,
        outputUnitId: unitId
      })

      expect(response.status).toBe(401)
    })

    it('registers the transformation, deducts FIFO stock, and increases output stock', async () => {
      const { unitId, baseIngredientId, outputIngredientId, recipeId } =
        await seedTransformationFixture(10)
      const id = UuidMother.random()

      const response = await http()
        .post('/ingredient-transformations')
        .set(...(await authHeader()))
        .send({
          id,
          recipeId,
          inputQuantity: 3,
          inputUnitId: unitId,
          outputQuantity: 1.5,
          outputUnitId: unitId,
          notes: 'Transformacion de prueba'
        })

      expect(response.status).toBe(201)

      const transformationRows = await dataSource.query(
        'SELECT * FROM ingredient_transformations WHERE id = $1',
        [id]
      )
      expect(transformationRows).toHaveLength(1)
      expect(Number(transformationRows[0].input_quantity)).toBe(3)
      expect(Number(transformationRows[0].output_quantity)).toBe(1.5)

      const baseLevelRows = await dataSource.query(
        'SELECT * FROM inventory_levels WHERE ingredient_id = $1',
        [baseIngredientId]
      )
      expect(Number(baseLevelRows[0].current_quantity)).toBe(7)

      const outputLevelRows = await dataSource.query(
        'SELECT * FROM inventory_levels WHERE ingredient_id = $1',
        [outputIngredientId]
      )
      expect(Number(outputLevelRows[0].current_quantity)).toBe(1.5)
    })

    it('persists performed_by as the authenticated userId and notes as the submitted value, and never swaps them (D3 regression guard)', async () => {
      const { unitId, recipeId } = await seedTransformationFixture(10)
      const id = UuidMother.random()
      const notes = 'Notas especificas de esta transformacion'

      await http()
        .post('/ingredient-transformations')
        .set(...(await authHeader()))
        .send({
          id,
          recipeId,
          inputQuantity: 2,
          inputUnitId: unitId,
          outputQuantity: 1,
          outputUnitId: unitId,
          notes
        })
        .expect(201)

      const rows = await dataSource.query(
        'SELECT performed_by, notes FROM ingredient_transformations WHERE id = $1',
        [id]
      )
      expect(rows).toHaveLength(1)
      expect(rows[0].performed_by).toBe(DEFAULT_USER_ID)
      expect(rows[0].notes).toBe(notes)
      expect(rows[0].performed_by).not.toBe(rows[0].notes)
    })

    it('rejects a register request with insufficient seeded stock and persists no changes', async () => {
      // stockQuantity: 0 -> no inventory_batches row seeded, so
      // findAvailableByIngredient returns [] and deductIngredient throws
      // NoStockAvailableException (BusinessRuleViolationException -> 422
      // via DomainExceptionFilter) before any write happens.
      const { unitId, baseIngredientId, outputIngredientId, recipeId } =
        await seedTransformationFixture(0)

      const batchesBefore = await dataSource.query(
        'SELECT * FROM inventory_batches WHERE ingredient_id = $1',
        [baseIngredientId]
      )
      const levelBefore = await dataSource.query(
        'SELECT current_quantity FROM inventory_levels WHERE ingredient_id = $1',
        [baseIngredientId]
      )

      const response = await http()
        .post('/ingredient-transformations')
        .set(...(await authHeader()))
        .send({
          id: UuidMother.random(),
          recipeId,
          inputQuantity: 2,
          inputUnitId: unitId,
          outputQuantity: 1,
          outputUnitId: unitId
        })

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.status).toBeLessThan(500)

      const batchesAfter = await dataSource.query(
        'SELECT * FROM inventory_batches WHERE ingredient_id = $1',
        [baseIngredientId]
      )
      const levelAfter = await dataSource.query(
        'SELECT current_quantity FROM inventory_levels WHERE ingredient_id = $1',
        [baseIngredientId]
      )
      const outputLevelAfter = await dataSource.query(
        'SELECT current_quantity FROM inventory_levels WHERE ingredient_id = $1',
        [outputIngredientId]
      )

      expect(batchesAfter).toEqual(batchesBefore)
      expect(levelAfter).toEqual(levelBefore)
      expect(Number(outputLevelAfter[0].current_quantity)).toBe(0)

      const transformationRows = await dataSource.query(
        'SELECT * FROM ingredient_transformations WHERE recipe_id = $1',
        [recipeId]
      )
      expect(transformationRows).toHaveLength(0)
    })
  })
})
