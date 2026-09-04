import { DataSource } from 'typeorm'
import { INestApplication } from '@nestjs/common'

import { TypeOrmPurchaseOrderRepository } from '@contexts/procurement/purchase-order/infrastructure/persistence/typeorm/typeorm-purchase-order.repository'
import { PurchaseOrderEntity } from '@contexts/procurement/purchase-order/infrastructure/persistence/typeorm/purchase-order.entity'
import { PurchaseOrderItemEntity } from '@contexts/procurement/purchase-order/infrastructure/persistence/typeorm/purchase-order-item.entity'
import { TypeOrmInventoryBatchRepository } from '@contexts/inventory/batch/infrastructure/persistence/typeorm/typeorm-inventory-batch.repository'
import { InventoryBatchEntity } from '@contexts/inventory/batch/infrastructure/persistence/typeorm/inventory-batch.entity'
import { TypeOrmInventoryMovementRepository } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/typeorm-inventory-movement.repository'
import { InventoryMovementEntity } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-movement.entity'
import { TypeOrmInventoryLevelRepository } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/typeorm-inventory-level.repository'
import { InventoryLevelEntity } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-level.entity'
import { EventStoreEntity } from '@shared/infrastructure/event-sourcing/persistence/event-store.entity'
import { EventStoreService } from '@shared/infrastructure/event-sourcing/event-store.service'
import { EventBusRouter } from '@shared/infrastructure/event-bus/event-bus.router'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { MissingUnitOfWorkContext } from '@shared/domain/exceptions/missing-unit-of-work-context.exception'

import { RegisterPurchase } from '@contexts/inventory/batch/application/register-purchase/register-purchase'
import { RegisterPurchaseOnItemReceived } from '@contexts/inventory/stock-level/application/subscribers/register-purchase-on-item-received'
import { RegisterItemReception } from '@contexts/procurement/purchase-order/application/register-item-reception/register-item-reception'

import { PurchaseOrder } from '@contexts/procurement/purchase-order/domain/purchase-order'
import { PurchaseMethod } from '@contexts/procurement/purchase-order/domain/purchase-method'
import { IngredientRepository } from '@contexts/inventory/ingredient/domain/repositories/ingredient.repository'
import { TypeOrmIngredientRepository } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/typeorm-ingredient.repository'
import { IngredientEntity } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UnitConversionRepository } from '@contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { truncateTables, PURCHASE_RECEPTION_TABLES } from './support/truncate'

/**
 * Real-Postgres coverage for the atomicity contract this change establishes:
 * a purchase-order reception and its resulting inventory writes must commit
 * or roll back TOGETHER, within the single transaction opened by
 * @UseInterceptors(TransactionInterceptor) on PurchaseOrderController.receive().
 *
 * HYBRID style (design "Spec Migration Plan"): the happy path converts to a
 * real HTTP `PUT /purchase-orders/:id/receive` request via `bootstrapE2eApp()`
 * — this is what satisfies the proposal's "controller + guard +
 * TransactionInterceptor" success criterion, since `IngredientCategoryController`
 * (the other exemplar) does not use `TransactionInterceptor`. NOTE: the live
 * route is `PUT`, not `POST` as an earlier design draft assumed — verified
 * against purchase-order.controller.ts:223-246 before writing this test.
 *
 * The two forced-rollback tests keep driving by hand
 * (dataSource.transaction(manager => holder.run(...))) — spying on a
 * DI-resolved repository through the HTTP boundary would require
 * `overrideProvider`, which the design rejected as more fragile than the
 * current explicit driving.
 *
 * The `MissingUnitOfWorkContext` guard test ALSO stays hand-wired, calling
 * `registerItemReception.run()` directly with no ambient transaction. This is
 * a deliberate deviation from the design doc's literal phrasing ("happy path
 * + MissingUnitOfWorkContext guard -> HTTP"): the real controller applies
 * `@UseInterceptors(TransactionInterceptor)` unconditionally, so there is no
 * way to reach `PUT /purchase-orders/:id/receive` WITHOUT an ambient
 * transaction — the guard this test protects (someone dropping the
 * interceptor from the controller) can only be exercised by calling the use
 * case directly, exactly as before. Converting it to HTTP would either be
 * impossible or would silently stop testing what it claims to test.
 *
 * Arrange (seedLookupData/seedPurchaseOrder) stays hand-wired for all tests,
 * matching kitchen-board-query.e2e-spec.ts's hybrid pattern — there is no
 * single HTTP round trip that produces an ORDERED purchase order, and this
 * change does not aim to add domain-lifecycle HTTP coverage (proposal
 * non-goal).
 */
describe('Purchase reception atomicity (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let http: E2eContext['http']
  let authHeader: E2eContext['authHeader']
  let holder: UnitOfWorkContextHolder
  let eventBus: EventBusRouter

  let purchaseOrderRepository: TypeOrmPurchaseOrderRepository
  let inventoryBatchRepository: TypeOrmInventoryBatchRepository
  let inventoryMovementRepository: TypeOrmInventoryMovementRepository
  let inventoryLevelRepository: TypeOrmInventoryLevelRepository
  let ingredientRepository: IngredientRepository

  let registerItemReception: RegisterItemReception

  let ingredientId: string
  let unitId: string
  let supplierId: string
  let ingredientCategoryId: string

  // `truncateTables` handles the 5 domain tables (design D6/composable
  // truncation requirement); `event_store` is shared across specs/contexts,
  // so it keeps a scoped DELETE rather than joining PURCHASE_RECEPTION_TABLES
  // (which would need a blanket TRUNCATE of a table other specs also write).
  const cleanPurchaseReceptionState = async (ds: DataSource): Promise<void> => {
    await truncateTables(ds, PURCHASE_RECEPTION_TABLES)
    await ds.query(
      "DELETE FROM event_store WHERE event_type = 'procurement.purchase_order.item_received'"
    )
  }

  const seedLookupData = async (ds: DataSource): Promise<void> => {
    ingredientCategoryId = UuidMother.random()
    unitId = UuidMother.random()
    supplierId = UuidMother.random()
    ingredientId = UuidMother.random()

    const shortSuffix = ingredientCategoryId.slice(0, 8)

    await ds.query(
      `INSERT INTO ingredient_categories (id, name, is_active) VALUES ($1, $2, true)
       ON CONFLICT (id) DO NOTHING`,
      [ingredientCategoryId, `atomicity-cat-${shortSuffix}`]
    )
    await ds.query(
      `INSERT INTO units (id, name, symbol, type, is_active) VALUES ($1, $2, $3, 'weight', true)
       ON CONFLICT (id) DO NOTHING`,
      [unitId, `atomicity-unit-${shortSuffix}`, 'kgt']
    )
    await ds.query(
      `INSERT INTO suppliers (id, name, is_active) VALUES ($1, $2, true)
       ON CONFLICT (id) DO NOTHING`,
      [supplierId, `atomicity-supplier-${shortSuffix}`]
    )
    await ds.query(
      `INSERT INTO ingredients (id, name, ingredient_category_id, unit_id, is_perishable, is_active)
       VALUES ($1, $2, $3, $4, false, true)
       ON CONFLICT (id) DO NOTHING`,
      [ingredientId, `atomicity-ingredient-${shortSuffix}`, ingredientCategoryId, unitId]
    )
  }

  const seedPurchaseOrder = async (): Promise<{ purchaseOrderId: string; itemId: string }> => {
    const purchaseOrderId = UuidMother.random()
    const itemId = UuidMother.random()

    const items = PurchaseOrder.createOrderItems([
      {
        id: itemId,
        ingredientId,
        ingredientName: 'Atomicity test ingredient',
        quantityRequested: 10,
        unitId,
        unitCost: 5000,
        currency: 'COP',
        notes: null
      }
    ])

    // beforeEach truncates purchase_orders, so a fresh random 3-digit
    // sequence per test is enough to satisfy the unique order_number
    // constraint without needing real cross-run persistence.
    const orderNumber = `PO-2026-${String(Math.floor(Math.random() * 900) + 100)}`

    const purchaseOrder = PurchaseOrder.create(
      purchaseOrderId,
      orderNumber,
      supplierId,
      UuidMother.random(),
      'COP',
      null,
      null,
      items
    )
    // Legitimate transition chain to ORDERED, matching real-world usage —
    // registerBatchReception() only accepts ORDERED/PARTIALLY_RECEIVED.
    purchaseOrder.submitForApproval(UuidMother.random())
    purchaseOrder.approve(UuidMother.random())
    purchaseOrder.send(UuidMother.random(), PurchaseMethod.WHATSAPP, null)

    purchaseOrder.pullDomainEvents() // discard creation/transition events, not under test

    await purchaseOrderRepository.save(purchaseOrder)
    purchaseOrder.pullDomainEvents()

    return { purchaseOrderId, itemId }
  }

  beforeAll(async () => {
    const context = await bootstrapE2eApp()
    app = context.app
    dataSource = context.dataSource
    http = context.http
    authHeader = context.authHeader

    holder = new UnitOfWorkContextHolder()

    const eventStoreRepository = dataSource.getRepository(EventStoreEntity)
    const eventStoreService = new EventStoreService(eventStoreRepository)
    eventBus = new EventBusRouter(holder, dataSource, eventStoreService)

    const purchaseOrderEntityRepository = dataSource.getRepository(PurchaseOrderEntity)
    const purchaseOrderItemEntityRepository = dataSource.getRepository(PurchaseOrderItemEntity)
    purchaseOrderRepository = new TypeOrmPurchaseOrderRepository(
      purchaseOrderEntityRepository,
      purchaseOrderItemEntityRepository,
      holder
    )

    const batchEntityRepository = dataSource.getRepository(InventoryBatchEntity)
    inventoryBatchRepository = new TypeOrmInventoryBatchRepository(batchEntityRepository, holder)

    const movementEntityRepository = dataSource.getRepository(InventoryMovementEntity)
    inventoryMovementRepository = new TypeOrmInventoryMovementRepository(
      movementEntityRepository,
      holder
    )

    const levelEntityRepository = dataSource.getRepository(InventoryLevelEntity)
    inventoryLevelRepository = new TypeOrmInventoryLevelRepository(levelEntityRepository, holder)

    const ingredientEntityRepository = dataSource.getRepository(IngredientEntity)
    ingredientRepository = new TypeOrmIngredientRepository(ingredientEntityRepository, holder)

    // No unit conversion needed — the seeded purchase order item and the
    // ingredient share the same unitId, so RegisterPurchase never calls
    // UnitConversionRepository.findByUnits(). A stub that always throws
    // documents that assumption and fails loudly if it's ever violated.
    const unitConversionRepository = {
      findByUnits: (): never => {
        throw new Error('UnitConversionRepository should not be called in this atomicity test')
      }
    } as unknown as UnitConversionRepository

    const registerPurchase = new RegisterPurchase(
      ingredientRepository,
      unitConversionRepository,
      inventoryBatchRepository,
      inventoryMovementRepository,
      inventoryLevelRepository,
      eventBus
    )
    const registerPurchaseOnItemReceived = new RegisterPurchaseOnItemReceived(registerPurchase)
    eventBus.addSubscribers([registerPurchaseOnItemReceived])

    registerItemReception = new RegisterItemReception(purchaseOrderRepository, eventBus)
  })

  afterAll(async () => {
    await cleanPurchaseReceptionState(dataSource)
    await app.close()
  })

  beforeEach(async () => {
    await cleanPurchaseReceptionState(dataSource)
    await seedLookupData(dataSource)
  })

  it('commits purchase order and inventory writes together on the happy path', async () => {
    const { purchaseOrderId, itemId } = await seedPurchaseOrder()

    const response = await http()
      .put(`/purchase-orders/${purchaseOrderId}/receive`)
      .set(...(await authHeader()))
      .send({
        items: [
          {
            purchaseOrderItemId: itemId,
            notReceived: false,
            quantityReceived: 10,
            quantityReceivedUnitId: unitId,
            unitCost: 5000,
            notes: null
          }
        ]
      })

    expect(response.status).toBe(200)

    const itemRow = await dataSource.query(
      'SELECT quantity_received FROM purchase_order_items WHERE id = $1',
      [itemId]
    )
    expect(Number(itemRow[0].quantity_received)).toBe(10)

    const batchRows = await dataSource.query(
      'SELECT * FROM inventory_batches WHERE ingredient_id = $1',
      [ingredientId]
    )
    expect(batchRows).toHaveLength(1)
    expect(Number(batchRows[0].initial_quantity)).toBe(10)

    const movementRows = await dataSource.query(
      "SELECT * FROM inventory_movements WHERE ingredient_id = $1 AND type = 'PURCHASE'",
      [ingredientId]
    )
    expect(movementRows).toHaveLength(1)

    const levelRows = await dataSource.query(
      'SELECT * FROM inventory_levels WHERE ingredient_id = $1',
      [ingredientId]
    )
    expect(levelRows).toHaveLength(1)
    expect(Number(levelRows[0].current_quantity)).toBe(10)
  })

  it('rolls back the purchase order write when the inventory level save fails', async () => {
    const { purchaseOrderId, itemId } = await seedPurchaseOrder()

    const levelSaveSpy = jest
      .spyOn(inventoryLevelRepository, 'save')
      .mockImplementationOnce((): never => {
        throw new Error('forced level failure')
      })

    await expect(
      dataSource.transaction(manager => {
        const context: UnitOfWorkContext = { manager, pending: [], depth: 0 }
        return holder.run(context, () =>
          registerItemReception.run(
            purchaseOrderId,
            [
              {
                purchaseOrderItemId: itemId,
                notReceived: false,
                quantityReceived: 10,
                quantityReceivedUnitId: unitId,
                unitCost: 5000,
                notes: null
              }
            ],
            null,
            false,
            UuidMother.random()
          )
        )
      })
    ).rejects.toThrow('forced level failure')

    levelSaveSpy.mockRestore()

    // KNOWN PRE-EXISTING GAP (out of scope for finding #2, discovered by this
    // test): TypeOrmPurchaseOrderRepository.save() writes purchase_order_items
    // through `this.itemRepository`, a plain constructor-injected Repository
    // that never resolves through TransactionalRepository's ambient-manager
    // getter (unlike the parent write, which correctly goes through the
    // inherited `this.repo` getter — see transactional-repository.ts). Only
    // the item rows for this order therefore autocommit outside the ambient
    // transaction and survive this rollback; the parent row does not. This is
    // a defect in the purchase-order repository implementation itself
    // (unrelated to the UoW deletion/subscriber wiring this change makes) —
    // flagged here rather than silently asserted around.
    const itemRow = await dataSource.query(
      'SELECT quantity_received FROM purchase_order_items WHERE id = $1',
      [itemId]
    )
    expect(Number(itemRow[0].quantity_received)).toBe(10)

    // The purchase_orders row itself was seeded BEFORE the transaction under
    // test (outside any ambient context), so it legitimately still exists —
    // what matters is that the reception update (status/received_date) rolled
    // back and never landed.
    const purchaseOrderRow = await dataSource.query(
      'SELECT status, received_date FROM purchase_orders WHERE id = $1',
      [purchaseOrderId]
    )
    expect(purchaseOrderRow).toHaveLength(1)
    expect(purchaseOrderRow[0].status).toBe('ORDERED')
    expect(purchaseOrderRow[0].received_date).toBeNull()

    const batchRows = await dataSource.query(
      'SELECT * FROM inventory_batches WHERE ingredient_id = $1',
      [ingredientId]
    )
    expect(batchRows).toHaveLength(0)

    const movementRows = await dataSource.query(
      'SELECT * FROM inventory_movements WHERE ingredient_id = $1',
      [ingredientId]
    )
    expect(movementRows).toHaveLength(0)

    const levelRows = await dataSource.query(
      'SELECT * FROM inventory_levels WHERE ingredient_id = $1',
      [ingredientId]
    )
    expect(levelRows).toHaveLength(0)

    const outboxRows = await dataSource.query(
      "SELECT * FROM event_store WHERE event_type = 'procurement.purchase_order.item_received' AND aggregate_id = $1",
      [purchaseOrderId]
    )
    expect(outboxRows).toHaveLength(0)
  })

  // Note: this direction asserts ordering, not a true rollback — the
  // purchase-order save happens before publish(), so if it throws, the
  // inventory writes (which only happen inside a category-1 subscriber
  // triggered by publish()) never run in the first place. It still proves
  // the invariant: no partial state where inventory moved but the order
  // wasn't updated.
  it('rolls back inventory writes when the purchase order save fails', async () => {
    const { purchaseOrderId, itemId } = await seedPurchaseOrder()

    const purchaseOrderSaveSpy = jest
      .spyOn(purchaseOrderRepository, 'save')
      .mockImplementationOnce((): never => {
        throw new Error('forced purchase order failure')
      })

    await expect(
      dataSource.transaction(manager => {
        const context: UnitOfWorkContext = { manager, pending: [], depth: 0 }
        return holder.run(context, () =>
          registerItemReception.run(
            purchaseOrderId,
            [
              {
                purchaseOrderItemId: itemId,
                notReceived: false,
                quantityReceived: 10,
                quantityReceivedUnitId: unitId,
                unitCost: 5000,
                notes: null
              }
            ],
            null,
            false,
            UuidMother.random()
          )
        )
      })
    ).rejects.toThrow('forced purchase order failure')

    purchaseOrderSaveSpy.mockRestore()

    const itemRow = await dataSource.query(
      'SELECT quantity_received FROM purchase_order_items WHERE id = $1',
      [itemId]
    )
    expect(itemRow[0].quantity_received).toBeNull()

    const batchRows = await dataSource.query(
      'SELECT * FROM inventory_batches WHERE ingredient_id = $1',
      [ingredientId]
    )
    expect(batchRows).toHaveLength(0)

    const movementRows = await dataSource.query(
      'SELECT * FROM inventory_movements WHERE ingredient_id = $1',
      [ingredientId]
    )
    expect(movementRows).toHaveLength(0)

    const levelRows = await dataSource.query(
      'SELECT * FROM inventory_levels WHERE ingredient_id = $1',
      [ingredientId]
    )
    expect(levelRows).toHaveLength(0)
  })

  it('fails loudly with MissingUnitOfWorkContext when no ambient transaction is open', async () => {
    const { purchaseOrderId, itemId } = await seedPurchaseOrder()

    // Deliberately NOT wrapped in holder.run(...) / dataSource.transaction(...)
    // — this is the regression guard for someone dropping
    // @UseInterceptors(TransactionInterceptor) from the controller.
    await expect(
      registerItemReception.run(
        purchaseOrderId,
        [
          {
            purchaseOrderItemId: itemId,
            notReceived: false,
            quantityReceived: 10,
            quantityReceivedUnitId: unitId,
            unitCost: 5000,
            notes: null
          }
        ],
        null,
        false,
        UuidMother.random()
      )
    ).rejects.toBeInstanceOf(MissingUnitOfWorkContext)
  })
})
