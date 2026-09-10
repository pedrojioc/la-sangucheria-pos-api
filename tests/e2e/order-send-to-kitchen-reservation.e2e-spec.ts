import { DataSource } from 'typeorm'
import { INestApplication } from '@nestjs/common'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { truncateTables } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * HTTP-boundary coverage for the stock-reservation lifecycle this change
 * activates end to end (design "Data Flow", spec requirements
 * "Send-to-Kitchen Validates and Reserves Stock",
 * "Reservation Creation on Send-to-Kitchen",
 * "Availability Validation Rejects Insufficient Stock",
 * "Reservation Release on Cancellation",
 * "Close-Time Deduction Consumes Reservations or Deducts Directly").
 *
 * Arrange stays hand-wired direct SQL inserts for lookup data (ingredient
 * category, unit, ingredient, inventory level+batch, product category,
 * RECIPE product+recipe) — there is no HTTP endpoint that produces this
 * graph, and adding one is out of scope. Act/Assert go through real HTTP
 * requests (`bootstrapE2eApp()`), exercising OrderController/KitchenController,
 * the global guards/interceptors, and real Postgres row locking.
 *
 * Uses a RECIPE-strategy product, not DIRECT: DIRECT deduction hardcodes
 * `DIRECT_DEDUCTION_UNIT_ID = 'unit'` as a non-UUID sentinel string (a
 * pre-existing wart flagged in the design's Open Questions, inherited by
 * this change rather than introduced), which cannot ever match a seeded
 * `inventory_batches.unit_id` (a real `uuid` FK to `units`) — so DIRECT
 * deduction cannot succeed against real Postgres in ANY test, not just this
 * one. RECIPE strategy carries its own real unit UUID per recipe item and
 * exercises the exact same reservation/consume code paths.
 */
describe('Order send-to-kitchen stock reservation (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let http: E2eContext['http']
  let authHeader: E2eContext['authHeader']

  const RESERVATION_TABLES = [
    'stock_reservations',
    'product_recipe_items',
    'product_recipes',
    'inventory_movements',
    'inventory_batches',
    'inventory_levels',
    'products',
    'product_categories',
    'stations',
    'ingredients',
    'ingredient_categories',
    'units',
    'order_items',
    'orders'
  ]

  // Quantity of the ingredient consumed per unit of the finished product —
  // kept at 1 so `reservedQuantity === orderedItemQuantity` and the
  // assertions below stay simple.
  const RECIPE_QUANTITY_PER_UNIT = 1

  let ingredientCategoryId: string
  let unitId: string
  let ingredientId: string
  let productCategoryId: string
  let recipeProductId: string

  const seedLookupData = async (
    ds: DataSource,
    availableQuantity: number
  ): Promise<void> => {
    ingredientCategoryId = UuidMother.random()
    unitId = UuidMother.random()
    ingredientId = UuidMother.random()
    productCategoryId = UuidMother.random()
    recipeProductId = UuidMother.random()

    const shortSuffix = ingredientCategoryId.slice(0, 8)

    await ds.query(
      `INSERT INTO ingredient_categories (id, name, is_active) VALUES ($1, $2, true)`,
      [ingredientCategoryId, `reservation-cat-${shortSuffix}`]
    )
    await ds.query(
      `INSERT INTO units (id, name, symbol, type, is_active) VALUES ($1, $2, $3, 'weight', true)`,
      [unitId, `reservation-unit-${shortSuffix}`, 'kgr']
    )
    await ds.query(
      `INSERT INTO ingredients (id, name, ingredient_category_id, unit_id, is_perishable, is_active)
       VALUES ($1, $2, $3, $4, false, true)`,
      [ingredientId, `reservation-ingredient-${shortSuffix}`, ingredientCategoryId, unitId]
    )
    await ds.query(
      `INSERT INTO inventory_levels (id, ingredient_id, current_quantity, unit_id, minimum_quantity)
       VALUES ($1, $2, $3, $4, 0)`,
      [UuidMother.random(), ingredientId, availableQuantity, unitId]
    )
    // DeductIngredient (used at close-time, both for the consume-reservation
    // path and the legacy direct-deduct fallback) sources quantity from
    // inventory_batches via FIFO, not from inventory_levels directly — both
    // rows must reflect the same available quantity for this seed to be
    // internally consistent.
    await ds.query(
      `INSERT INTO inventory_batches
         (id, ingredient_id, initial_quantity, remaining_quantity, unit_id, unit_cost, currency, purchase_date)
       VALUES ($1, $2, $3, $3, $4, 1000, 'COP', now())`,
      [UuidMother.random(), ingredientId, availableQuantity, unitId]
    )
    const stationId = UuidMother.random()
    await ds.query(
      `INSERT INTO stations (id, name, display_order, is_active) VALUES ($1, $2, 0, true)`,
      [stationId, `reservation-station-${shortSuffix}`]
    )
    await ds.query(
      `INSERT INTO product_categories (id, name, display_order, is_active, default_station_id)
       VALUES ($1, $2, 0, true, $3)`,
      [productCategoryId, `reservation-prodcat-${shortSuffix}`, stationId]
    )
    await ds.query(
      `INSERT INTO products
         (id, name, category_id, price, is_active, display_order, sku, tags, inventory_strategy_type)
       VALUES ($1, $2, $3, 10000, true, 0, $4, '{}', 'RECIPE')`,
      [recipeProductId, 'Reservation Test Product', productCategoryId, `SKU-${shortSuffix}`]
    )
    const recipeId = UuidMother.random()
    await ds.query(`INSERT INTO product_recipes (id, product_id) VALUES ($1, $2)`, [
      recipeId,
      recipeProductId
    ])
    await ds.query(
      `INSERT INTO product_recipe_items (product_recipe_id, ingredient_id, quantity, unit_id, sort_order)
       VALUES ($1, $2, $3, $4, 0)`,
      [recipeId, ingredientId, RECIPE_QUANTITY_PER_UNIT, unitId]
    )
  }

  const openOrderWithPendingItem = async (
    quantity: number
  ): Promise<{ orderId: string; itemId: string }> => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()

    await http()
      .post('/orders')
      .set(...(await authHeader()))
      .send({
        id: orderId,
        type: 'TAKEOUT',
        openedBy: UuidMother.random()
      })
      .expect(201)

    await http()
      .post(`/orders/${orderId}/items`)
      .set(...(await authHeader()))
      .send({
        items: [
          {
            id: itemId,
            productId: recipeProductId,
            productName: 'Reservation Test Product',
            unitPrice: 10000,
            quantity
          }
        ]
      })
      .expect(200)

    return { orderId, itemId }
  }

  beforeAll(async () => {
    const context = await bootstrapE2eApp()
    app = context.app
    dataSource = context.dataSource
    http = context.http
    authHeader = context.authHeader

    // OpenOrder requires EstablishmentSettingsPort to resolve, which throws
    // EstablishmentNotConfigured until the setup wizard has run once.
    await http()
      .post('/establishment/settings')
      .set(...(await authHeader()))
      .send({
        id: UuidMother.random(),
        name: 'La Sanguchería',
        displayName: 'La Sanguchería',
        legalName: 'La Sanguchería SAS',
        taxId: '900123456-1',
        defaultCurrency: 'COP',
        defaultTaxRate: 0.19,
        defaultTaxType: 'IVA',
        taxInclusive: true,
        timezone: 'America/Bogota',
        locale: 'es-CO',
        loyaltyEnabled: false
      })
  })

  afterAll(async () => {
    await truncateTables(dataSource, RESERVATION_TABLES)
    await app.close()
  })

  beforeEach(async () => {
    await truncateTables(dataSource, RESERVATION_TABLES)
  })

  it('creates ticket and reservation together atomically when stock is sufficient', async () => {
    await seedLookupData(dataSource, 10)
    const { orderId, itemId } = await openOrderWithPendingItem(2)

    const response = await http()
      .post(`/orders/${orderId}/kitchen`)
      .set(...(await authHeader()))
      .send({
        ticketId: UuidMother.random(),
        itemIds: [itemId],
        sentBy: UuidMother.random()
      })

    expect(response.status).toBe(200)

    const reservationRows = await dataSource.query(
      'SELECT * FROM stock_reservations WHERE order_id = $1 AND item_id = $2',
      [orderId, itemId]
    )
    expect(reservationRows).toHaveLength(1)
    expect(reservationRows[0].status).toBe('ACTIVE')
    expect(Number(reservationRows[0].quantity)).toBe(2)
    expect(reservationRows[0].ingredient_id).toBe(ingredientId)

    const itemRow = await dataSource.query('SELECT status FROM order_items WHERE id = $1', [
      itemId
    ])
    expect(itemRow[0].status).toBe('SENT')
  })

  it('rejects the whole send with 422 and creates zero reservations when stock is insufficient', async () => {
    await seedLookupData(dataSource, 1)
    const { orderId, itemId } = await openOrderWithPendingItem(2)

    const response = await http()
      .post(`/orders/${orderId}/kitchen`)
      .set(...(await authHeader()))
      .send({
        ticketId: UuidMother.random(),
        itemIds: [itemId],
        sentBy: UuidMother.random()
      })

    expect(response.status).toBe(422)
    expect(response.body.error).toBe('InsufficientStockForReservation')

    const reservationRows = await dataSource.query(
      'SELECT * FROM stock_reservations WHERE order_id = $1',
      [orderId]
    )
    expect(reservationRows).toHaveLength(0)

    const itemRow = await dataSource.query('SELECT status FROM order_items WHERE id = $1', [
      itemId
    ])
    expect(itemRow[0].status).toBe('PENDING')
  })

  it('releases the reservation and restores availability when the item is cancelled', async () => {
    await seedLookupData(dataSource, 10)
    const { orderId, itemId } = await openOrderWithPendingItem(3)

    await http()
      .post(`/orders/${orderId}/kitchen`)
      .set(...(await authHeader()))
      .send({ ticketId: UuidMother.random(), itemIds: [itemId], sentBy: UuidMother.random() })
      .expect(200)

    const activeBeforeCancel = await dataSource.query(
      "SELECT * FROM stock_reservations WHERE order_id = $1 AND item_id = $2 AND status = 'ACTIVE'",
      [orderId, itemId]
    )
    expect(activeBeforeCancel).toHaveLength(1)

    const cancelResponse = await http()
      .post(`/orders/${orderId}/items/${itemId}/cancel`)
      .set(...(await authHeader()))
      .send({ reason: 'Customer changed mind', cancelledBy: UuidMother.random() })

    expect(cancelResponse.status).toBe(200)

    const reservationRows = await dataSource.query(
      'SELECT * FROM stock_reservations WHERE order_id = $1 AND item_id = $2',
      [orderId, itemId]
    )
    expect(reservationRows).toHaveLength(1)
    expect(reservationRows[0].status).toBe('RELEASED')

    // Re-cancelling is a no-op: no error, no duplicate rows, no second release
    const secondCancel = await http()
      .post(`/orders/${orderId}/items/${itemId}/cancel`)
      .set(...(await authHeader()))
      .send({ reason: 'Customer changed mind', cancelledBy: UuidMother.random() })
    // OrderItem is already CANCELLED — the item-level state machine itself
    // rejects re-cancellation before the reservation subscriber ever runs.
    expect([200, 400, 409, 422]).toContain(secondCancel.status)

    const reservationRowsAfterSecond = await dataSource.query(
      'SELECT * FROM stock_reservations WHERE order_id = $1 AND item_id = $2',
      [orderId, itemId]
    )
    expect(reservationRowsAfterSecond).toHaveLength(1)
    expect(reservationRowsAfterSecond[0].status).toBe('RELEASED')
  })

  it('releases all remaining ACTIVE reservations when the whole order is cancelled', async () => {
    await seedLookupData(dataSource, 10)
    const { orderId, itemId } = await openOrderWithPendingItem(2)

    await http()
      .post(`/orders/${orderId}/kitchen`)
      .set(...(await authHeader()))
      .send({ ticketId: UuidMother.random(), itemIds: [itemId], sentBy: UuidMother.random() })
      .expect(200)

    const cancelResponse = await http()
      .post(`/orders/${orderId}/cancel`)
      .set(...(await authHeader()))
      .send({ reason: 'Kitchen closed', cancelledBy: UuidMother.random() })

    expect(cancelResponse.status).toBe(200)

    const reservationRows = await dataSource.query(
      'SELECT * FROM stock_reservations WHERE order_id = $1',
      [orderId]
    )
    expect(reservationRows).toHaveLength(1)
    expect(reservationRows[0].status).toBe('RELEASED')
  })

  it('consumes the reservation at close (no re-resolve, no double-deduct) for a sent item', async () => {
    await seedLookupData(dataSource, 10)
    const { orderId, itemId } = await openOrderWithPendingItem(2)

    await http()
      .post(`/orders/${orderId}/kitchen`)
      .set(...(await authHeader()))
      .send({ ticketId: UuidMother.random(), itemIds: [itemId], sentBy: UuidMother.random() })
      .expect(200)

    const levelBeforeClose = await dataSource.query(
      'SELECT current_quantity FROM inventory_levels WHERE ingredient_id = $1',
      [ingredientId]
    )
    expect(Number(levelBeforeClose[0].current_quantity)).toBe(10)

    const closeResponse = await http()
      .post(`/orders/${orderId}/close`)
      .set(...(await authHeader()))
      .send({
        payments: [{ method: 'CASH', amount: 20000 }],
        closedBy: UuidMother.random(),
        tipSelection: { kind: 'NONE' }
      })

    expect(closeResponse.status).toBe(200)

    const reservationRows = await dataSource.query(
      'SELECT * FROM stock_reservations WHERE order_id = $1 AND item_id = $2',
      [orderId, itemId]
    )
    expect(reservationRows).toHaveLength(1)
    expect(reservationRows[0].status).toBe('CONSUMED')

    const levelAfterClose = await dataSource.query(
      'SELECT current_quantity FROM inventory_levels WHERE ingredient_id = $1',
      [ingredientId]
    )
    // 10 - 2 (reserved snapshot quantity) = 8; deducted exactly once.
    expect(Number(levelAfterClose[0].current_quantity)).toBe(8)

    const movementRows = await dataSource.query(
      "SELECT * FROM inventory_movements WHERE ingredient_id = $1 AND type = 'SALE'",
      [ingredientId]
    )
    expect(movementRows).toHaveLength(1)
  })

  it('still direct-deducts a PENDING item that was never sent to kitchen', async () => {
    await seedLookupData(dataSource, 10)

    // Order needs to reach IN_PROGRESS/READY to be closeable at all
    // (Order.close() rejects from OPEN) — so it carries two items: one is
    // sent to kitchen (transitions the order, gets a reservation consumed
    // at close), the other stays PENDING the whole time and must still be
    // direct-deducted at close, proving the fallback path fires per-item
    // rather than being gated by the order's own status.
    const orderId = UuidMother.random()
    const sentItemId = UuidMother.random()
    const pendingItemId = UuidMother.random()

    await http()
      .post('/orders')
      .set(...(await authHeader()))
      .send({ id: orderId, type: 'TAKEOUT', openedBy: UuidMother.random() })
      .expect(201)

    await http()
      .post(`/orders/${orderId}/items`)
      .set(...(await authHeader()))
      .send({
        items: [
          {
            id: sentItemId,
            productId: recipeProductId,
            productName: 'Reservation Test Product',
            unitPrice: 10000,
            quantity: 2
          },
          {
            id: pendingItemId,
            productId: recipeProductId,
            productName: 'Reservation Test Product',
            unitPrice: 10000,
            quantity: 3
          }
        ]
      })
      .expect(200)

    await http()
      .post(`/orders/${orderId}/kitchen`)
      .set(...(await authHeader()))
      .send({ ticketId: UuidMother.random(), itemIds: [sentItemId], sentBy: UuidMother.random() })
      .expect(200)

    const closeResponse = await http()
      .post(`/orders/${orderId}/close`)
      .set(...(await authHeader()))
      .send({
        payments: [{ method: 'CASH', amount: 50000 }],
        closedBy: UuidMother.random(),
        tipSelection: { kind: 'NONE' }
      })

    expect(closeResponse.status).toBe(200)

    const pendingItemReservations = await dataSource.query(
      'SELECT * FROM stock_reservations WHERE order_id = $1 AND item_id = $2',
      [orderId, pendingItemId]
    )
    expect(pendingItemReservations).toHaveLength(0)

    const sentItemReservations = await dataSource.query(
      'SELECT * FROM stock_reservations WHERE order_id = $1 AND item_id = $2',
      [orderId, sentItemId]
    )
    expect(sentItemReservations).toHaveLength(1)
    expect(sentItemReservations[0].status).toBe('CONSUMED')

    const levelAfterClose = await dataSource.query(
      'SELECT current_quantity FROM inventory_levels WHERE ingredient_id = $1',
      [ingredientId]
    )
    // 10 - 2 (consumed reservation) - 3 (direct fallback deduction) = 5.
    expect(Number(levelAfterClose[0].current_quantity)).toBe(5)

    const movementRows = await dataSource.query(
      "SELECT * FROM inventory_movements WHERE ingredient_id = $1 AND type = 'SALE'",
      [ingredientId]
    )
    // One movement from the reservation consume path, one from the direct
    // fallback path — exactly two, never double-counted for either item.
    expect(movementRows).toHaveLength(2)
  })
})
