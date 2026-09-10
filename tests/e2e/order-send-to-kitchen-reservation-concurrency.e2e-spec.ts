import { DataSource } from 'typeorm'
import { INestApplication } from '@nestjs/common'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { truncateTables } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * Real-Postgres-only coverage (design "Testing Strategy — E2E concurrency",
 * spec scenario "Concurrent sends for the last unit — only one succeeds").
 * This is the one scenario in the whole change that CANNOT be proven with
 * mocked repositories: it exists specifically to prove the
 * `SELECT ... FOR UPDATE` pessimistic lock acquired in
 * TypeOrmInventoryLevelRepository.findByIngredientForUpdate serializes two
 * concurrent send-to-kitchen requests racing for the same scarce ingredient
 * row, rather than both reading a stale snapshot and over-reserving.
 */
describe('Order send-to-kitchen stock reservation — concurrency (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let http: E2eContext['http']
  let authHeader: E2eContext['authHeader']

  const RESERVATION_TABLES = [
    'stock_reservations',
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

  let ingredientId: string
  let directProductId: string

  const seedLookupData = async (ds: DataSource): Promise<void> => {
    const ingredientCategoryId = UuidMother.random()
    const unitId = UuidMother.random()
    const productCategoryId = UuidMother.random()
    ingredientId = UuidMother.random()
    directProductId = UuidMother.random()
    const shortSuffix = ingredientCategoryId.slice(0, 8)

    await ds.query(
      `INSERT INTO ingredient_categories (id, name, is_active) VALUES ($1, $2, true)`,
      [ingredientCategoryId, `concurrency-cat-${shortSuffix}`]
    )
    await ds.query(
      `INSERT INTO units (id, name, symbol, type, is_active) VALUES ($1, $2, $3, 'weight', true)`,
      [unitId, `concurrency-unit-${shortSuffix}`, 'kgr']
    )
    await ds.query(
      `INSERT INTO ingredients (id, name, ingredient_category_id, unit_id, is_perishable, is_active)
       VALUES ($1, $2, $3, $4, false, true)`,
      [ingredientId, `concurrency-ingredient-${shortSuffix}`, ingredientCategoryId, unitId]
    )
    // Exactly 1 unit available — the scarce resource under test.
    await ds.query(
      `INSERT INTO inventory_levels (id, ingredient_id, current_quantity, unit_id, minimum_quantity)
       VALUES ($1, $2, 1, $3, 0)`,
      [UuidMother.random(), ingredientId, unitId]
    )
    const stationId = UuidMother.random()
    await ds.query(
      `INSERT INTO stations (id, name, display_order, is_active) VALUES ($1, $2, 0, true)`,
      [stationId, `concurrency-station-${shortSuffix}`]
    )
    await ds.query(
      `INSERT INTO product_categories (id, name, display_order, is_active, default_station_id)
       VALUES ($1, $2, 0, true, $3)`,
      [productCategoryId, `concurrency-prodcat-${shortSuffix}`, stationId]
    )
    await ds.query(
      `INSERT INTO products
         (id, name, category_id, ingredient_id, price, is_active, display_order, sku, tags, inventory_strategy_type)
       VALUES ($1, $2, $3, $4, 10000, true, 0, $5, '{}', 'DIRECT')`,
      [
        directProductId,
        'Concurrency Test Product',
        productCategoryId,
        ingredientId,
        `SKU-CC-${shortSuffix}`
      ]
    )
  }

  const openOrderRequiringOneUnit = async (): Promise<{ orderId: string; itemId: string }> => {
    const orderId = UuidMother.random()
    const itemId = UuidMother.random()

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
            id: itemId,
            productId: directProductId,
            productName: 'Concurrency Test Product',
            unitPrice: 10000,
            quantity: 1
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
    await seedLookupData(dataSource)
  })

  it('serializes two concurrent sends for the last unit: exactly one 200, one 422, no over-reservation', async () => {
    const orderA = await openOrderRequiringOneUnit()
    const orderB = await openOrderRequiringOneUnit()

    const auth = await authHeader()

    const [resultA, resultB] = await Promise.allSettled([
      http()
        .post(`/orders/${orderA.orderId}/kitchen`)
        .set(...auth)
        .send({
          ticketId: UuidMother.random(),
          itemIds: [orderA.itemId],
          sentBy: UuidMother.random()
        }),
      http()
        .post(`/orders/${orderB.orderId}/kitchen`)
        .set(...auth)
        .send({
          ticketId: UuidMother.random(),
          itemIds: [orderB.itemId],
          sentBy: UuidMother.random()
        })
    ])

    // Both requests must SETTLE (no deadlock, no timeout, no crash) —
    // Promise.allSettled itself already proves this since it only resolves
    // after every input promise settles; the explicit status check below
    // additionally proves neither one rejected at the HTTP-client level.
    expect(resultA.status).toBe('fulfilled')
    expect(resultB.status).toBe('fulfilled')

    const statusA = resultA.status === 'fulfilled' ? resultA.value.status : -1
    const statusB = resultB.status === 'fulfilled' ? resultB.value.status : -1

    const statuses = [statusA, statusB].sort()
    expect(statuses).toEqual([200, 422])

    // Exactly one ACTIVE reservation exists for the scarce ingredient —
    // proves the lock prevented double-reservation of the same unit.
    const activeReservations = await dataSource.query(
      "SELECT * FROM stock_reservations WHERE ingredient_id = $1 AND status = 'ACTIVE'",
      [ingredientId]
    )
    expect(activeReservations).toHaveLength(1)

    const levelRow = await dataSource.query(
      'SELECT current_quantity FROM inventory_levels WHERE ingredient_id = $1',
      [ingredientId]
    )
    // Physical quantity is untouched by reservation (only deduction at
    // close changes it) — the guard is currentQuantity - activeReserved.
    expect(Number(levelRow[0].current_quantity)).toBe(1)
  })
})
